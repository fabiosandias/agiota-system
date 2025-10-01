import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';

export const hashPassword = async (plain: string): Promise<string> => {
  return bcrypt.hash(plain, env.BCRYPT_SALT_ROUNDS);
};

export const comparePassword = async (plain: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(plain, hash);
};
