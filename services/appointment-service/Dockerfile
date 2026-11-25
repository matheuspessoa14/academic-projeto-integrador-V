FROM node:24-bookworm-slim

WORKDIR /app

COPY package*.json ./

RUN npm ci --no-audit --no-fund --fetch-retries=5 --fetch-retry-mintimeout=10000 --fetch-retry-maxtimeout=30000

COPY prisma ./prisma
COPY prisma.config.ts ./
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src

# URL fictícia utilizada somente para gerar o Prisma Client
RUN DATABASE_URL="mysql://usuario:senha@localhost:3306/lumera_build" npx prisma generate

# Compilar o NestJS
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/main.js"]
