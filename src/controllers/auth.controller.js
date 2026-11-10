const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { HttpError, asyncHandler } = require('../utils/http');
const { validar } = require('../utils/validar');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const regrasCadastro = {
  nome: { tipo: 'string', obrigatorio: true, min: 2, max: 120 },
  email: {
    tipo: 'string',
    obrigatorio: true,
    max: 160,
    transformar: (v) => v.toLowerCase(),
    regex: EMAIL_REGEX,
    mensagem: 'O campo "email" tem formato inválido',
  },
  senha: { tipo: 'string', obrigatorio: true, min: 6, max: 100 },
};

const sha256 = (texto) => crypto.createHash('sha256').update(texto).digest('hex');

const usuarioPublico = (u) => ({ id: u.id, nome: u.nome, email: u.email, perfil: u.perfil });

// POST /auth/register: cadastra um usuário com a senha criptografada (bcrypt)
exports.register = asyncHandler(async (req, res) => {
  const { erros, dados } = validar(req.body, regrasCadastro);
  if (erros.length) throw new HttpError(400, 'Dados inválidos', erros);

  const existente = await prisma.usuario.findUnique({ where: { email: dados.email } });
  if (existente) throw new HttpError(400, 'Já existe um usuário cadastrado com este e-mail');

  const senhaHash = await bcrypt.hash(dados.senha, 10);
  // O perfil é sempre ATENDENTE no auto-cadastro; ADMIN só é criado pelo seed.
  const usuario = await prisma.usuario.create({
    data: { nome: dados.nome, email: dados.email, senhaHash, perfil: 'ATENDENTE' },
  });

  res.status(201).json(usuarioPublico(usuario));
});

// POST /auth/login: valida e-mail e senha e devolve um token JWT
exports.login = asyncHandler(async (req, res) => {
  const { erros, dados } = validar(req.body, {
    email: regrasCadastro.email,
    senha: { tipo: 'string', obrigatorio: true },
  });
  if (erros.length) throw new HttpError(400, 'Dados inválidos', erros);

  const usuario = await prisma.usuario.findUnique({ where: { email: dados.email } });
  const senhaOk = usuario ? await bcrypt.compare(dados.senha, usuario.senhaHash) : false;

  if (!usuario || !usuario.ativo || !senhaOk) {
    throw new HttpError(401, 'E-mail ou senha inválidos');
  }

  const token = jwt.sign({ sub: String(usuario.id), perfil: usuario.perfil }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '2h',
  });

  res.status(200).json({ token, usuario: usuarioPublico(usuario) });
});

// GET /auth/me: devolve o usuário do token (rota protegida, útil para testar o token)
exports.me = asyncHandler(async (req, res) => {
  res.status(200).json(req.usuario);
});

// POST /auth/forgot-password: gera um token de recuperação com prazo de expiração
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { erros, dados } = validar(req.body, { email: regrasCadastro.email });
  if (erros.length) throw new HttpError(400, 'Dados inválidos', erros);

  const mensagem = 'Se o e-mail estiver cadastrado, um token de recuperação foi gerado.';
  const usuario = await prisma.usuario.findUnique({ where: { email: dados.email } });

  // Mesma resposta para e-mails inexistentes, para não revelar quem tem cadastro.
  if (!usuario || !usuario.ativo) return res.status(200).json({ mensagem });

  const token = crypto.randomBytes(32).toString('hex');
  const minutos = Number(process.env.RESET_TOKEN_MINUTES) || 15;
  const expira = new Date(Date.now() + minutos * 60 * 1000);

  // Salvamos só o hash do token; o valor original existe apenas na resposta/console.
  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { resetTokenHash: sha256(token), resetTokenExpira: expira },
  });

  const resposta = { mensagem };
  if (process.env.EXIBIR_TOKEN_RESET === 'true') {
    resposta.tokenRecuperacao = token;
    resposta.expiraEm = expira.toISOString();
    console.log(`[recuperação de senha] ${usuario.email} -> token: ${token} (expira em ${minutos} min)`);
  }

  res.status(200).json(resposta);
});

// POST /auth/reset-password: valida o token, salva a nova senha e invalida o token
exports.resetPassword = asyncHandler(async (req, res) => {
  const { erros, dados } = validar(req.body, {
    token: { tipo: 'string', obrigatorio: true },
    novaSenha: { tipo: 'string', obrigatorio: true, min: 6, max: 100 },
  });
  if (erros.length) throw new HttpError(400, 'Dados inválidos', erros);

  const usuario = await prisma.usuario.findFirst({
    where: { resetTokenHash: sha256(dados.token), resetTokenExpira: { gt: new Date() } },
  });
  if (!usuario) throw new HttpError(400, 'Token de recuperação inválido ou expirado');

  const senhaHash = await bcrypt.hash(dados.novaSenha, 10);
  // Limpar os campos do token impede que ele seja usado uma segunda vez.
  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { senhaHash, resetTokenHash: null, resetTokenExpira: null },
  });

  res.status(200).json({ mensagem: 'Senha redefinida com sucesso' });
});
