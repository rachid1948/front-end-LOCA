# ── Stage 1: Build Angular ───────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Copier package.json en premier (cache Docker optimisé)
COPY package*.json ./
RUN npm ci

# Copier le reste du code source et builder en production
COPY . .
RUN npx ng build --configuration production

# ── Stage 2: Servir avec Nginx ───────────────────────────────
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Supprimer la config nginx par défaut
RUN rm -rf ./*

# Copier le build Angular
COPY --from=builder /app/dist/front-end-loca/browser ./

# Copier la config nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
