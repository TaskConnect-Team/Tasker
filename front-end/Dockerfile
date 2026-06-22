# Stage 1: Build
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_API_BASE_URL
ARG VITE_GOOGLE_MAPS_API_KEY
ARG VITE_FIREBASE_API_KEY
ARG VITE_CLOUDINARY_UPLOAD_PRESET
RUN npm run build

# Stage 2: Serve via Nginx
FROM nginx:alpine AS runner
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80