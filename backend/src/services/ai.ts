import OpenAI from 'openai';
import { env } from '../server/config/env.js';
import { db, collections } from '../config/firebase.js';
import { retrieveContext } from './ragPipeline.js';

// Initialize OpenAI client
let openai: OpenAI | null = null;
if (env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  });
  console.log('✅ OpenAI API initialized successfully');
} else {
  console.warn('⚠️  OPENAI_API_KEY not set - using mock responses');
}

// Conversation memory cache (use Redis in production)
const conversationMemory = new Map<string, any[]>();
const MAX_MEMORY_LENGTH = 20; // Keep last 20 messages per user

/**
 * Get conversation history for a user
 */
async function getConversationHistory(userId: string): Promise<any[]> {
  try {
    // Try to get from memory cache first
    if (conversationMemory.has(userId)) {
      return conversationMemory.get(userId)!;
    }

    // Get from Firebase
    const chatSnapshot = await db.collection(collections.chatLogs)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const history = chatSnapshot.docs
      .map(doc => doc.data())
      .reverse()
      .flatMap(chat => chat.messages || []);

    // Cache in memory
    conversationMemory.set(userId, history);

    return history;

  } catch (error: any) {
    console.error('Error getting conversation history:', error.message);
    return [];
  }
}

/**
 * Save conversation message to memory and Firebase
 */
async function saveConversationMessage(
  userId: string,
  role: 'PATIENT' | 'DOCTOR',
  patientId: string | undefined,
  message: string,
  response: string,
  context?: string
): Promise<void> {
  try {
    // Update memory cache
    const history = conversationMemory.get(userId) || [];
    history.push(
      { role: 'user', content: message, timestamp: new Date() },
      { role: 'assistant', content: response, timestamp: new Date() }
    );

    // Keep only recent messages
    if (history.length > MAX_MEMORY_LENGTH) {
      history.splice(0, history.length - MAX_MEMORY_LENGTH);
    }

    conversationMemory.set(userId, history);

    // Save to Firebase
    await db.collection(collections.chatLogs).add({
      userId,
      role,
      patientId,
      messages: [
        { role: 'user', content: message, timestamp: new Date() },
        { role: 'assistant', content: response, timestamp: new Date() },
      ],
      context: context || '',
      createdAt: new Date(),
    });

  } catch (error: any) {
    console.error('Error saving conversation:', error.message);
  }
}

/**
 * Enhanced AI chat with RAG context and conversation memory
 */
export async function chatWithAI(params: {
  userId: string;
  patientId?: string;
  message: string;
  role: 'PATIENT' | 'DOCTOR';
}): Promise<{
  response: string;
  sources?: any[];
  context?: string;
}> {
  const { userId, patientId, message, role } = params;

  try {
    // Get conversation history
    const history = await getConversationHistory(userId);

    // Retrieve relevant medical context using RAG
    let medicalContext = '';
    let sources: any[] = [];

    if (patientId) {
      const ragResults = await retrieveContext(patientId, message);
      medicalContext = ragResults.chunks.join('\n\n');
      sources = ragResults.metadata;
    }

    // Build role-specific system prompt
    const systemPrompt = buildSystemPrompt(role, medicalContext);

    // Prepare messages for OpenAI
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10).map(h => ({
        role: h.role as 'user' | 'assistant',
        content: h.content
      })),
      { role: 'user', content: message },
    ];

    // Call OpenAI API
    if (openai) {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages,
        temperature: role === 'PATIENT' ? 0.3 : 0.7, // More conservative for patients
        max_tokens: 800,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      });

      const response = completion.choices[0].message.content || 'I apologize, but I couldn\'t generate a response.';

      // Save conversation
      await saveConversationMessage(userId, role, patientId, message, response, medicalContext);

      return {
        response,
        sources,
        context: medicalContext,
      };
    }

    // Fallback mock response
    console.warn('Using fallback AI response');
    const fallbackResponse = buildFallbackResponse(role, message, medicalContext);

    await saveConversationMessage(userId, role, patientId, message, fallbackResponse, medicalContext);

    return {
      response: fallbackResponse,
      sources: [],
      context: medicalContext,
    };

  } catch (error: any) {
    console.error('AI chat error:', error.message);

    const errorResponse = `I apologize, but I encountered an error processing your request. Please try again or contact support if the issue persists.`;

    await saveConversationMessage(userId, role, patientId, message, errorResponse);

    return {
      response: errorResponse,
      sources: [],
    };
  }
}

