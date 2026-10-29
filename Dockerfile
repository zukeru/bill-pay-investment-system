FROM node:22-alpine AS appbase
WORKDIR /app
ENV CI=1 EXPO_NO_TELEMETRY=1
COPY apps/mobile/package*.json ./
RUN npm ci
COPY apps/mobile/ ./
FROM appbase AS mobile-dev
ENV REACT_NATIVE_PACKAGER_HOSTNAME=127.0.0.1 EXPO_PUBLIC_API_URL=http://localhost:8080/api
EXPOSE 8081
CMD ["npx", "expo", "start", "--host", "lan", "--port", "8081"]
FROM appbase AS webbuild
RUN npx expo export --platform web
FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=webbuild /app/dist/ /usr/share/nginx/html/
EXPOSE 80
