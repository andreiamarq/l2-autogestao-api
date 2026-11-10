const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

// Exige um token JWT válido no cabeçalho "Authorization: Bearer <token>".
// Sem token, token inválido/expirado ou usuário inativo: responde 401.
async function auth(req, res, next) {
  try {
    const cabecalho = req.headers.authorization || '';
    const [tipo, token] = cabecalho.split(' ');

    if (tipo !== 'Bearer' || !token) {
      return res.status(401).json({ erro: 'Token de autenticação ausente' });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ erro: 'Token inválido ou expirado' });
    }

    const usuario = await prisma.usuario.findUnique({ where: { id: Number(payload.sub) } });
    if (!usuario || !usuario.ativo) {
      return res.status(401).json({ erro: 'Usuário não encontrado ou inativo' });
    }

    req.usuario = { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil };
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = auth;
