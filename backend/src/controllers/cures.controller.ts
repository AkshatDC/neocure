import { Request, Response } from 'express';
import { prisma } from '../services/prisma.js';

export async function getCure(req: Request, res: Response) {
  const { allergyType } = req.params;
  const cure = await prisma.cure.findUnique({ where: { allergyType } });
  if (!cure) return res.status(404).json({ error: 'Cure not found' });
  res.json(cure);
}

export async function upsertCure(req: Request, res: Response) {
  const { allergyType } = req.params;
  const { treatmentPlan, doctorNotes } = req.body as { treatmentPlan: string; doctorNotes?: string };
  const cure = await prisma.cure.upsert({
    where: { allergyType },
    create: { allergyType, treatmentPlan, doctorNotes },
    update: { treatmentPlan, doctorNotes },
  });
  res.json(cure);
}
