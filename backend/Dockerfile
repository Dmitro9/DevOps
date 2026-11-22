# Stage 1: Build TypeScript & prune dev dependencies
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json tsconfig.json ./
RUN npm install

COPY src ./src
RUN npm run build && npm prune --omit=dev

# Stage 2: Minimal runtime image (non-root)
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder --chown=node:node /app/package.json ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist

USER node
EXPOSE 3000

CMD ["node", "dist/index.js"]