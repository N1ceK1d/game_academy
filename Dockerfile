FROM node:22
WORKDIR /game_academy
COPY package.json package-lock.json ./
RUN npm install
COPY . ./
CMD node main.js
