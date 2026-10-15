# =========================================================
# Stage 1 - Build React/Vite Application
# =========================================================

FROM node:24-slim AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build


# =========================================================
# Stage 2 - Nginx HTTPS + Brotli
# =========================================================

FROM debian:bookworm-slim

# Install Nginx, Brotli modules and OpenSSL
RUN apt-get update && \
    apt-get install -y \
        nginx \
        libnginx-mod-http-brotli-filter \
        libnginx-mod-http-brotli-static \
        openssl && \
    rm -rf /var/lib/apt/lists/*

# Remove default Nginx configuration
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy React/Vite production build
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create SSL directory
RUN mkdir -p /etc/nginx/ssl

# Copy SSL certificate
COPY ssl/swm.crt /etc/nginx/ssl/swm.crt

# Copy SSL private key
COPY ssl/swm.key /etc/nginx/ssl/swm.key

# Protect private key
RUN chmod 600 /etc/nginx/ssl/swm.key

EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]
