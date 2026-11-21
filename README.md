# Lumera — Gestão Clínica

**Projeto Integrador V · Análise e Desenvolvimento de Sistemas**

Sistema acadêmico de gestão clínica com interface web em React, autenticação por JWT e arquitetura de microsserviços. O projeto permite administrar a equipe, gerenciar agendamentos e registrar prontuários por meio de um API Gateway.

## Equipe e responsabilidades

| Integrante | Responsabilidade principal |
|---|---|
| Matheus Pessoa | Auth Service, autenticação, integração e interface |
| Matheus Saraiva | Appointment Service — agendas e agendamentos |
| Luccas Bentim | Prontuario Service — prontuários |

A integração final também envolve Docker Compose, API Gateway e consumo das APIs pelo frontend.

## Funcionalidades

- Login com e-mail e senha, hash com bcrypt e emissão de JWT.
- Perfis **Administrador**, **Profissional de Saúde** e **Recepção**.
- Gestão de usuários pela administração: cadastro, consulta, edição, ativação e desativação.
- Agendas, disponibilidades, bloqueios, criação e cancelamento de agendamentos, com verificação de conflitos de horário.
- Prontuários: listagem, pesquisa, cadastro, edição, mudança de status e indicadores.
- Dashboard integrado às APIs e navegação responsiva.
- Isolamento de agendas e agendamentos por clínica (tenant) no Appointment Service; acesso a prontuários limitado a profissionais de saúde e administradores.

**Limites da demonstração:** os agendamentos são persistidos no MySQL, mas a seleção de pacientes usa identificadores fictícios estáveis, sem cadastro de pacientes integrado. Os prontuários são persistidos no PostgreSQL e identificam paciente e profissional por nome, sem vínculo relacional com a tabela de usuários do Auth Service. O controle de permissões no backend não equivale a uma auditoria de segurança para produção.

## Tecnologias

| Camada | Tecnologias |
|---|---|
| Frontend | React 19, Vite 8, JavaScript, Tailwind CSS, React Router, Lucide |
| Backend | NestJS 12, Node.js 24, TypeScript |
| Persistência | Prisma ORM 7, MySQL (Auth e Appointment), PostgreSQL 17 (Prontuários) |
| Autenticação | JWT, bcrypt, guards do NestJS |
| Infraestrutura | Docker, Docker Compose, Nginx API Gateway |
| Testes | Vitest; testes E2E onde configurados |

## Arquitetura

```text
Navegador (React + Vite, localhost:5173)
                  |
                  v
       Nginx API Gateway (:8080)
          /       |        \
         v        v         v
       Auth    Appointment  Prontuario
       :3001      :3002      :3003
         |          |          |
       MySQL      MySQL    PostgreSQL
      (Senac)    (Senac)  (Docker :55432)
```

Cada microsserviço tem sua própria lógica e acesso ao banco sob sua responsabilidade. As requisições do frontend passam pelo Gateway Nginx, que encaminha cada rota ao serviço correspondente.

### Estrutura do repositório

```text
frontend/                    Interface React
services/auth-service/       Login, JWT e usuários
services/appointment-service/ Agendas, horários e agendamentos
services/prontuario-service/ Prontuários e indicadores
gateway/nginx/nginx.conf      Rotas do API Gateway
compose.yaml                 Orquestração dos containers
```

## Pré-requisitos

- Node.js **24** e npm.
- Docker Desktop com Docker Compose.
- Git.
- Acesso aos bancos **MySQL de Auth e Appointment**, com tabelas previamente configuradas para o trabalho acadêmico.
- Portas locais `5173`, `8080`, `3001`, `3002`, `3003` e `55432` disponíveis.

**Importante:** a aplicação não cria automaticamente os bancos MySQL fornecidos pela instituição. Não execute `prisma db push`, `migrate reset` ou migrações no servidor do professor sem autorização.

## Configuração do ambiente

Clone o repositório e entre na pasta:

```bash
git clone https://github.com/matheuspessoa14/academic-projeto-integrador-V.git
cd academic-projeto-integrador-V
```

