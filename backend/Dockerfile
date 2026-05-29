FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
RUN chmod +x node_modules/.bin/tsup
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/index.js"]