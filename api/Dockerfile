# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install

# Production stage
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
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