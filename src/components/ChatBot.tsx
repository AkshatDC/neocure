import { useState } from 'react';
import { MessageCircle, X, Send, Loader } from 'lucide-react';
import { ChatMessage } from '../types';
import { drugInteractionsApi } from '../api/drugInteractions';

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your NeoCure AI assistant. I can help with medication information, drug interactions, allergies, and health guidance. How can I help you today?',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const extractDrugNames = (text: string): string[] => {
    const commonDrugs = ['warfarin', 'aspirin', 'ibuprofen', 'metformin', 'lisinopril', 'atorvastatin', 'amoxicillin', 'omeprazole', 'levothyroxine', 'amlodipine'];
    const words = text.toLowerCase().split(/\s+/);
    return words.filter(word => commonDrugs.includes(word.replace(/[.,!?]/g, '')));
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages([...messages, userMessage]);
    const query = inputMessage;
    setInputMessage('');
    setIsProcessing(true);

    try {
      const response = await getAIResponse(query);
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      const errorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsProcessing(false);
    }
  };

  const getAIResponse = async (query: string): Promise<string> => {
    const lowerQuery = query.toLowerCase();

    // Check for drug interaction queries
    if (lowerQuery.includes('interact') || lowerQuery.includes('combine') || lowerQuery.includes('together')) {
      const drugs = extractDrugNames(query);
      if (drugs.length >= 2) {
        try {
          const result = await drugInteractionsApi.check(drugs);
          if (result.interactionDetected) {
            return `⚠️ **Drug Interaction Detected**\n\n**Severity:** ${result.severity}\n\n${result.description}\n\n${result.saferAlternatives.length > 0 ? `**Safer Alternatives:** ${result.saferAlternatives.join(', ')}` : ''}\n\nPlease consult with your healthcare provider before combining these medications.`;
          } else {
            return `✅ Based on available data, ${drugs.join(' and ')} do not have significant known interactions. However, always consult your healthcare provider before starting any new medication.`;
          }
        } catch (error) {
          return `I found ${drugs.join(' and ')} in your query. To check for interactions, please use the Drug Interaction Checker in the main menu for detailed analysis.`;
        }
      } else if (drugs.length === 1) {
        return `I detected ${drugs[0]} in your query. To check for drug interactions, please mention at least two medications. For example: "Can I take warfarin and aspirin together?"`;
      }
    }

    if (lowerQuery.includes('side effect') || lowerQuery.includes('allerg')) {
      return 'I can help you understand medication side effects and allergies. Please check your Risk Dashboard for detailed assessments, or describe your symptoms and I\'ll provide relevant information.';
    } else if (lowerQuery.includes('reminder')) {
      return 'You can set up medication reminders in the Medicine Reminders section. Would you like me to guide you through setting one up?';
    } else if (lowerQuery.includes('alternative') || lowerQuery.includes('replace')) {
      return 'Based on your risk assessment, I can suggest safer alternative medications. Check the Medication Alternatives section for personalized recommendations.';
    } else if (lowerQuery.includes('prescription')) {
      return 'You can view and manage your prescriptions in the Prescriptions section. Doctors can add new prescriptions with automatic interaction checking.';
    } else {
      return 'I\'m here to assist with:\n• Drug interaction checking (mention 2+ medications)\n• Medication side effects and allergies\n• Prescription management\n• Medicine reminders\n• Health guidance\n\nWhat would you like to know more about?';
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-8 right-8 w-16 h-16 rounded-full gradient-blue-purple glow-blue flex items-center justify-center transition-all hover:scale-110 z-50"
        >
          <MessageCircle className="w-7 h-7 text-white" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-8 right-8 w-96 h-[32rem] glass rounded-3xl glow-soft flex flex-col z-50">
          <div className="gradient-blue-purple p-4 rounded-t-3xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-6 h-6 text-white" />
              <div>
                <h3 className="font-semibold text-white">NeoCure AI Assistant</h3>
                <p className="text-xs text-white/80">Always here to help</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 rounded-full p-1 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'gradient-blue-purple text-white'
                      : 'bg-white/50 text-gray-800'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-white/50 text-gray-800 p-3 rounded-2xl flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200/50">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask me anything..."
                className="flex-1 px-4 py-2 rounded-full bg-white/50 border border-gray-200/50 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button
                onClick={handleSendMessage}
                className="w-10 h-10 rounded-full gradient-blue-purple flex items-center justify-center hover:scale-105 transition"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
