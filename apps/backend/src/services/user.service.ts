import createHttpError from 'http-errors';
import { prisma } from '../config/prisma.js';
import { comparePassword, hashPassword } from '../utils/password.js';

interface UpdateProfileInput {
  name?: string;
  email?: string;
}

export const userService = {
  async updateProfile(userId: string, data: UpdateProfileInput) {
    if (data.email) {
      const existing = await prisma.user.findFirst({
        where: {
          email: data.email,
          NOT: { id: userId }
        }
      });

      if (existing) {
        throw createHttpError(409, 'E-mail já está em uso por outro usuário');
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return user;
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw createHttpError(404, 'Usuário não encontrado');
    }

    const valid = await comparePassword(currentPassword, user.passwordHash);

    if (!valid) {
      throw createHttpError(400, 'Senha atual incorreta');
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash }
    });
  }
};
