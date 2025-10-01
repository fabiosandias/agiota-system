import { prisma } from '../config/prisma.js';
import { hashPassword } from '../utils/password.js';

const DEFAULT_ACCOUNT_ID = '11111111-1111-1111-1111-111111111111';

const TEST_USER = {
  email: 'admin@agiota.local',
  name: 'Administrador',
  password: 'Agiota@123'
};

const ensureDefaultAccount = async () => {
  await prisma.account.upsert({
    where: { id: DEFAULT_ACCOUNT_ID },
    update: {},
    create: {
      id: DEFAULT_ACCOUNT_ID,
      name: 'Conta Principal',
      initialBalance: 0,
      currentBalance: 0
    }
  });

  console.log('✔️ Seed: conta principal garantida.');
};

const ensureAdminUser = async () => {
  const existing = await prisma.user.findUnique({ where: { email: TEST_USER.email } });

  if (existing) {
    console.log('✔️ Seed: admin user already exists. Skipping creation.');
    return;
  }

  const passwordHash = await hashPassword(TEST_USER.password);

  await prisma.user.create({
    data: {
      email: TEST_USER.email,
      name: TEST_USER.name,
      passwordHash
    }
  });

  console.log('✅ Seed: admin user created successfully');
};

const main = async () => {
  await ensureDefaultAccount();
  await ensureAdminUser();
};

main()
  .catch((error) => {
    console.error('❌ Seed failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
