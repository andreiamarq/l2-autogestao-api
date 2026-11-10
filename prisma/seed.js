// Popula o banco com um usuário de teste e alguns dados de exemplo.
// Execute com: npm run seed   (ou automaticamente pelo "prisma migrate dev")
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const senhaHash = await bcrypt.hash('Admin@123', 10);

  await prisma.usuario.upsert({
    where: { email: 'admin@l2autogestao.com' },
    update: {},
    create: {
      nome: 'Administrador L2',
      email: 'admin@l2autogestao.com',
      senhaHash,
      perfil: 'ADMIN',
    },
  });

  const cliente = await prisma.cliente.upsert({
    where: { cpfCnpj: '12345678909' },
    update: {},
    create: { nome: 'João da Silva', telefone: '(63) 99999-0000', cpfCnpj: '12345678909' },
  });

  await prisma.veiculo.upsert({
    where: { placa: 'ABC1D23' },
    update: {},
    create: {
      placa: 'ABC1D23',
      marcaModelo: 'Fiat Argo',
      cor: 'Prata',
      porte: 'PEQUENO',
      clienteId: cliente.id,
    },
  });

  const produtos = [
    { nome: 'Shampoo automotivo 5L', categoria: 'Limpeza', unidade: 'un', precoVenda: 89.9, saldoEstoque: 20, estoqueMinimo: 5 },
    { nome: 'Cera líquida 500ml', categoria: 'Acabamento', unidade: 'un', precoVenda: 49.9, saldoEstoque: 12, estoqueMinimo: 3 },
  ];
  for (const p of produtos) {
    const existe = await prisma.produto.findFirst({ where: { nome: p.nome } });
    if (!existe) await prisma.produto.create({ data: p });
  }

  const servicos = [
    { nome: 'Lavagem simples', descricao: 'Lavagem externa e secagem', porteAplicavel: 'PEQUENO', preco: 35 },
    { nome: 'Lavagem completa', descricao: 'Lavagem externa, interna e aspiração', porteAplicavel: 'MEDIO', preco: 70 },
  ];
  for (const s of servicos) {
    const existe = await prisma.servico.findFirst({ where: { nome: s.nome } });
    if (!existe) await prisma.servico.create({ data: s });
  }

  console.log('Seed concluído. Login de teste: admin@l2autogestao.com / Admin@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
