# BUILD
FROM node:18.16-alpine As build

RUN apk add git python3 make g++

RUN npm install -g pnpm

WORKDIR /usr/src/app

COPY --chown=node:node . .

RUN pnpm install
