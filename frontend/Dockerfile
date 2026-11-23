# Stage 1: Build React SPA
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve static files via non-root Nginx
FROM nginxinc/nginx-unprivileged:alpine AS runner
USER root
RUN apk upgrade --no-cache

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html

USER 101
EXPOSE 8080