import createHttpError from 'http-errors';
import crypto from 'node:crypto';
import { prisma } from '../config/prisma.js';
import { comparePassword, hashPassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';
import { env } from '../config/env.js';
import { mailService } from './mail.service.js';

const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw createHttpError(401, 'Invalid email or password');
  }

  const valid = await comparePassword(password, user.passwordHash);

  if (!valid) {
    throw createHttpError(401, 'Invalid email or password');
  }

  const token = signToken({
    sub: user.id,
    email: user.email
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name
    }
  };
};

const getCurrentUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!user) {
    throw createHttpError(404, 'Usuário não encontrado');
  }

  return user;
};

const PASSWORD_RESET_EXPIRATION_MINUTES = 60;

const requestPasswordReset = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // Não revelar se o usuário existe
    return;
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRATION_MINUTES * 60 * 1000);

  await prisma.$transaction([
    prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true }
    }),
    prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt
      }
    })
  ]);

  const resetLink = `${env.APP_URL}/reset-password?token=${rawToken}`;

  const html = `
    <p>Olá, ${user.name}!</p>
    <p>Recebemos uma solicitação para redefinir sua senha no <strong>Agiota System</strong>.</p>
    <p>Clique no botão abaixo para criar uma nova senha. O link expira em ${PASSWORD_RESET_EXPIRATION_MINUTES} minutos.</p>
    <p><a href="${resetLink}" style="display:inline-block;padding:12px 20px;background:#1d4ed8;color:#fff;text-decoration:none;border-radius:6px">Redefinir senha</a></p>
    <p>Se você não solicitou, ignore este e-mail.</p>
  `;

  await mailService.sendMail({
    to: user.email,
    subject: 'Recuperação de senha - Agiota System',
    html,
    text: `Para redefinir sua senha acesse: ${resetLink}`
  });
};

const resetPassword = async (token: string, newPassword: string) => {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const tokenRecord = await prisma.passwordResetToken.findUnique({
    where: { tokenHash }
  });

  if (!tokenRecord || tokenRecord.used || tokenRecord.expiresAt < new Date()) {
    throw createHttpError(400, 'Token inválido ou expirado');
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: tokenRecord.userId },
      data: { passwordHash }
    }),
    prisma.passwordResetToken.update({
      where: { tokenHash },
      data: { used: true }
    })
  ]);
};

export const authService = {
  login,
  getCurrentUser,
  requestPasswordReset,
  resetPassword
};
