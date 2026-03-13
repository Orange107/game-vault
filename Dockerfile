FROM node:20-bullseye

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

RUN mkdir -p /app/data

ENV PORT=8787
ENV DB_PATH=/app/data/game-vault.db

EXPOSE 8787

CMD ["npm", "run", "start"]
