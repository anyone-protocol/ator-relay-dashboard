# BUILD
FROM node:18.16-alpine As build

RUN apk add git python3 make g++

# Accept build argument
ARG NUXT_PUBLIC_COMMIT_HASH

# Set environment variable
ENV NUXT_PUBLIC_COMMIT_HASH=${NUXT_PUBLIC_COMMIT_HASH}

RUN npm install -g pnpm

WORKDIR /usr/src/app

COPY --chown=node:node . .

RUN pnpm install
