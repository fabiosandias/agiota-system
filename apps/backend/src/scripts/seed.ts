import { prisma } from '../config/prisma.js';
import { hashPassword } from '../utils/password.js';

/**
 * Seed inicial do sistema multi-tenant
 * Cria Super Admins conforme PRD
 */

const SUPER_ADMINS = [
  {
    email: 'fabio@aitron.com.br',
    firstName: 'Fabio',
    lastName: 'Silva',
    phone: '11987654321',
    password: 'SuperAdmin@123',
    role: 'super_admin' as const
  },
  {
    email: 'suporte@aitron.com.br',
    firstName: 'Suporte',
    lastName: 'AITRON',
    phone: '1133334444',
    password: 'Suporte@123',
    role: 'super_admin' as const
  }
];

// Tenant de exemplo para desenvolvimento
const EXAMPLE_TENANT = {
  name: 'Empresa Exemplo',
  email: 'exemplo@empresa.com.br',
  cpfCnpj: '12345678000190',
  phone: '11999998888',
  plan: 'pro' as const,
  status: 'active' as const,
  adminUser: {
    email: 'fabiowebmain@gmail.com',
    firstName: 'Fabio',
    lastName: 'Web',
    phone: '11988887777',
    password: 'Admin@123',
    role: 'admin' as const
  },
  address: {
    postalCode: '01310100',
    street: 'Av. Paulista',
    number: '1578',
    district: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    complement: 'Andar 10'
  }
};

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...\n');

  // Limpar dados existentes
  console.log('🗑️  Limpando dados existentes...');
  await prisma.subscriptionEvent.deleteMany();
  await prisma.subscriptionInvoice.deleteMany();
  await prisma.ticketMessage.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.accountTransaction.deleteMany();
  await prisma.installmentPayment.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.loanInstallment.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.account.deleteMany();
  await prisma.client.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.log.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.address.deleteMany();
  console.log('✅ Dados limpos\n');

  // Criar Super Admins
  console.log('👑 Criando Super Admins...');
  for (const superAdmin of SUPER_ADMINS) {
    const passwordHash = await hashPassword(superAdmin.password);
    const user = await prisma.user.create({
      data: {
        email: superAdmin.email,
        name: `${superAdmin.firstName} ${superAdmin.lastName}`,
        firstName: superAdmin.firstName,
        lastName: superAdmin.lastName,
        phone: superAdmin.phone,
        role: superAdmin.role,
        passwordHash,
        tenantId: null // Super Admin não pertence a nenhum tenant
      }
    });
    console.log(`  ✓ Super Admin criado: ${user.email}`);
  }
  console.log('');

  // Criar tenant de exemplo
  console.log('🏢 Criando tenant de exemplo...');

  // Criar endereço do tenant
  const tenantAddress = await prisma.address.create({
    data: {
      label: 'primary',
      postalCode: EXAMPLE_TENANT.address.postalCode,
      street: EXAMPLE_TENANT.address.street,
      number: EXAMPLE_TENANT.address.number,
      district: EXAMPLE_TENANT.address.district,
      city: EXAMPLE_TENANT.address.city,
      state: EXAMPLE_TENANT.address.state,
      complement: EXAMPLE_TENANT.address.complement
    }
  });

  // Calcular datas do trial (já expirado para testar conversão para Pro)
  const trialStartAt = new Date();
  trialStartAt.setDate(trialStartAt.getDate() - 20); // Começou 20 dias atrás
  const trialEndAt = new Date();
  trialEndAt.setDate(trialEndAt.getDate() - 5); // Terminou 5 dias atrás

  // Criar tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: EXAMPLE_TENANT.name,
      email: EXAMPLE_TENANT.email,
      cpfCnpj: EXAMPLE_TENANT.cpfCnpj,
      phone: EXAMPLE_TENANT.phone,
      addressId: tenantAddress.id,
      plan: EXAMPLE_TENANT.plan,
      status: EXAMPLE_TENANT.status,
      trialStartAt,
      trialEndAt,
      billingMethod: 'pix',
      nextDueAt: new Date(new Date().setMonth(new Date().getMonth() + 1)) // Próximo vencimento em 1 mês
    }
  });
  console.log(`  ✓ Tenant criado: ${tenant.name} (${tenant.email})`);

  // Criar eventos de assinatura
  await prisma.subscriptionEvent.createMany({
    data: [
      {
        tenantId: tenant.id,
        type: 'trial_started',
        data: { trialEndAt: trialEndAt.toISOString() }
      },
      {
        tenantId: tenant.id,
        type: 'trial_ended',
        data: { convertedToPro: true }
      },
      {
        tenantId: tenant.id,
        type: 'plan_upgraded',
        data: { from: 'free', to: 'pro' }
      }
    ]
  });

  // Criar usuário admin do tenant
  const adminPasswordHash = await hashPassword(EXAMPLE_TENANT.adminUser.password);
  const adminUser = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: EXAMPLE_TENANT.adminUser.email,
      name: `${EXAMPLE_TENANT.adminUser.firstName} ${EXAMPLE_TENANT.adminUser.lastName}`,
      firstName: EXAMPLE_TENANT.adminUser.firstName,
      lastName: EXAMPLE_TENANT.adminUser.lastName,
      phone: EXAMPLE_TENANT.adminUser.phone,
      role: EXAMPLE_TENANT.adminUser.role,
      passwordHash: adminPasswordHash
    }
  });
  console.log(`  ✓ Usuário admin do tenant criado: ${adminUser.email}`);

  // Criar conta de exemplo para o tenant
  const account = await prisma.account.create({
    data: {
      tenantId: tenant.id,
      userId: adminUser.id,
      name: 'Conta Principal',
      type: 'checking',
      openingBalance: 50000,
      currentBalance: 50000
    }
  });
  console.log(`  ✓ Conta criada: ${account.name}`);

  // Criar cliente de exemplo
  const clientAddress = await prisma.address.create({
    data: {
      label: 'primary',
      postalCode: '04547130',
      street: 'Av. Brigadeiro Faria Lima',
      number: '3477',
      district: 'Itaim Bibi',
      city: 'São Paulo',
      state: 'SP'
    }
  });

  const client = await prisma.client.create({
    data: {
      tenantId: tenant.id,
      name: 'João da Silva',
      firstName: 'João',
      lastName: 'da Silva',
      document: '12345678901',
      documentType: 'cpf',
      phone: '11987654321',
      email: 'joao.silva@email.com',
      birthDate: new Date('1985-05-15'),
      addresses: {
        connect: { id: clientAddress.id }
      }
    }
  });
  console.log(`  ✓ Cliente criado: ${client.name}`);

  console.log('\n✨ Seed concluído com sucesso!\n');
  console.log('📋 Credenciais de acesso:');
  console.log('\n🔐 Super Admins:');
  console.log('  • fabio@aitron.com.br / SuperAdmin@123');
  console.log('  • suporte@aitron.com.br / Suporte@123');
  console.log('\n👤 Tenant Admin:');
  console.log('  • fabiowebmain@gmail.com / Admin@123');
  console.log('\n🏢 Tenant de exemplo:');
  console.log(`  • Nome: ${tenant.name}`);
  console.log(`  • Email: ${tenant.email}`);
  console.log(`  • Plano: ${tenant.plan.toUpperCase()}`);
  console.log(`  • Status: ${tenant.status.toUpperCase()}`);
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
