import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { Papel } from '@prisma/client';

export type AccessTokenPayload = {
  sub: string;
  email: string;
  nome: string;
  papel: Papel;
};

const ACCESS_TTL = '1h';
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: ACCESS_TTL });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
}

export function createRefreshTokenValue(): string {
  return crypto.randomBytes(48).toString('hex');
}

export function refreshTokenExpiresAt(): Date {
  return new Date(Date.now() + REFRESH_TTL_MS);
}
