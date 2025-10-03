# Multi-stage build para produção
FROM node:20-alpine AS builder

# Instalar dependências necessárias para build
RUN apk add --no-cache git

WORKDIR /app

# Definir variáveis de ambiente padrão para build
ARG VITE_API_URL
ARG VITE_SITE_URL
ARG VITE_SENTRY_DSN
ARG VITE_SENTRY_ENVIRONMENT
ARG VITE_CLOUDINARY_CLOUD_NAME
ARG VITE_CLOUDINARY_UPLOAD_PRESET

# Definir variáveis de ambiente padrão (valores fallback)
ENV VITE_API_URL=${VITE_API_URL:-http://localhost:3001}
ENV VITE_SITE_URL=${VITE_SITE_URL:-http://localhost:3000}
ENV VITE_SENTRY_DSN=${VITE_SENTRY_DSN:-}
ENV VITE_SENTRY_ENVIRONMENT=${VITE_SENTRY_ENVIRONMENT:-development}
ENV VITE_CLOUDINARY_CLOUD_NAME=${VITE_CLOUDINARY_CLOUD_NAME:-}
ENV VITE_CLOUDINARY_UPLOAD_PRESET=${VITE_CLOUDINARY_UPLOAD_PRESET:-}

# Mostrar variáveis de ambiente usadas no build
RUN echo "=== VARIÁVEIS DE AMBIENTE USADAS NO BUILD ===" && \
    echo "VITE_API_URL: $VITE_API_URL" && \
    echo "VITE_SITE_URL: $VITE_SITE_URL" && \
    echo "VITE_SENTRY_DSN: ${VITE_SENTRY_DSN:0:20}..." && \
    echo "VITE_SENTRY_ENVIRONMENT: $VITE_SENTRY_ENVIRONMENT" && \
    echo "VITE_CLOUDINARY_CLOUD_NAME: $VITE_CLOUDINARY_CLOUD_NAME" && \
    echo "VITE_CLOUDINARY_UPLOAD_PRESET: $VITE_CLOUDINARY_UPLOAD_PRESET" && \
    echo "=============================================="

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências (incluindo devDependencies para build)
RUN npm ci

# Copiar código fonte
COPY . .

# Build da aplicação com otimizações para produção
RUN npx vite build

# Verificar se o build foi bem-sucedido
RUN ls -la dist/

# Estágio de produção
FROM node:20-alpine AS runner

# Instalar serve para servir arquivos estáticos
RUN npm install -g serve

WORKDIR /app

# Definir variáveis de ambiente padrão para runtime
ARG VITE_API_URL
ARG VITE_SITE_URL
ARG VITE_SENTRY_DSN
ARG VITE_SENTRY_ENVIRONMENT
ARG VITE_CLOUDINARY_CLOUD_NAME
ARG VITE_CLOUDINARY_UPLOAD_PRESET

# Definir variáveis de ambiente padrão (valores fallback)
ENV VITE_API_URL=${VITE_API_URL:-http://localhost:3001}
ENV VITE_SITE_URL=${VITE_SITE_URL:-http://localhost:3000}
ENV VITE_SENTRY_DSN=${VITE_SENTRY_DSN:-}
ENV VITE_SENTRY_ENVIRONMENT=${VITE_SENTRY_ENVIRONMENT:-development}
ENV VITE_CLOUDINARY_CLOUD_NAME=${VITE_CLOUDINARY_CLOUD_NAME:-}
ENV VITE_CLOUDINARY_UPLOAD_PRESET=${VITE_CLOUDINARY_UPLOAD_PRESET:-}

# Mostrar variáveis de ambiente usadas no runtime
RUN echo "=== VARIÁVEIS DE AMBIENTE USADAS NO RUNTIME ===" && \
    echo "VITE_API_URL: $VITE_API_URL" && \
    echo "VITE_SITE_URL: $VITE_SITE_URL" && \
    echo "VITE_SENTRY_DSN: ${VITE_SENTRY_DSN:0:20}..." && \
    echo "VITE_SENTRY_ENVIRONMENT: $VITE_SENTRY_ENVIRONMENT" && \
    echo "VITE_CLOUDINARY_CLOUD_NAME: $VITE_CLOUDINARY_CLOUD_NAME" && \
    echo "VITE_CLOUDINARY_UPLOAD_PRESET: $VITE_CLOUDINARY_UPLOAD_PRESET" && \
    echo "================================================"

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