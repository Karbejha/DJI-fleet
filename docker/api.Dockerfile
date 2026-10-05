FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/api/package*.json ./apps/api/

RUN npm install

COPY packages/shared/ ./packages/shared/
COPY apps/api/ ./apps/api/

WORKDIR /app/apps/api
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/api/package*.json ./apps/api/

RUN npm install --omit=dev

COPY --from=builder /app/packages/shared/ ./packages/shared/
COPY --from=builder /app/apps/api/dist/ ./apps/api/dist/

WORKDIR /app/apps/api

EXPOSE 4000

CMD ["node", "dist/main.js"]
