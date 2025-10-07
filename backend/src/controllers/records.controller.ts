import { Request, Response } from 'express';
import { prisma } from '../services/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

export async function listRecords(req: AuthRequest, res: Response) {
  const records = await prisma.medicalRecord.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: 'desc' } });
  res.json(records);
}

export async function createRecord(req: AuthRequest, res: Response) {
  const { fileUrl, extractedText, symptoms = [], pastConditions = [], currentMedications = [], allergies = [] } = req.body as any;
  const record = await prisma.medicalRecord.create({
    data: {
      userId: req.user!.id,
      fileUrl,
      extractedText,
      symptoms,
      pastConditions,
      currentMedications,
      allergies,
    },
  });
  res.status(201).json(record);
}

export async function getRecord(req: Request, res: Response) {
  const { id } = req.params;
  const record = await prisma.medicalRecord.findUnique({ where: { id } });
  if (!record) return res.status(404).json({ error: 'Record not found' });
  res.json(record);
}
