# 빌드 스테이지
FROM node:18-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 실행 스테이지
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# 먼저 파일들을 복사
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# 권한 설정
RUN chown -R node:node /app && \
    chmod -R 755 /app

# node 사용자로 전환
USER node

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"] 