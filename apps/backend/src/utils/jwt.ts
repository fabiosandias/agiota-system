import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';

const DEFAULT_EXPIRATION = '15m';

export interface JwtPayload {
  sub: string;
  email: string;
  role: 'admin' | 'operator' | 'viewer';
}

const secret: Secret = env.JWT_SECRET;

export const signToken = (payload: JwtPayload, expiresIn: string = DEFAULT_EXPIRATION): string => {
  const options: SignOptions = { expiresIn: expiresIn as SignOptions['expiresIn'] };
  return jwt.sign(payload, secret, options);
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, secret) as JwtPayload;
};
