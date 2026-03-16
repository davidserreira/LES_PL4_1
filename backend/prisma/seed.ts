import prisma from '../src/lib/prisma';

async function main() {
  console.log('Start seeding...');
  
  // Utilizadores
  const admin = await prisma.utilizador.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: '1234', // In a real app this should be hashed
      role: 'ADMINISTRADOR',
    },
  });

  const respStock = await prisma.utilizador.upsert({
    where: { username: 'stock' },
    update: {},
    create: {
      username: 'stock',
      password: '1234',
      role: 'RESPONSAVEL_STOCK',
    },
  });

  const respFinanceiro = await prisma.utilizador.upsert({
    where: { username: 'financeiro' },
    update: {},
    create: {
      username: 'financeiro',
      password: '1234',
      role: 'RESPONSAVEL_FINANCEIRO',
    },
  });

  console.log({ admin, respStock, respFinanceiro });
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
