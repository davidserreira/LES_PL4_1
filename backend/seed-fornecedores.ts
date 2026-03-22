import prisma from './src/lib/prisma';

async function main() {
  console.log('A criar 15 fornecedores fictícios...');
  
  const categorias = ['Medicamentos', 'Vacinas', 'Higiene', 'Equipamento', 'Outros'];
  const unixTime = Date.now();
  const fornecedoresData = Array.from({ length: 15 }).map((_, i) => ({
    nome: `Fornecedor Teste Scroll ${i + 1}`,
    nif: `5${unixTime.toString().slice(-6)}${i.toString().padStart(2, '0')}`,
    contacto: `9${unixTime.toString().slice(-6)}${i.toString().padStart(2, '0')}`,
    email: `teste.scroll${unixTime}${i + 1}@fornecedor.pt`,
    categoria: categorias[i % categorias.length],
    estado: true,
    observacoes: `Fornecedor gerado automaticamente para testar o cabeçalho sticky na interface. (ID Geração: ${i+1})`
  }));

  for (const data of fornecedoresData) {
    await prisma.fornecedor.create({
      data
    });
  }

  console.log('15 fornecedores criados com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
