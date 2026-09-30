FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install

FROM node:22-alpine AS builder
WORKDIR /app
ARG BACKEND_INTERNAL_URL=http://api:8000
ENV BACKEND_INTERNAL_URL=${BACKEND_INTERNAL_URL}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p public
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000
ARG BACKEND_INTERNAL_URL=http://api:8000
ENV BACKEND_INTERNAL_URL=${BACKEND_INTERNAL_URL}
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=deps /app/node_modules ./node_modules
EXPOSE 3000
CMD ["npm", "run", "start"]
