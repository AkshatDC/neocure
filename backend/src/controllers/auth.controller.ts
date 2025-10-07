import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../services/prisma.js';
import { env } from '../server/config/env.js';

const signToken = (payload: object, expiresIn = env.JWT_EXPIRES_IN) =>
  jwt.sign(payload as any, env.JWT_SECRET, { expiresIn });

export async function register(req: Request, res: Response) {
  const { name, email, password, role } = req.body as { name: string; email: string; password: string; role?: 'PATIENT'|'DOCTOR'|'ADMIN' };
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ error: 'Email already in use' });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { name, email, passwordHash, role: role || 'PATIENT' } });
  const accessToken = signToken({ sub: user.id, role: user.role });
  return res.status(201).json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, accessToken });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as { email: string; password: string };
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const accessToken = signToken({ sub: user.id, role: user.role });
  return res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, accessToken });
}

export async function logout(_req: Request, res: Response) {
  // Stateless JWT: client discards token; consider server-side denylist if required
  return res.json({ ok: true });
}

export async function refresh(req: Request, res: Response) {
  const { token } = req.body as { token: string };
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;
    const accessToken = signToken({ sub: decoded.sub, role: decoded.role });
    return res.json({ accessToken });
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
