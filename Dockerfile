# Multi-stage build for both apps
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
COPY apps/racequest/package*.json ./apps/racequest/
COPY apps/partners/package*.json ./apps/partners/
COPY packages/core/package*.json ./packages/core/
COPY packages/geo/package*.json ./packages/geo/

RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built apps
COPY --from=builder /app/apps/racequest/dist /usr/share/nginx/html/racequest
COPY --from=builder /app/apps/partners/dist /usr/share/nginx/html/partners

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]