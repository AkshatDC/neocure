import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { chatWithAI } from '../services/ai.js';
import { db, collections } from '../config/firebase.js';

/**
 * Chat with AI assistant
 */
export async function chat(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { message, patientId } = req.body as { message: string; patientId?: string };
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    const userRole = req.user!.role as 'PATIENT' | 'DOCTOR';
    const targetPatientId = patientId || (userRole === 'PATIENT' ? userId : undefined);
    
    console.log(`💬 Chat request from ${userRole}: "${message.substring(0, 50)}..."`);
    
    // Call AI service with RAG context
    const result = await chatWithAI({
      userId,
      patientId: targetPatientId,
      message,
      role: userRole,
    });
    
    console.log(`✅ AI response generated (${result.response.length} chars)`);
    
    return res.json({
      answer: result.response,
      sources: result.sources || [],
      context: result.context,
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    return res.status(500).json({ 
      error: 'Failed to process chat message',
      message: error.message,
      answer: 'I apologize, but I encountered an error. Please try again.',
    });
  }
}

/**
 * Get chat history
 */
export async function getChatHistory(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { limit = 20 } = req.query;
    
    const snapshot = await db.collection(collections.chatLogs)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(Number(limit))
      .get();
    
    const history = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
    }));
    
    return res.json(history.reverse());
  } catch (error: any) {
    console.error('Error fetching chat history:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch chat history',
      message: error.message 
    });
  }
}
