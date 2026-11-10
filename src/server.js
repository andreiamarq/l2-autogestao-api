require('dotenv').config();

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET não definido. Crie o arquivo .env a partir do .env.example.');
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL não definido. Crie o arquivo .env a partir do .env.example.');
  process.exit(1);
}

const app = require('./app');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API L2 AutoGestão rodando em http://localhost:${PORT}`);
});
