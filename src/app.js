const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const clienteRoutes = require('./routes/cliente.routes');
const veiculoRoutes = require('./routes/veiculo.routes');
const produtoRoutes = require('./routes/produto.routes');
const servicoRoutes = require('./routes/servico.routes');
const { rotaNaoEncontrada, errorHandler } = require('./middlewares/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ api: 'L2 AutoGestão', status: 'online' });
});

app.use('/auth', authRoutes);
app.use('/clientes', clienteRoutes);
app.use('/veiculos', veiculoRoutes);
app.use('/produtos', produtoRoutes);
app.use('/servicos', servicoRoutes);

app.use(rotaNaoEncontrada);
app.use(errorHandler);

module.exports = app;
