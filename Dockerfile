# FROM node:18.16-alpine AS build
FROM node:23.11.0-alpine AS build

RUN apk add git python3 make g++
RUN npm install -g pnpm
WORKDIR /usr/src/app
ARG NUXT_PUBLIC_COMMIT_HASH
ENV NUXT_PUBLIC_COMMIT_HASH=${NUXT_PUBLIC_COMMIT_HASH}
COPY --chown=node:node . .
RUN pnpm install
