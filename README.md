
# Lumera — Auth Service

Microsserviço de autenticação do projeto acadêmico **Lumera — Gestão Clínica**, desenvolvido para o Projeto Integrador V.

**Responsável:** Matheus Pessoa  
**Branch:** `feature/auth-matheus-pessoa`

## 1. Tecnologias

- NestJS 12 e Node.js 24
- TypeScript
- Prisma ORM 7
- MySQL
- bcrypt
- JWT
- Vitest
- Swagger / OpenAPI
- Docker e Docker Compose
- Nginx como API Gateway

## 2. Funcionalidades implementadas

- Estrutura do Auth Service em NestJS.
- DTOs para cadastro e login.
- Hash de senhas com bcrypt.
- Validação de credenciais.
- Geração e verificação de tokens JWT.
- Proteção de rotas com JwtAuthGuard.
- Documentação dos endpoints com Swagger.
- Testes automatizados com mocks do Prisma.
- Dockerfile e integração inicial com Nginx.

**Status:** 19 testes aprovados na última execução.

**Pendente:** integração real com o MySQL do Senac, confirmação da estrutura das tabelas e testes HTTP completos de cadastro e login.

## 3. Repositório e branch

Repositório:
https://github.com/matheuspessoa14/academic-projeto-integrador-V

Branch de desenvolvimento:
`feature/auth-matheus-pessoa`

### Clonar na faculdade

```bash
git clone -b feature/auth-matheus-pessoa https://github.com/matheuspessoa14/academic-projeto-integrador-V.git
cd academic-projeto-integrador-V
```

Se o repositório já estiver clonado:

```bash
git fetch origin
git switch feature/auth-matheus-pessoa
git pull --ff-only origin feature/auth-matheus-pessoa
```

Não desenvolver diretamente na branch `main`.

## 4. Preparar o ambiente local

Requisitos:

- Node.js 24
- npm
- Git
- VS Code
- Docker Desktop, para executar os containers

Dentro da raiz do repositório:

```bash
cd services/auth-service
npm ci
```

Crie um arquivo `.env` baseado no `.env.example`.

Configure localmente:

- `DATABASE_URL`: URL de conexão MySQL válida.
- `JWT_SECRET`: chave secreta exclusiva do ambiente.
- `JWT_EXPIRES_IN`: tempo de duração do token.
- `PORT`: porta local do serviço.

Enquanto a conexão com o banco não for autorizada, use uma URL MySQL fictícia e sintaticamente válida apenas para gerar o Prisma Client, sem executar operações no banco.

Nunca envie o `.env` ou credenciais reais ao GitHub.

### Gerar Prisma Client

```bash
npx prisma generate
```

### Compilar e testar

```bash
npm run build
npm test
```

Na última validação, os 19 testes passaram.

## 5. Docker Compose e API Gateway

Volte para a raiz do repositório:

```bash
cd ../..
```

Crie o arquivo `.env.compose` na raiz, com estas variáveis:

```dotenv
DATABASE_URL=mysql://usuario:senha@localhost:3306/lumera_teste
JWT_SECRET=substitua-por-uma-chave-aleatoria-local
JWT_EXPIRES_IN=1h
```

Esses valores são exemplos de desenvolvimento, não credenciais reais.

Execute:

```bash
docker compose config --quiet
docker compose up -d --build
docker compose ps -a
```

Para visualizar os logs:

```bash
docker compose logs --tail=50 auth-service
docker compose logs --tail=50 gateway
```

Para encerrar os containers:

```bash
docker compose down
```

A configuração atual do Docker Compose contém o Auth Service e o Gateway Nginx. Os demais microsserviços serão integrados posteriormente.

## 6. Endereços locais

- API Gateway: http://localhost:8080/
- Health Check: http://localhost:8080/health
- Swagger Auth Service: http://localhost:3001/api
- Auth Service direto: http://localhost:3001

### Endpoints

| Método | Rota | Descrição |
|---|---|---|
| POST | /auth/register | Cadastro de usuários |
| POST | /auth/login | Login com JWT |
| GET | /auth/verify | Verifica um JWT |

A rota `/auth/verify` deve responder HTTP 401 quando acessada sem token.

Cadastro e login dependem da conexão definitiva com o banco MySQL.

## 7. Cuidados com o banco do Senac

O banco utilizado é fornecido pelo Senac.

Não executar comandos como `prisma migrate`, `prisma db push` ou alterações de tabelas sem autorização do professor.

A geração do Prisma Client e os testes com mocks não modificam o banco.

## 8. Como continuar o desenvolvimento

Antes de começar:

```bash
git switch feature/auth-matheus-pessoa
git pull --ff-only origin feature/auth-matheus-pessoa
```

Depois de concluir novas alterações:

```bash
git status
git add .
git diff --cached --name-only
git commit -m "feat: descreve a nova funcionalidade"
git push origin feature/auth-matheus-pessoa
```

Sempre conferir os arquivos adicionados antes do commit e nunca enviar arquivos de ambiente.

## 9. Próximas tarefas

- Confirmar com o professor a estrutura do MySQL.
- Integrar cadastro e login com o banco autorizado.
- Testar os endpoints HTTP completos.
- Integrar autenticação ao frontend React.
- Integrar os serviços dos outros integrantes.
- Revisar permissões, segurança e validações.
- Finalizar Docker Compose, Gateway e apresentação.
- Definir se a apresentação será local ou por deploy.
