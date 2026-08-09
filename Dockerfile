# Étape 1 : Compilation isolée sous Node 22 (Légère et rapide)
FROM node:22-alpine AS builder
WORKDIR /app

# Copie uniquement les fichiers de configuration pour optimiser le cache Docker
COPY package*.json ./

# Installe les dépendances en mode strict et silencieux pour la CI/CD
RUN npm ci

# Copie le reste du code source
COPY . .

# Force la compilation de production via Vite (sans interactivité)
RUN CI=true npm run build

# Étape 2 : Serveur de diffusion Nginx (Dernière génération)
FROM nginx:alpine

# Vite compile tout dans le dossier "dist" (et non plus "build")
COPY --from=builder /app/dist /usr/share/nginx/html

# Modification propre de la configuration par défaut de Nginx pour forcer le port 4321
RUN echo 'server { listen 4321; location / { root /usr/share/nginx/html; index index.html; try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf

EXPOSE 4321
CMD ["nginx", "-g", "daemon off;"]
