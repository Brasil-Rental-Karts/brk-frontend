# Multi-stage build para produção
FROM node:20-alpine AS builder

# Instalar dependências necessárias para build
RUN apk add --no-cache git

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências (incluindo devDependencies para build)
RUN npm ci --only=production=false

# Copiar código fonte
COPY . .

# Build da aplicação com otimizações para produção
RUN npm run build

# Verificar se o build foi bem-sucedido
RUN ls -la dist/

# Estágio de produção
FROM node:20-alpine AS runner

# Instalar serve para servir arquivos estáticos
RUN npm install -g serve

WORKDIR /app

# Copiar arquivos buildados do estágio anterior
COPY --from=builder /app/dist ./dist

# Copiar package.json para manter compatibilidade
COPY --from=builder /app/package.json ./package.json

# Expor porta 3000 (padrão do serve)
EXPOSE 3000

# Configurar usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 vite
USER vite

# Comando para servir os arquivos estáticos
CMD ["serve", "-s", "dist", "-l", "3000"]