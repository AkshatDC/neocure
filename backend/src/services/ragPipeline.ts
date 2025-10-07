import { OpenAIEmbeddings } from '@langchain/openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { env } from '../server/config/env.js';
import { db, collections } from '../config/firebase.js';

// Initialize services
let embeddings: OpenAIEmbeddings | null = null;
let pinecone: Pinecone | null = null;
let index: any = null;

async function initializeServices() {
  if (embeddings && pinecone && index) return;

  // Initialize OpenAI embeddings
  if (env.OPENAI_API_KEY) {
    embeddings = new OpenAIEmbeddings({
      openAIApiKey: env.OPENAI_API_KEY,
      modelName: 'text-embedding-3-small', // More cost-effective
    });
    console.log('✅ OpenAI embeddings initialized');
  }

  // Initialize Pinecone
  if (env.PINECONE_API_KEY) {
    pinecone = new Pinecone({
      apiKey: env.PINECONE_API_KEY,
    });

    if (env.PINECONE_INDEX_NAME) {
      index = pinecone.index(env.PINECONE_INDEX_NAME);
      console.log(`✅ Pinecone index connected: ${env.PINECONE_INDEX_NAME}`);
    }
  }
}

/**
 * Split text into chunks for vectorization
 */
async function createTextChunks(text: string, chunkSize: number = 1000, overlap: number = 200): Promise<string[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap: overlap,
    separators: ['\n\n', '\n', '. ', ' ', ''],
  });

  const chunks = await splitter.splitText(text);
  console.log(`📄 Created ${chunks.length} text chunks`);
  return chunks;
}

/**
 * Generate embeddings for text chunks
 */
async function generateEmbeddings(chunks: string[]): Promise<number[][]> {
  if (!embeddings) {
    throw new Error('Embeddings service not initialized');
  }

  console.log(`🧮 Generating embeddings for ${chunks.length} chunks...`);
  const embeddingsArray = await embeddings.embedDocuments(chunks);
  console.log(`✅ Generated ${embeddingsArray.length} embeddings`);
  return embeddingsArray;
}

/**
 * Store document chunks and embeddings in Pinecone
 */
async function storeInPinecone(
  documentId: string,
  patientId: string,
  chunks: string[],
  embeddingsArray: number[][]
): Promise<void> {
  if (!index) {
    throw new Error('Pinecone index not initialized');
  }

  const vectors = chunks.map((chunk, i) => ({
    id: `${documentId}-${i}`,
    values: embeddingsArray[i],
    metadata: {
      documentId,
      patientId,
      text: chunk,
      chunkIndex: i,
      timestamp: new Date().toISOString(),
    },
  }));

  // Upsert in batches of 100
  const batchSize = 100;
  for (let i = 0; i < vectors.length; i += batchSize) {
    const batch = vectors.slice(i, i + batchSize);
    await index.upsert(batch);
    console.log(`📦 Upserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(vectors.length / batchSize)}`);
  }

  console.log(`✅ Stored ${vectors.length} vectors in Pinecone`);
}

/**
 * Index a document for RAG (Retrieval-Augmented Generation)
 */
export async function indexDocument(
  documentId: string,
  patientId: string,
  text: string
): Promise<void> {
  await initializeServices();

  if (!text || text.trim().length === 0) {
    console.warn(`⚠️ Empty text for document ${documentId}, skipping indexing`);
    return;
  }

  try {
    // Step 1: Create text chunks
    const chunks = await createTextChunks(text);

    if (chunks.length === 0) {
      console.warn(`⚠️ No chunks created for document ${documentId}`);
      return;
    }

    // Step 2: Generate embeddings
    const embeddingsArray = await generateEmbeddings(chunks);

    if (embeddingsArray.length !== chunks.length) {
      throw new Error('Embeddings count mismatch with chunks count');
    }

    // Step 3: Store in Pinecone
    await storeInPinecone(documentId, patientId, chunks, embeddingsArray);

    // Step 4: Save embedding metadata to Firebase
    const embeddingPromises = chunks.map(async (chunk, i) => {
      return db.collection(collections.vectorEmbeddings).add({
        documentId,
        patientId,
        chunkText: chunk,
        pineconeId: `${documentId}-${i}`,
        chunkIndex: i,
        createdAt: new Date(),
      });
    });

    await Promise.all(embeddingPromises);
    console.log(`✅ Document ${documentId} fully indexed for RAG`);

  } catch (error: any) {
    console.error(`❌ Failed to index document ${documentId}:`, error.message);

    // Update document status to failed
    await db.collection(collections.medicalDocuments)
      .where('patientId', '==', patientId)
      .where('fileName', '==', documentId) // This might need adjustment
      .limit(1)
      .get()
      .then(snapshot => {
        if (!snapshot.empty) {
          snapshot.docs[0].ref.update({
            ocrStatus: 'FAILED',
            error: error.message,
          });
        }
      });

    throw error;
  }
}

/**
 * Retrieve relevant document chunks for a query
 */
export async function retrieveContext(
  patientId: string,
  query: string,
  topK: number = 5
): Promise<{
  chunks: string[];
  metadata: any[];
  scores: number[];
}> {
  await initializeServices();

  if (!embeddings || !index) {
    console.warn('⚠️ RAG services not available, returning empty context');
    return { chunks: [], metadata: [], scores: [] };
  }

  try {
    // Step 1: Generate embedding for query
    const queryEmbedding = await embeddings.embedQuery(query);

    // Step 2: Search Pinecone
    const results = await index.query({
      vector: queryEmbedding,
      topK,
      filter: { patientId }, // Only retrieve patient's documents
      includeMetadata: true,
      includeValues: false,
    });

    // Step 3: Format results
    const chunks = results.matches?.map(match => match.metadata?.text as string) || [];
    const metadata = results.matches?.map(match => match.metadata) || [];
    const scores = results.matches?.map(match => match.score || 0) || [];

    console.log(`🔍 Retrieved ${chunks.length} relevant chunks for patient ${patientId}`);

    return { chunks, metadata, scores };

  } catch (error: any) {
    console.error('RAG retrieval error:', error.message);
    return { chunks: [], metadata: [], scores: [] };
  }
}

