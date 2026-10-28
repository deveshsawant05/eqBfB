# Stage 1: Build the React application
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# VITE_API_URL is injected at build time
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["sh", "-c", "sed -i 's/listen 80/listen '\"${PORT:-80}\"'/g' /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
