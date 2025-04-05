# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Installer Vue CLI globalement
RUN npm install -g @vue/cli

# Installer les dépendances
COPY package*.json ./
RUN npm ci

# Copier le code source et construire l'application
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Copier les fichiers de build
COPY --from=builder /app/dist .

# Copier la configuration nginx personnalisée si nécessaire
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

# Configurer Nginx pour écouter sur le port 3000
CMD sed -i -e 's/80/3000/g' /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'