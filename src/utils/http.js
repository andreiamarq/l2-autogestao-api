// Utilitários HTTP compartilhados pelos controllers.

class HttpError extends Error {
  constructor(status, mensagem, detalhes) {
    super(mensagem);
    this.status = status;
    this.detalhes = detalhes;
  }
}

// Repassa erros de funções async para o middleware de erro do Express.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Converte o parâmetro :id em inteiro positivo ou responde 400.
function parseId(valor) {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, 'O id informado é inválido');
  }
  return id;
}

module.exports = { HttpError, asyncHandler, parseId };
