import { prisma } from '../config/prisma.js';
import { hashPassword } from '../utils/password.js';

const DEFAULT_ACCOUNT_ID = '11111111-1111-1111-1111-111111111111';

const TEST_USERS = [
  {
    email: 'admin@aitron.finance',
    firstName: 'AITRON',
    lastName: 'Admin',
    phone: '11987654321',
    password: 'Admin@123',
    role: 'admin' as const,
    address: {
      postalCode: '01310100',
      street: 'Av. Paulista',
      number: '1578',
      district: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      complement: 'Andar 10'
    }
  },
  {
    email: 'operator@aitron.finance',
    firstName: 'João',
    lastName: 'Operador',
    phone: '11912345678',
    password: 'Operator@123',
    role: 'operator' as const,
    address: {
      postalCode: '04547130',
      street: 'Av. Brigadeiro Faria Lima',
      number: '3477',
      district: 'Itaim Bibi',
      city: 'São Paulo',
      state: 'SP',
      complement: null
    }
  },
  {
    email: 'viewer@aitron.finance',
    firstName: 'Maria',
    lastName: 'Visualizadora',
    phone: '11998765432',
    password: 'Viewer@123',
    role: 'viewer' as const,
    address: {
      postalCode: '05508010',
      street: 'Av. das Nações Unidas',
      number: '12901',
      district: 'Brooklin Paulista',
      city: 'São Paulo',
      state: 'SP',
      complement: 'Torre Norte'
    }
  }
];

const ensureDefaultAccount = async () => {
  await prisma.account.upsert({
    where: { id: DEFAULT_ACCOUNT_ID },
    update: {},
    create: {
      id: DEFAULT_ACCOUNT_ID,
      name: 'Caixa Principal',
      bankName: 'Banco AITRON',
      branch: '0001',
      accountNumber: '1234567-8',
      openingBalance: 50000,
      currentBalance: 50000,
      type: 'checking'
    }
  });

  console.log('✔️ Seed: conta corporativa criada/atualizada');
};

const ensureTestUsers = async () => {
  for (const testUser of TEST_USERS) {
    const existing = await prisma.user.findUnique({ where: { email: testUser.email } });

    if (existing) {
      console.log(`✔️ Seed: usuário ${testUser.email} já existe. Pulando.`);
      continue;
    }

    const passwordHash = await hashPassword(testUser.password);

    await prisma.user.create({
      data: {
        email: testUser.email,
        name: `${testUser.firstName} ${testUser.lastName}`,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        phone: testUser.phone,
        role: testUser.role,
        passwordHash,
        address: {
          create: {
            label: 'primary',
            postalCode: testUser.address.postalCode,
            street: testUser.address.street,
            number: testUser.address.number,
            district: testUser.address.district,
            city: testUser.address.city,
            state: testUser.address.state,
            complement: testUser.address.complement
          }
        }
      }
    });

    console.log(`✅ Seed: usuário ${testUser.role} criado - ${testUser.email} (senha: ${testUser.password})`);
  }
};

const ensureTestClients = async () => {
  const existingClients = await prisma.client.count();

  if (existingClients > 0) {
    console.log('✔️ Seed: clientes já existem. Pulando.');
    return;
  }

  const clients = [
    {
      firstName: 'Carlos',
      lastName: 'Silva',
      document: '12345678901',
      documentType: 'cpf' as const,
      phone: '11987654001',
      email: 'carlos.silva@example.com',
      birthDate: new Date('1985-03-15'),
      addresses: [
        {
          label: 'primary',
          postalCode: '01310100',
          street: 'Av. Paulista',
          number: '100',
          district: 'Bela Vista',
          city: 'São Paulo',
          state: 'SP',
          complement: 'Apto 101'
        }
      ]
    },
    {
      firstName: 'Ana',
      lastName: 'Santos',
      document: '98765432100',
      documentType: 'cpf' as const,
      phone: '11987654002',
      email: 'ana.santos@example.com',
      birthDate: new Date('1990-07-22'),
      addresses: [
        {
          label: 'primary',
          postalCode: '04547130',
          street: 'Av. Brigadeiro Faria Lima',
          number: '200',
          district: 'Itaim Bibi',
          city: 'São Paulo',
          state: 'SP',
          complement: null
        }
      ]
    }
  ];

  for (const clientData of clients) {
    await prisma.client.create({
      data: {
        name: `${clientData.firstName} ${clientData.lastName}`,
        firstName: clientData.firstName,
        lastName: clientData.lastName,
        document: clientData.document,
        documentType: clientData.documentType,
        phone: clientData.phone,
        email: clientData.email,
        birthDate: clientData.birthDate,
        addresses: {
          create: clientData.addresses
        }
      }
    });
  }

  console.log('✅ Seed: 2 clientes de exemplo criados');
};

const main = async () => {
  console.log('🌱 Iniciando seed...\n');
  await ensureDefaultAccount();
  await ensureTestUsers();
  await ensureTestClients();
  console.log('\n✅ Seed concluído com sucesso!');
};

main()
  .catch((error) => {
    console.error('❌ Seed failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
