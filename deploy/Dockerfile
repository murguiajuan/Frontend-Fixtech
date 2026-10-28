# syntax=docker/dockerfile:1

# ---------- Etapa 1: compilación de la SPA ----------
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

# ---------- Etapa 2: servidor estático + proxy ----------
FROM nginx:1.27-alpine

COPY deploy/nginx/fixtech.docker.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/fixtech-frontend/browser /usr/share/nginx/html

ENV SERVER_NAME=_ \
    BACKEND_UPSTREAM=http://backend:8080

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
