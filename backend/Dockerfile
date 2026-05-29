FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install && npm install -g tsup
COPY . .
RUN tsup src/index.ts --format cjs
EXPOSE 3000
CMD ["node", "dist/index.js"]