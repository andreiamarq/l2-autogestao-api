# L2 AutoGestão: API REST

## 1. Projeto e instituição parceira

**L2 AutoGestão** é um sistema web de gestão de comandas e controle de estoque para empresas de estética automotiva e lava-jato. Este repositório contém o **back-end (API REST)** da disciplina Programação para Web II (A2, 2026.2).

- **Instituição parceira:** L2 – Estética Automotiva e Lava-Jato
- **Instituição de ensino:** Unitins, curso de Tecnologia em Análise e Desenvolvimento de Sistemas (TADS), Polo Palmas – TO
- **Contexto:** o mesmo projeto desenvolvido em Elaboração e Gestão de Projetos (modelagem UML e MER disponíveis no documento do projeto).

A API implementa as funcionalidades de maior prioridade do projeto: cadastro de **clientes e veículos**, catálogo de **produtos** (com saldo de estoque) e de **serviços**, além de **login** e **recuperação de senha**. O `schema.prisma` contém todo o MER do projeto (incluindo Comanda, ItemComanda e MovimentacaoEstoque), mas as rotas de comandas e movimentações não fazem parte desta entrega.

## 2. Integrantes e CRUDs

| Integrante | CRUD sob responsabilidade | Arquivos |
| --- | --- | --- |
| Adriel Carvalho | Clientes (`/clientes`) | `src/controllers/cliente.controller.js`, `src/routes/cliente.routes.js` |
| Alan Aldo | Veículos (`/veiculos`) | `src/controllers/veiculo.controller.js`, `src/routes/veiculo.routes.js` |
| Andreia Alves | Produtos (`/produtos`) | `src/controllers/produto.controller.js`, `src/routes/produto.routes.js` |
| Ester Moraes | Serviços (`/servicos`) | `src/controllers/servico.controller.js`, `src/routes/servico.routes.js` |

O cadastro de usuários e o login (`/auth/*`) são a base comum de autenticação e **não** contam como um dos CRUDs dos alunos.

## 3. Tecnologias utilizadas

- **Node.js** 20 LTS (funciona a partir da versão 18)
- **Express** 4 (rotas)
- **Prisma ORM** 5 (acesso ao banco, `prisma/schema.prisma` e migrations versionadas)
- **SQLite** (banco de dados, arquivo local)
- **bcryptjs** (criptografia de senhas), **jsonwebtoken** (token JWT), **dotenv**, **cors**
- **nodemon** (apenas desenvolvimento)

Estrutura do código:

```
prisma/            schema.prisma, seed.js e migrations/
src/controllers/   regras de cada rota
src/routes/        definição das rotas
src/middlewares/   auth (JWT) e tratamento de erros
src/utils/         validação e utilitários HTTP
docs/              coleção de testes (Postman)
```

## 4. Instalação e execução

```bash
# 1. Clonar o repositório
git clone <URL-DO-REPOSITORIO>
cd l2-autogestao-api

# 2. Instalar as dependências
npm install

# 3. Criar o .env a partir do exemplo
cp .env.example .env          # no Windows (PowerShell): copy .env.example .env

# 4. Criar o banco e aplicar as migrations (as migrations já estão em prisma/migrations)
npx prisma migrate dev

# 5. Popular o banco com o usuário de teste e dados de exemplo (seed)
npm run seed

# 6. Iniciar a API
npm run dev
```

A API sobe em **http://localhost:3000** (porta definida em `PORT` no `.env`). Para iniciar sem nodemon, use `npm start`.

Observações:

- O seed cria o usuário de teste **admin@l2autogestao.com / Admin@123** e alguns clientes, produtos e serviços de exemplo. Ele pode ser executado mais de uma vez sem duplicar dados.
- Para recriar o banco do zero: `npx prisma migrate reset`.

## 5. Lista de rotas

Todas as rotas aceitam e devolvem JSON. Rotas marcadas com 🔒 exigem o cabeçalho `Authorization: Bearer <token>`; sem token válido a resposta é **401**.

### Autenticação

| Método | URL | Descrição | Token | Exemplo de corpo |
| --- | --- | --- | --- | --- |
| POST | `/auth/register` | Cadastra usuário (senha criptografada com bcrypt) | Não | `{"nome":"Ana","email":"ana@exemplo.com","senha":"Senha@123"}` |
| POST | `/auth/login` | Valida e-mail e senha e devolve o token JWT | Não | `{"email":"ana@exemplo.com","senha":"Senha@123"}` |
| GET | `/auth/me` | Devolve o usuário do token | 🔒 | (sem corpo) |
| POST | `/auth/forgot-password` | Gera token de recuperação com expiração (15 min) e salva no banco | Não | `{"email":"ana@exemplo.com"}` |
| POST | `/auth/reset-password` | Valida o token, salva a nova senha e invalida o token | Não | `{"token":"<token>","novaSenha":"NovaSenha@456"}` |