/**
 * Build role-specific system prompt
 */
function buildSystemPrompt(role: 'PATIENT' | 'DOCTOR', context: string): string {
  const baseGuidelines = `
Guidelines:
- Be helpful, accurate, and professional
- Reference specific medical information when available
- Maintain appropriate medical communication standards
- Never diagnose or prescribe medications`;

  if (role === 'PATIENT') {
    return `You are a helpful medical assistant for patients. Provide informational guidance based on their medical records and general health knowledge. Never diagnose, prescribe, or give medical advice.

Patient's Medical Context:
${context}

${baseGuidelines}
- Be conversational and empathetic
- Explain medical terms in simple, understandable language
- Encourage consulting healthcare providers for medical decisions
- Focus on general health information and education
- Stay within scope of patient education`;
  }

  return `You are an AI assistant for healthcare professionals. Help doctors analyze patient data, identify patterns, and provide clinical insights based on medical records.

Patient's Medical Context:
${context}

${baseGuidelines}
- Provide evidence-based clinical reasoning
- Reference specific medical records, dates, and test results
- Suggest appropriate follow-up questions or diagnostic tests
- Highlight concerning patterns, drug interactions, or risk factors
- Maintain professional medical communication standards
- Focus on clinical decision support`;
}

/**
 * Build fallback response when AI is unavailable
 */
function buildFallbackResponse(role: 'PATIENT' | 'DOCTOR', message: string, context: string): string {
  const lowerMessage = message.toLowerCase();

  // Common patient queries
  if (role === 'PATIENT') {
    if (lowerMessage.includes('side effect') || lowerMessage.includes('reaction')) {
      return `I understand you're concerned about medication side effects. Based on your medical records, here's what I can share:

${context ? 'Your records show: ' + context.substring(0, 500) + '...' : 'I don\'t have specific information about your medications in my current context.'}

⚠️ Important: This is general information only. Please consult your healthcare provider about any side effects or concerns you\'re experiencing. They can provide personalized medical advice based on your complete health history.`;
    }

    if (lowerMessage.includes('interaction') || lowerMessage.includes('combine')) {
      return `Regarding medication interactions, I can help you understand general principles:

${context ? 'Your current medications: ' + context.substring(0, 300) + '...' : 'I don\'t have access to your current medication list.'}

💡 General advice: Always check with your pharmacist or doctor before combining medications. They have access to your complete medical history and can identify potential interactions.

For personalized guidance, please consult your healthcare provider.`;
    }

    if (lowerMessage.includes('appointment') || lowerMessage.includes('doctor')) {
      return `For appointments and scheduling:

📅 Contact your healthcare provider's office directly
📞 Call during business hours
🌐 Check their patient portal if available
📧 Email if that's their preferred method

They can address your specific health concerns and provide personalized medical guidance.`;
    }
  }

  // Common doctor queries
  if (role === 'DOCTOR') {
    if (lowerMessage.includes('patient') && lowerMessage.includes('record')) {
      return `To access patient records:

🔒 Ensure you have proper authorization
📋 Check the patient's chart in your EMR system
📊 Review recent lab results and vital signs
💊 Check current medications and allergies

${context ? 'Patient context: ' + context.substring(0, 400) + '...' : 'I don\'t have specific patient data in my current context.'}

For clinical decisions, please refer to your institution's protocols and the patient's complete medical record.`;
    }

    if (lowerMessage.includes('guideline') || lowerMessage.includes('protocol')) {
      return `For clinical guidelines:

📚 Refer to evidence-based protocols
🏥 Follow your institution's standards
🔄 Check for updates in medical literature
👥 Consult with colleagues when needed

Evidence-based medicine should guide all clinical decisions. Stay current with professional guidelines in your specialty.`;
    }
  }

  // Generic fallback
  return `Thank you for your question. I'm here to help with general health information and guidance.

${context ? 'Based on available information: ' + context.substring(0, 300) + '...' : ''}

For personalized medical advice, please consult with your healthcare provider. They have access to your complete medical history and can provide appropriate guidance for your specific situation.

If you have questions about medication side effects, drug interactions, or general health topics, feel free to ask!`;
}