Crie os arquivos abaixo **localmente**. Substitua os campos de exemplo por configurações próprias e não publique nenhum segredo.

### 1. Arquivo `.env` na raiz

O Docker Compose lê esta variável durante a interpolação do PostgreSQL:

```dotenv
PRONTUARIO_DB_PASSWORD=SENHA_LOCAL_FORTE_SEM_CARACTERES_ESPECIAIS
```

### 2. Arquivo `.env.compose` na raiz

Este arquivo é usado pelo Auth Service e pelo Prontuario Service:

```dotenv
DATABASE_URL=mysql://USUARIO_AUTH:SENHA_AUTH@HOST_MYSQL:3306/BANCO_AUTH
JWT_SECRET=CHAVE_ALEATORIA_LONGA_COMPARTILHADA_ENTRE_OS_SERVICOS
JWT_EXPIRES_IN=1h
TENANT_ID=00000000-0000-4000-8000-000000000001
```

`TENANT_ID` deve representar a clínica usada na demonstração; ajuste-o de acordo com os dados efetivos do banco. Use um segredo JWT aleatório, não o texto de exemplo.

### 3. Arquivo `services/appointment-service/.env`

```dotenv
DATABASE_URL=mysql://USUARIO_AGENDAMENTO:SENHA_AGENDAMENTO@HOST_MYSQL:3306/BANCO_AGENDAMENTO
JWT_SECRET=CHAVE_ALEATORIA_LONGA_COMPARTILHADA_ENTRE_OS_SERVICOS
TENANT_ID=00000000-0000-4000-8000-000000000001
```

**Obrigatório:** o `JWT_SECRET` deve ter o mesmo valor nos três serviços; os identificadores `TENANT_ID` precisam corresponder à clínica das agendas cadastradas. O Prontuario Service recebe seu `TENANT_ID` pela configuração do Compose.

### 4. Arquivo `frontend/.env.local`

```dotenv
VITE_API_URL=http://localhost:8080
```

O frontend deve acessar o Gateway (`8080`), não diretamente os microsserviços.

> **Segurança:** nenhum arquivo `.env`, `.env.local`, `.env.compose`, senha, token ou URL com credenciais deve ser commitado. Se um segredo for exposto, revogue ou substitua-o.

## Execução local

Na raiz do projeto:

```bash
docker compose config --quiet
docker compose up -d --build
docker compose ps
```

Na **primeira execução**, aplique as migrações do PostgreSQL local para criar a tabela de prontuários:

```bash
docker compose exec prontuario-service npx prisma migrate deploy --config prisma7.config.ts
```

A operação acima destina-se **somente ao PostgreSQL do container**, não aos bancos MySQL da instituição.

Inicie o React em outro terminal:

```bash
cd frontend
npm ci
npm run dev
```

Acesse **http://localhost:5173**. Para testar o Gateway: **http://localhost:8080/health**.

### Serviços e endereços

| Componente | Endereço |
|---|---|
| React | http://localhost:5173 |
| Nginx Gateway | http://localhost:8080 |
| Gateway Health | http://localhost:8080/health |
| Auth Service | http://localhost:3001 |
| Swagger Auth | http://localhost:3001/api |
| Appointment Service | http://localhost:3002 |
| Swagger Appointment | http://localhost:3002/api |
| Prontuario Service | http://localhost:3003 |
| PostgreSQL local (restrito ao host) | 127.0.0.1:55432 |

## Rotas principais do Gateway

| Método | Rota | Finalidade |
|---|---|---|
| `POST` | `/auth/login` | Autenticação e geração de JWT |
| `GET` | `/auth/verify` | Verificação do token |
| `GET`, `POST` | `/users` | Listar e cadastrar membros da equipe (admin) |
| `PATCH` | `/users/:id` | Atualizar dados/perfil/status (admin) |
| `GET` | `/users/profissionais` | Listar profissionais ativos |
| `GET` | `/agendas` | Consultar agendas |
| `GET`, `POST` | `/disponibilidades` | Consultar/cadastrar disponibilidades |
| `GET`, `POST` | `/bloqueios` | Consultar/cadastrar bloqueios |
| `GET`, `POST` | `/agendamentos` | Consultar/criar agendamentos |
| `PATCH` | `/agendamentos/:id/cancelar` | Cancelar agendamento |
| `GET`, `POST` | `/prontuarios` | Consultar/cadastrar prontuários |
| `GET` | `/prontuarios/estatisticas` | Indicadores dos prontuários |
| `PATCH` | `/prontuarios/:id` | Editar prontuário |

