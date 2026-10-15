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

FROM nginx:bookworm

# Install Brotli Nginx modules and OpenSSL
RUN apt-get update && \
    apt-get install -y \
        libnginx-mod-http-brotli-filter \
        libnginx-mod-http-brotli-static \
        openssl && \
    rm -rf /var/lib/apt/lists/*

# Copy React/Vite build
COPY --from=build /app/dist /usr/share/nginx/html

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy SSL certificate
COPY ssl/swm.crt /etc/nginx/ssl/swm.crt

# Copy SSL private key
COPY ssl/swm.key /etc/nginx/ssl/swm.key

EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]