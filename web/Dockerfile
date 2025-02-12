# Étape de build
FROM node:lts-alpine as build-stage

# Création et définition du répertoire de travail
WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation des dépendances
RUN npm install

# Copie du code source
COPY . .

# Build de l'application
RUN npm run build

# Étape de production
FROM nginx:stable-alpine as production-stage

# Copie des fichiers de build
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Exposition du port
EXPOSE 80

# Commande de démarrage
CMD ["nginx", "-g", "daemon off;"]