As rotas protegidas exigem `Authorization: Bearer <TOKEN>`. Os DTOs e as respostas detalhadas podem ser consultados no código e, nos serviços que expõem Swagger, na documentação da API.

## Testes e validação

Para executar a suíte de cada microsserviço a partir da raiz:

```bash
cd services/auth-service
npm ci
npm run test
npm run build

cd ../appointment-service
npm ci
npm run test
npm run build

cd ../prontuario-service
npm ci
npm run test
npm run build

cd ../../frontend
npm ci
npm run build
```

Na última execução informada pela equipe, o Appointment Service passou em **51 testes unitários**, incluindo quatro testes adicionais de isolamento por clínica, e compilou com sucesso. Os demais serviços e a interface também foram testados durante a integração; execute os comandos acima novamente no computador da apresentação.

### Roteiro sugerido para a demonstração

1. Mostrar o diagrama de arquitetura e os containers em execução (`docker compose ps`).
2. Abrir `http://localhost:8080/health` para comprovar o funcionamento do Gateway.
3. Autenticar um **Administrador** e demonstrar a gestão de usuários.
4. Acessar **Agendamentos**, mostrar disponibilidade, criar ou consultar um horário e cancelar uma consulta.
5. Acessar **Prontuários**, criar e atualizar um registro; recarregar a página para confirmar persistência.
6. Demonstrar a diferença de permissões acessando com uma conta de **Recepção** (sem acesso a usuários e prontuários).
7. Destacar quais dados são persistidos em MySQL e PostgreSQL, e quais são fictícios para fins acadêmicos.

Use apenas contas de teste previamente cadastradas; não inclua senhas no repositório nem nos slides.

## Operação e solução de problemas

```bash
# Estado dos containers
docker compose ps

# Logs recentes
docker compose logs --tail=50 auth-service appointment-service prontuario-service gateway

# Recriar um serviço após alteração de código
docker compose up -d --build appointment-service

# Encerrar os containers, preservando o volume PostgreSQL
docker compose down
```

Evite `docker compose down -v` durante os testes: `-v` remove os volumes persistentes, inclusive os dados do PostgreSQL local.

Se o frontend não alcançar a API, confira `frontend/.env.local`, o Gateway na porta `8080` e o CORS configurado para `http://localhost:5173`. Se o agendamento retornar `401`, verifique a validade do token e se `JWT_SECRET` e `TENANT_ID` coincidem com a configuração do Auth Service. Se não aparecerem agendas, confira a associação da agenda com a clínica do token e se existem disponibilidades para as datas exibidas.

## Considerações de segurança e limitações

A aplicação usa senhas com hash, JWT, validação de entrada, guards e regras de acesso por perfil. No Appointment Service, as operações consultam a clínica associada ao token e usam verificações transacionais para reduzir conflitos de horário. O Prontuario Service restringe acesso por perfil e tenant configurado, mas seu modelo ainda não possui uma coluna de clínica por prontuário; por isso, **a demonstração considera um único tenant nesse banco**. Não foi implementado um cadastro integrado de pacientes. As credenciais do banco institucional não são distribuídas com o código.

O projeto foi concebido para avaliação acadêmica e não possui todos os requisitos de um produto clínico em produção (auditoria completa, infraestrutura de alta disponibilidade, gestão de consentimento e integração formal entre os cadastros de pacientes).

## Repositório

[github.com/matheuspessoa14/academic-projeto-integrador-V](https://github.com/matheuspessoa14/academic-projeto-integrador-V)