// Legacy functions for backward compatibility
export async function aiAllergyRisk(params: { userId: string; recordId?: string; symptoms: string[]; context: any }) {
  return {
    risk_score: 'Amber',
    explanation: 'Based on patient history and symptoms, moderate allergy risk detected.',
    alternatives: [{ name: 'Alternative Med A', notes: 'Safer option with fewer side effects' }],
    precautions: ['Avoid exposure to allergen X', 'Monitor symptoms closely'],
  };
}

export async function aiMedicineAlternatives(params: { medicineName: string; context: any }) {
  return {
    original: params.medicineName,
    alternatives: [
      { name: 'Alternative A', benefits: 'Lower side effects', risks: 'Minimal', dosage: '10mg daily' },
      { name: 'Alternative B', benefits: 'Better efficacy', risks: 'Moderate', dosage: '5mg twice daily' },
    ],
  };
}

export async function aiSymptomCheck(params: { symptoms: string[]; context: any }) {
  return {
    possibleAllergies: [
      { name: 'Pollen Allergy', confidence: 0.85, explanation: 'Symptoms match seasonal allergic rhinitis' },
      { name: 'Dust Mite Allergy', confidence: 0.65, explanation: 'Indoor symptoms suggest dust sensitivity' },
    ],
  };
}

export async function getExplanationById(id: string) {
  const risk = await db.collection(collections.drugInteractions).doc(id).get();
  if (!risk.exists) return null;

  const data = risk.data();
  return {
    id: risk.id,
    riskScore: data?.severity,
    explanation: data?.aiExplanation,
    alternatives: data?.saferAlternatives,
    precautions: ['Monitor for adverse effects'],
    createdAt: data?.createdAt?.toDate(),
  };
}

/**
 * Generate natural language explanation for drug interactions using AI
 */
export async function generateInteractionExplanation(params: {
  drugs: string[];
  severity: string;
  description: string;
}): Promise<string> {
  // Use OpenAI if available
  if (openai) {
    try {
      const prompt = `You are a clinical pharmacist AI assistant. Analyze the following drug interaction:

Drugs: ${params.drugs.join(', ')}
Severity: ${params.severity}
Description: ${params.description}

Provide a detailed, patient-friendly explanation including:
1. What the interaction means
2. Why it occurs (mechanism)
3. What symptoms to watch for
4. Recommendations for the patient
5. When to seek medical attention

Keep the tone professional but accessible. Format with markdown.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          { role: 'system', content: 'You are a clinical pharmacist providing drug interaction counseling.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 800,
      });

      return completion.choices[0].message.content || 'Unable to generate explanation';
    } catch (error: any) {
      console.error('OpenAI API error:', error.message);
      // Fall through to mock response
    }
  }

  // Fallback mock explanation
  console.warn('Using fallback interaction explanation');
  return `**Drug Interaction Analysis**

**Medications Involved**: ${params.drugs.join(', ')}

**Severity Level**: ${params.severity}

**Clinical Summary**:
${params.description}

**Mechanism**:
When ${params.drugs[0]} is combined with ${params.drugs.slice(1).join(' and ')}, there may be pharmacokinetic or pharmacodynamic interactions that could affect drug efficacy or safety.

**Recommendations**:
1. Monitor patient closely for adverse effects
2. Consider dose adjustments if necessary
3. Consult with a clinical pharmacist for personalized guidance
4. Review patient's complete medication list regularly

*Generated by NeoCure AI Assistant*`;
}
