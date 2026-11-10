// CRUD de Serviço (catálogo de serviços do lava-jato / estética)
// Responsável: ver README.md (seção "Integrantes e CRUDs")

const prisma = require('../lib/prisma');
const { HttpError, asyncHandler, parseId } = require('../utils/http');
const { validar } = require('../utils/validar');

const PORTES = ['PEQUENO', 'MEDIO', 'GRANDE'];

const regras = {
  nome: { tipo: 'string', obrigatorio: true, min: 2, max: 120 },
  descricao: { tipo: 'string', max: 300 },
  porteAplicavel: { tipo: 'enum', valores: PORTES, transformar: (v) => v.toUpperCase() },
  preco: { tipo: 'number', obrigatorio: true, min: 0 },
  ativo: { tipo: 'boolean', padrao: true },
};

// POST /servicos
exports.criar = asyncHandler(async (req, res) => {
  const { erros, dados } = validar(req.body, regras);
  if (erros.length) throw new HttpError(400, 'Dados inválidos', erros);

  const servico = await prisma.servico.create({ data: dados });
  res.status(201).json(servico);
});

// GET /servicos
exports.listar = asyncHandler(async (req, res) => {
  const servicos = await prisma.servico.findMany({ orderBy: { nome: 'asc' } });
  res.status(200).json(servicos);
});

// GET /servicos/:id
exports.buscarPorId = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const servico = await prisma.servico.findUnique({ where: { id } });
  if (!servico) throw new HttpError(404, 'Serviço não encontrado');
  res.status(200).json(servico);
});

// PUT /servicos/:id (completo) e PATCH /servicos/:id (parcial)
exports.atualizar = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const { erros, dados } = validar(req.body, regras, req.method === 'PATCH');
  if (erros.length) throw new HttpError(400, 'Dados inválidos', erros);

  const existente = await prisma.servico.findUnique({ where: { id } });
  if (!existente) throw new HttpError(404, 'Serviço não encontrado');

  const servico = await prisma.servico.update({ where: { id }, data: dados });
  res.status(200).json(servico);
});

// DELETE /servicos/:id
exports.excluir = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const existente = await prisma.servico.findUnique({ where: { id } });
  if (!existente) throw new HttpError(404, 'Serviço não encontrado');

  await prisma.servico.delete({ where: { id } });
  res.status(200).json({ mensagem: 'Serviço excluído com sucesso' });
});
