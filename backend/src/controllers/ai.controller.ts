import { Request, Response } from 'express';
import { prisma } from '../services/prisma.js';
import { aiAllergyRisk, aiMedicineAlternatives, aiSymptomCheck, getExplanationById } from '../services/ai.js';
import { AuthRequest } from '../middleware/auth.js';

export async function allergyDetection(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const { recordId, symptoms = [], context = {} } = req.body as any;
  const { risk_score, explanation, alternatives, precautions } = await aiAllergyRisk({ userId, recordId, symptoms, context });
  const saved = await prisma.allergyRisk.create({
    data: { userId, recordId, riskScore: risk_score, explanation, alternatives, precautions },
  });
  res.json({ id: saved.id, risk_score, explanation, alternatives, precautions });
}

export async function medicineAlternatives(req: AuthRequest, res: Response) {
  const { medicineName, context = {} } = req.body as any;
  const result = await aiMedicineAlternatives({ medicineName, context });
  res.json(result);
}

export async function symptomCheck(req: AuthRequest, res: Response) {
  const { symptoms = [], context = {} } = req.body as any;
  const result = await aiSymptomCheck({ symptoms, context });
  res.json(result);
}

export async function getExplanation(req: Request, res: Response) {
  const id = req.params.id;
  const explanation = await getExplanationById(id);
  if (!explanation) return res.status(404).json({ error: 'Not found' });
  res.json(explanation);
}
