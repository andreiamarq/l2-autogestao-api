// CRUD de Veículo (pertence a um Cliente)
// Responsável: ver README.md (seção "Integrantes e CRUDs")

const prisma = require('../lib/prisma');
const { HttpError, asyncHandler, parseId } = require('../utils/http');
const { validar } = require('../utils/validar');

const PORTES = ['PEQUENO', 'MEDIO', 'GRANDE'];

const regras = {
  // Aceita placa antiga (ABC1234) e Mercosul (ABC1D23), com ou sem hífen
  placa: {
    tipo: 'string',
    obrigatorio: true,
    transformar: (v) => v.toUpperCase().replace(/[\s-]/g, ''),
    regex: /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/,
    mensagem: 'O campo "placa" deve estar no formato ABC1234 ou ABC1D23',
  },
  marcaModelo: { tipo: 'string', obrigatorio: true, min: 2, max: 80 },
  cor: { tipo: 'string', max: 30 },
  porte: { tipo: 'enum', valores: PORTES, transformar: (v) => v.toUpperCase() },
  clienteId: { tipo: 'int', obrigatorio: true, min: 1 },
};

async function garantirCliente(clienteId) {
  const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });
  if (!cliente) {
    throw new HttpError(400, 'Dados inválidos', ['O campo "clienteId" não corresponde a um cliente existente']);
  }
}

// POST /veiculos
exports.criar = asyncHandler(async (req, res) => {
  const { erros, dados } = validar(req.body, regras);
  if (erros.length) throw new HttpError(400, 'Dados inválidos', erros);
  await garantirCliente(dados.clienteId);

  const veiculo = await prisma.veiculo.create({ data: dados });
  res.status(201).json(veiculo);
});

// GET /veiculos  (filtro opcional: ?clienteId=1)
exports.listar = asyncHandler(async (req, res) => {
  const where = {};
  if (req.query.clienteId !== undefined) where.clienteId = parseId(req.query.clienteId);

  const veiculos = await prisma.veiculo.findMany({
    where,
    include: { cliente: { select: { id: true, nome: true } } },
    orderBy: { placa: 'asc' },
  });
  res.status(200).json(veiculos);
});

// GET /veiculos/:id
exports.buscarPorId = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const veiculo = await prisma.veiculo.findUnique({ where: { id }, include: { cliente: true } });
  if (!veiculo) throw new HttpError(404, 'Veículo não encontrado');
  res.status(200).json(veiculo);
});

// PUT /veiculos/:id (completo) e PATCH /veiculos/:id (parcial)
exports.atualizar = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const { erros, dados } = validar(req.body, regras, req.method === 'PATCH');
  if (erros.length) throw new HttpError(400, 'Dados inválidos', erros);

  const existente = await prisma.veiculo.findUnique({ where: { id } });
  if (!existente) throw new HttpError(404, 'Veículo não encontrado');
  if (dados.clienteId !== undefined) await garantirCliente(dados.clienteId);

  const veiculo = await prisma.veiculo.update({ where: { id }, data: dados });
  res.status(200).json(veiculo);
});

// DELETE /veiculos/:id
exports.excluir = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const existente = await prisma.veiculo.findUnique({ where: { id } });
  if (!existente) throw new HttpError(404, 'Veículo não encontrado');

  await prisma.veiculo.delete({ where: { id } });
  res.status(200).json({ mensagem: 'Veículo excluído com sucesso' });
});
