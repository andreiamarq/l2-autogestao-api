const { Router } = require('express');
const auth = require('../middlewares/auth');
const c = require('../controllers/veiculo.controller');

const router = Router();

// Todas as rotas exigem o token JWT obtido em POST /auth/login
router.use(auth);

router.post('/', c.criar);
router.get('/', c.listar);
router.get('/:id', c.buscarPorId);
router.put('/:id', c.atualizar);
router.patch('/:id', c.atualizar);
router.delete('/:id', c.excluir);

module.exports = router;
