FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY index.cjs ./
CMD ["node", "index.cjs"]
