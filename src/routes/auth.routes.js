const { Router } = require('express');
const auth = require('../middlewares/auth');
const c = require('../controllers/auth.controller');

const router = Router();

router.post('/register', c.register);
router.post('/login', c.login);
router.post('/forgot-password', c.forgotPassword);
router.post('/reset-password', c.resetPassword);
router.get('/me', auth, c.me);

module.exports = router;