### CRUDs (todos 🔒)

Cada recurso tem as mesmas cinco operações:

| Método | URL | Descrição |
| --- | --- | --- |
| POST | `/<recurso>` | Cria (201) |
| GET | `/<recurso>` | Lista todos (200) |
| GET | `/<recurso>/:id` | Busca por id (200 ou 404) |
| PUT | `/<recurso>/:id` | Atualiza todos os campos (200, 400 ou 404) |
| PATCH | `/<recurso>/:id` | Atualiza apenas os campos enviados (200, 400 ou 404) |
| DELETE | `/<recurso>/:id` | Exclui (200 ou 404) |

Exemplos de corpo para criação:

| Recurso | Exemplo de corpo (POST) |
| --- | --- |
| `/clientes` | `{"nome":"Maria Souza","telefone":"(63) 98888-1111","cpfCnpj":"52998224725"}` (`cpfCnpj` opcional) |
| `/veiculos` | `{"placa":"XYZ1A23","marcaModelo":"Honda Civic","cor":"Preto","porte":"MEDIO","clienteId":1}` (`porte`: PEQUENO, MEDIO ou GRANDE; `cor` e `porte` opcionais) |
| `/produtos` | `{"nome":"Cera líquida 500ml","categoria":"Acabamento","unidade":"un","precoVenda":49.9,"saldoEstoque":12,"estoqueMinimo":3}` |
| `/servicos` | `{"nome":"Polimento técnico","descricao":"Polimento da pintura","porteAplicavel":"MEDIO","preco":250}` (`descricao` e `porteAplicavel` opcionais) |

Filtros opcionais: `GET /veiculos?clienteId=1`, `GET /veiculos?placa=ABC1D23` e `GET /produtos?abaixoDoMinimo=true`.

### Códigos de resposta

| Código | Quando |
| --- | --- |
| 200 | Leitura, atualização, exclusão, login, recuperação de senha |
| 201 | Criação |
| 400 | Dados inválidos ou ausentes, id inválido, valor duplicado (placa, e-mail), token de recuperação inválido ou expirado, exclusão de registro com vínculos |
| 401 | Token ausente, inválido ou expirado; credenciais inválidas no login |
| 404 | Registro ou rota inexistente |
| 500 | Erro interno |

As respostas de erro têm o formato `{"erro": "mensagem", "detalhes": ["..."]}`.

## 6. Roteiro de testes para o tutor

O arquivo de testes está em **`docs/L2-AutoGestao.postman_collection.json`** (formato Postman Collection v2.1, que também abre no Insomnia e no Thunder Client). Ele usa variáveis (`baseUrl`, `token`, `resetToken` e os ids criados), então **não é preciso ajustar nada**: basta importar.

**Como importar:** Postman → *Import* → selecionar o arquivo. Com a API rodando em `http://localhost:3000`, execute as pastas na ordem abaixo, uma a uma ou pelo *Collection Runner* (*Run collection*).

| Ordem | Pasta | O que testa |
| --- | --- | --- |
| 1 | Autenticação | Cadastra usuário, faz login (o token é guardado na variável `token` automaticamente), testa `/auth/me`, confere o 401 sem token e com senha errada |
| 2 | CRUD Clientes | POST, GET, GET por id, PUT e PATCH (o DELETE do cliente fica na pasta 3b) |
| 3 | CRUD Veículos | Os cinco métodos; o veículo usa o `clienteId` criado no passo anterior |
| 3b | Excluir cliente | Exclui o cliente depois de excluído o veículo |
| 4 | CRUD Produtos | Os cinco métodos |
| 5 | CRUD Serviços | Os cinco métodos |
| 6 | Recuperação de senha | Gera o token, redefine a senha, comprova que o token não pode ser reutilizado (400), faz login com a nova senha e depois restaura a senha original |
| 7 | Validações e erros | Confere 400 (dados inválidos, id inválido) e 404 |

**Onde encontrar o token de recuperação de senha:** com `EXIBIR_TOKEN_RESET=true` (valor do `.env.example`), a rota `POST /auth/forgot-password` devolve o token no campo **`tokenRecuperacao`** da resposta e também o imprime no **console da API**. A coleção já copia esse valor para a variável `resetToken`, usada na rota seguinte. Como não há envio real de e-mail, esse é o caminho previsto. O banco guarda apenas o hash do token, e ele expira em 15 minutos (`RESET_TOKEN_MINUTES`).

Dica: a coleção pode ser executada mais de uma vez; o cadastro repetido responde 400 e isso não atrapalha os demais passos.
