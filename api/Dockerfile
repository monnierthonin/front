# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Installer les dépendances nécessaires pour la compilation de bcrypt
RUN apk add --no-cache python3 make g++

# Copier les fichiers de configuration de npm et installer les dépendances
COPY package*.json ./
RUN npm install

# Production stage
FROM node:20-alpine
WORKDIR /app

# Copier les modules node compilés dans la phase précédente
COPY --from=builder /app/node_modules ./node_modules

# Copier tout le reste du code source
COPY . .

# Créer le dossier uploads et ses sous-dossiers avec les bonnes permissions
RUN mkdir -p /uploads/profiles && \
    chown -R node:node /uploads && \
    chmod -R 755 /uploads

# Utilisateur non-root pour la sécurité
USER node

# Exposition du port
EXPOSE 3000

CMD ["npm", "start"]