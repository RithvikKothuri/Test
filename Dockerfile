# Dockerfile - lightweight production build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
# use a minimal runtime image
FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=builder /app .
EXPOSE 3000
ENV NODE_ENV=production
CMD [ "node", "src/app.js" ]
