import { Request, Response } from 'express';
import { prisma } from '../services/prisma.js';

export async function listUsers(_req: Request, res: Response) {
  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, createdAt: true } });
  res.json(users);
}

export async function analytics(_req: Request, res: Response) {
  const [totalUsers, totalRecords, totalAllergyRisks, riskDistribution] = await Promise.all([
    prisma.user.count(),
    prisma.medicalRecord.count(),
    prisma.allergyRisk.count(),
    prisma.allergyRisk.groupBy({ by: ['riskScore'], _count: true }),
  ]);
  res.json({ totalUsers, totalRecords, totalAllergyRisks, riskDistribution });
}
