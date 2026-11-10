// CRUD de Cliente
// Responsável: ver README.md (seção "Integrantes e CRUDs")

const prisma = require('../lib/prisma');
const { HttpError, asyncHandler, parseId } = require('../utils/http');
const { validar } = require('../utils/validar');

const regras = {
  nome: { tipo: 'string', obrigatorio: true, min: 2, max: 120 },
  telefone: { tipo: 'string', obrigatorio: true, min: 8, max: 20 },
  cpfCnpj: {
    tipo: 'string',
    transformar: (v) => v.replace(/\D/g, ''),
    regex: /^(\d{11}|\d{14})$/,
    mensagem: 'O campo "cpfCnpj" deve ter 11 (CPF) ou 14 (CNPJ) dígitos',
  },
};

// POST /clientes
exports.criar = asyncHandler(async (req, res) => {
  const { erros, dados } = validar(req.body, regras);
  if (erros.length) throw new HttpError(400, 'Dados inválidos', erros);

  const cliente = await prisma.cliente.create({ data: dados });
  res.status(201).json(cliente);
});

// GET /clientes
exports.listar = asyncHandler(async (req, res) => {
  const clientes = await prisma.cliente.findMany({ orderBy: { nome: 'asc' } });
  res.status(200).json(clientes);
});

// GET /clientes/:id
exports.buscarPorId = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const cliente = await prisma.cliente.findUnique({ where: { id }, include: { veiculos: true } });
  if (!cliente) throw new HttpError(404, 'Cliente não encontrado');
  res.status(200).json(cliente);
});

// PUT /clientes/:id (atualização completa) e PATCH /clientes/:id (parcial)
exports.atualizar = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const { erros, dados } = validar(req.body, regras, req.method === 'PATCH');
  if (erros.length) throw new HttpError(400, 'Dados inválidos', erros);

  const existente = await prisma.cliente.findUnique({ where: { id } });
  if (!existente) throw new HttpError(404, 'Cliente não encontrado');

  const cliente = await prisma.cliente.update({ where: { id }, data: dados });
  res.status(200).json(cliente);
});

// DELETE /clientes/:id
exports.excluir = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const existente = await prisma.cliente.findUnique({ where: { id } });
  if (!existente) throw new HttpError(404, 'Cliente não encontrado');

  // Se houver veículos vinculados, o Prisma lança P2003 e o handler responde 400.
  await prisma.cliente.delete({ where: { id } });
  res.status(200).json({ mensagem: 'Cliente excluído com sucesso' });
});
