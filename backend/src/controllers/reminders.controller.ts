import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { prisma } from '../services/prisma.js';

export async function listReminders(req: AuthRequest, res: Response) {
  const items = await prisma.reminder.findMany({ where: { userId: req.user!.id }, orderBy: { time: 'asc' } });
  res.json(items);
}

export async function createReminder(req: AuthRequest, res: Response) {
  const { title, description, time } = req.body as { title: string; description?: string; time: string };
  const item = await prisma.reminder.create({ data: { userId: req.user!.id, title, description, time: new Date(time) } });
  res.status(201).json(item);
}

export async function updateReminder(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { title, description, time, status } = req.body as any;
  const item = await prisma.reminder.update({ where: { id }, data: { title, description, time: time ? new Date(time) : undefined, status } });
  res.json(item);
}

export async function deleteReminder(req: AuthRequest, res: Response) {
  const { id } = req.params;
  await prisma.reminder.delete({ where: { id } });
  res.json({ ok: true });
}
