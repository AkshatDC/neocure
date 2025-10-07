import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { chatWithRAG } from '../services/ragPipeline.js';
import { prisma } from '../services/prisma.js';

export async function chat(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const { message } = req.body as { message: string };
  const { answer, sources } = await chatWithRAG({ userId, message });
  await prisma.chatLog.create({ data: { userId, query: message, response: answer } });
  res.json({ answer, sources });
}
