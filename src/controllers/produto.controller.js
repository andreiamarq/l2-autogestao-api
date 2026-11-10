// CRUD de Produto (controle de estoque)
// Responsável: ver README.md (seção "Integrantes e CRUDs")

const prisma = require('../lib/prisma');
const { HttpError, asyncHandler, parseId } = require('../utils/http');
const { validar } = require('../utils/validar');

const regras = {
  nome: { tipo: 'string', obrigatorio: true, min: 2, max: 120 },
  categoria: { tipo: 'string', obrigatorio: true, min: 2, max: 60 },
  unidade: { tipo: 'string', obrigatorio: true, min: 1, max: 15 },
  precoVenda: { tipo: 'number', obrigatorio: true, min: 0 },
  saldoEstoque: { tipo: 'int', min: 0, padrao: 0 },
  estoqueMinimo: { tipo: 'int', min: 0, padrao: 0 },
  ativo: { tipo: 'boolean', padrao: true },
};

// POST /produtos
exports.criar = asyncHandler(async (req, res) => {
  const { erros, dados } = validar(req.body, regras);
  if (erros.length) throw new HttpError(400, 'Dados inválidos', erros);

  const produto = await prisma.produto.create({ data: dados });
  res.status(201).json(produto);
});

// GET /produtos  (filtro opcional: ?abaixoDoMinimo=true lista itens com estoque baixo)
exports.listar = asyncHandler(async (req, res) => {
  let produtos = await prisma.produto.findMany({ orderBy: { nome: 'asc' } });
  if (req.query.abaixoDoMinimo === 'true') {
    produtos = produtos.filter((p) => p.saldoEstoque <= p.estoqueMinimo);
  }
  res.status(200).json(produtos);
});

// GET /produtos/:id
exports.buscarPorId = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const produto = await prisma.produto.findUnique({ where: { id } });
  if (!produto) throw new HttpError(404, 'Produto não encontrado');
  res.status(200).json(produto);
});

// PUT /produtos/:id (completo) e PATCH /produtos/:id (parcial)
exports.atualizar = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const { erros, dados } = validar(req.body, regras, req.method === 'PATCH');
  if (erros.length) throw new HttpError(400, 'Dados inválidos', erros);

  const existente = await prisma.produto.findUnique({ where: { id } });
  if (!existente) throw new HttpError(404, 'Produto não encontrado');

  const produto = await prisma.produto.update({ where: { id }, data: dados });
  res.status(200).json(produto);
});

// DELETE /produtos/:id
exports.excluir = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const existente = await prisma.produto.findUnique({ where: { id } });
  if (!existente) throw new HttpError(404, 'Produto não encontrado');

  await prisma.produto.delete({ where: { id } });
  res.status(200).json({ mensagem: 'Produto excluído com sucesso' });
});
