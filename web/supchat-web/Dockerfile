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

# Copier la configuration nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]