FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund --fetch-retries=5 --fetch-retry-mintimeout=10000 --fetch-retry-maxtimeout=30000
COPY . .
RUN DATABASE_URL="postgresql://generate:generate@localhost:5432/generate" npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/main.js"]
