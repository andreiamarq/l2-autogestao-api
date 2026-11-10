const { HttpError } = require('../utils/http');

function rotaNaoEncontrada(req, res) {
  res.status(404).json({ erro: `Rota não encontrada: ${req.method} ${req.originalUrl}` });
}

// Middleware central de erros: converte exceções em respostas HTTP padronizadas.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    const corpo = { erro: err.message };
    if (err.detalhes) corpo.detalhes = err.detalhes;
    return res.status(err.status).json(corpo);
  }

  // JSON malformado no corpo da requisição
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'JSON inválido no corpo da requisição' });
  }

  // Erros conhecidos do Prisma
  if (err.code === 'P2002') {
    const campos = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : 'campo único';
    return res.status(400).json({ erro: `Já existe um registro com este valor (${campos})` });
  }
  if (err.code === 'P2003') {
    return res.status(400).json({
      erro: 'Operação não permitida: existem registros relacionados a este item',
    });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ erro: 'Registro não encontrado' });
  }

  console.error(err);
  return res.status(500).json({ erro: 'Erro interno do servidor' });
}

module.exports = { rotaNaoEncontrada, errorHandler };
