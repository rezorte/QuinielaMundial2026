import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export type AuthUser = { playerId: string; alias: string };

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function normalizeName(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

export function playerIdFor(name: string, year: string) {
  return crypto.createHash('sha256').update(`${normalizeName(name)}|${year}`).digest('hex');
}

export function signPlayerToken(user: AuthUser) {
  return jwt.sign(user, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '180d' });
}

export function requirePlayer(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'AUTH_REQUIRED' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as AuthUser;
    next();
  } catch {
    res.status(401).json({ error: 'INVALID_TOKEN' });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const pin = req.headers['x-admin-pin'];
  if (!pin || pin !== (process.env.ADMIN_PIN || '2026')) {
    return res.status(401).json({ error: 'ADMIN_REQUIRED' });
  }
  next();
}
