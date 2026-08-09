# Étape 1 : Compilation native ultra-rapide sous Node 22
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
# Plus besoin de flags de contournement, l'arbre est sain
RUN npm install
COPY . .
RUN npm run build

# Étape 2 : Serveur Web de diffusion de production (Nginx)
FROM nginx:alpine
# ATTENTION : Vite génère ses fichiers dans le dossier "dist" (et non plus "build")
COPY --from=builder /app/dist /usr/share/nginx/html

# Ajustement pour que Nginx écoute directement sur votre port dédié 4321
RUN sed -i 's/listen       80;/listen       4321;/g' /etc/nginx/conf.d/default.conf

EXPOSE 4321
CMD ["nginx", "-g", "daemon off;"]
