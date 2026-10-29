FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && mkdir -p /app/uploads && chown node:node /app/uploads
COPY --chown=node:node src ./src
USER node
ENV NODE_ENV=production PORT=3001 HOST=0.0.0.0 UPLOAD_DIR=/app/uploads
EXPOSE 3001
CMD ["node", "src/index.js"]
