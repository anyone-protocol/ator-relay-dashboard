FROM node:23.11.0-alpine AS build
ARG NUXT_PUBLIC_COMMIT_HASH
ENV NUXT_PUBLIC_COMMIT_HASH=${NUXT_PUBLIC_COMMIT_HASH}
RUN apk add git python3 make g++ curl unzip rclone
RUN npm install -g pnpm
WORKDIR /usr/src/app
COPY --chown=node:node . .
RUN pnpm install
