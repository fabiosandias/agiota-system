import crypto from 'node:crypto';
import createHttpError from 'http-errors';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import { signToken } from '../utils/jwt.js';
import { comparePassword, hashPassword } from '../utils/password.js';
import { mailService } from './mail.service.js';

const ACCESS_TOKEN_EXPIRATION = '15m';
const REFRESH_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 dias

const hashRefreshToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

const issueRefreshToken = async (userId: string, options: { invalidateExisting?: boolean } = {}) => {
  if (options.invalidateExisting) {
    await prisma.refreshToken.deleteMany({ where: { userId } });
  }

  const rawToken = crypto.randomBytes(64).toString('hex');
  const tokenHash = hashRefreshToken(rawToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt
    }
  });

  return { token: rawToken, expiresAt };
};

const buildAuthUserResponse = (user: {
  id: string;
  email: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: 'admin' | 'operator' | 'viewer';
  avatar: string | null;
}) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  firstName: user.firstName,
  lastName: user.lastName,
  phone: user.phone,
  role: user.role,
  avatar: user.avatar
});

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

  const accessToken = signToken(
    {
      sub: user.id,
      email: user.email,
      role: user.role
    },
    ACCESS_TOKEN_EXPIRATION
  );

  const { token: refreshToken, expiresAt: refreshTokenExpiresAt } = await issueRefreshToken(user.id, {
    invalidateExisting: true
  });

  return {
    accessToken,
    refreshToken,
    refreshTokenExpiresAt,
    user: buildAuthUserResponse(user)
  };
};

const getCurrentUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      email: true,
      avatar: true,
      createdAt: true,
      updatedAt: true,
      address: true
    }
  });

  if (!user) {
    throw createHttpError(404, 'Usuário não encontrado');
  }

  return user;
};

const refreshSession = async (refreshToken: string) => {
  const tokenHash = hashRefreshToken(refreshToken);

  const storedToken = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
    throw createHttpError(401, 'Refresh token inválido ou expirado');
  }

  const user = await prisma.user.findUnique({ where: { id: storedToken.userId } });

  if (!user) {
    throw createHttpError(401, 'Usuário não encontrado');
  }

  await prisma.refreshToken.delete({ where: { tokenHash } });

  const accessToken = signToken(
    {
      sub: user.id,
      email: user.email,
      role: user.role
    },
    ACCESS_TOKEN_EXPIRATION
  );

  const { token: newRefreshToken, expiresAt: refreshTokenExpiresAt } = await issueRefreshToken(user.id);

  return {
    accessToken,
    refreshToken: newRefreshToken,
    refreshTokenExpiresAt,
    user: buildAuthUserResponse(user)
  };
};

const logout = async (userId: string, refreshToken?: string) => {
  if (refreshToken) {
    const tokenHash = hashRefreshToken(refreshToken);
    await prisma.refreshToken.deleteMany({ where: { tokenHash } });
  } else {
    await prisma.refreshToken.deleteMany({ where: { userId } });
  }
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

  const displayName = user.firstName ?? user.name ?? user.email;
  const html = `
    <p>Olá, ${displayName}!</p>
    <p>Recebemos uma solicitação para redefinir sua senha na <strong>AITRON Financeira</strong>.</p>
    <p>Clique no botão abaixo para criar uma nova senha. O link expira em ${PASSWORD_RESET_EXPIRATION_MINUTES} minutos.</p>
    <p><a href="${resetLink}" style="display:inline-block;padding:12px 20px;background:#1d4ed8;color:#fff;text-decoration:none;border-radius:6px">Redefinir senha</a></p>
    <p>Se você não solicitou, ignore este e-mail.</p>
  `;

  await mailService.sendMail({
    to: user.email,
    subject: 'Recuperação de senha - AITRON Financeira',
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
  refreshSession,
  logout,
  requestPasswordReset,
  resetPassword
};
