FROM node:18-alpine

WORKDIR /app

COPY . .
COPY package.json ./
COPY .env.local ./.env.local

RUN npm install --include=dev

CMD ["npm", "run", "docker"]