/**
 * Get document statistics for a patient
 */
export async function getPatientDocumentStats(patientId: string): Promise<{
  totalDocuments: number;
  totalChunks: number;
  lastUpdated: Date | null;
}> {
  try {
    // Get documents count
    const documentsSnapshot = await db.collection(collections.medicalDocuments)
      .where('patientId', '==', patientId)
      .where('ocrStatus', '==', 'COMPLETED')
      .get();

    // Get chunks count
    const chunksSnapshot = await db.collection(collections.vectorEmbeddings)
      .where('patientId', '==', patientId)
      .get();

    // Get last updated
    let lastUpdated: Date | null = null;
    if (!documentsSnapshot.empty) {
      const timestamps = documentsSnapshot.docs.map(doc => doc.data().uploadedAt?.toDate());
      lastUpdated = new Date(Math.max(...timestamps.map(t => t.getTime())));
    }

    return {
      totalDocuments: documentsSnapshot.size,
      totalChunks: chunksSnapshot.size,
      lastUpdated,
    };

  } catch (error: any) {
    console.error('Error getting document stats:', error.message);
    return { totalDocuments: 0, totalChunks: 0, lastUpdated: null };
  }
}

/**
 * Delete all vectors for a document (when document is deleted)
 */
export async function deleteDocumentVectors(documentId: string): Promise<void> {
  await initializeServices();

  if (!index) {
    console.warn('Pinecone index not available for deletion');
    return;
  }

  try {
    // Get all vector IDs for this document
    const vectorsSnapshot = await db.collection(collections.vectorEmbeddings)
      .where('documentId', '==', documentId)
      .get();

    const vectorIds = vectorsSnapshot.docs.map(doc => doc.data().pineconeId);

    if (vectorIds.length > 0) {
      await index.deleteMany(vectorIds);
      console.log(`🗑️ Deleted ${vectorIds.length} vectors for document ${documentId}`);
    }

    // Delete embedding records from Firebase
    const deletePromises = vectorsSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(deletePromises);

  } catch (error: any) {
    console.error('Error deleting document vectors:', error.message);
  }
}

/**
 * Enhanced chat with RAG context
 */
export async function chatWithRAG(params: {
  userId: string;
  patientId?: string;
  message: string;
  role: 'PATIENT' | 'DOCTOR';
}) {
  const { userId, patientId, message, role } = params;

  // Get conversation history from Firebase
  const chatSnapshot = await db.collection(collections.chatLogs)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(10)
    .get();

  const history = chatSnapshot.docs
    .map(doc => doc.data())
    .reverse();

  // Retrieve relevant context from RAG
  let context = '';
  if (patientId) {
    const relevantDocs = await retrieveContext(patientId, message);
    context = relevantDocs.chunks.join('\n\n');
  }

  // Build system prompt based on role
  const systemPrompt = role === 'PATIENT'
    ? `You are a helpful medical assistant for patients. Provide informational guidance based on their medical records. Never diagnose or prescribe.

Patient's Medical Context:
${context}

Guidelines:
- Be conversational and empathetic
- Reference specific information from their records when relevant
- Explain medical terms in simple language
- Encourage consulting healthcare providers for medical decisions
- Stay within scope of general health information`
    : `You are an AI assistant for doctors. Help them analyze patient data, identify patterns, and provide clinical insights.

Patient's Medical Context:
${context}

Guidelines:
- Provide evidence-based clinical reasoning
- Reference specific medical records and dates
- Suggest appropriate follow-up questions or tests
- Highlight concerning patterns or drug interactions
- Maintain professional medical communication`;

  // Call OpenAI if available
  if (env.OPENAI_API_KEY) {
    try {
      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          ...history.map(h => ({ role: h.role as 'user' | 'assistant', content: h.content })),
          { role: 'user', content: message },
        ],
        temperature: 0.7,
        max_tokens: 800,
      });

      const response = completion.choices[0].message.content || '';

      // Save conversation to Firebase
      await db.collection(collections.chatLogs).add({
        userId,
        role,
        patientId,
        messages: [
          ...history.map(h => ({ role: h.role, content: h.content, timestamp: h.timestamp })),
          { role: 'user', content: message, timestamp: new Date() },
          { role: 'assistant', content: response, timestamp: new Date() },
        ],
        context: context,
        createdAt: new Date(),
      });

      return {
        answer: response,
        sources: relevantDocs?.metadata || [],
        context: context,
      };

    } catch (error: any) {
      console.error('OpenAI API error:', error.message);
      // Fall through to mock response
    }
  }

  // Fallback mock response
  console.warn('Using fallback RAG response');
  return {
    answer: `Based on your medical history, I can help you understand your health information. [Mock response - integrate OpenAI API for real answers]`,
    sources: [],
    context: '',
  };
}

// Export legacy function for backward compatibility
export async function embedAndStoreDocument(params: { userId: string; recordId: string; text: string }) {
  console.log('embedAndStoreDocument called (legacy)', params);
  return { ok: true };
}
