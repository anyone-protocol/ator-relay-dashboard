# BUILD
FROM node:18.16-alpine As build

RUN apk add git python3 make g++

# Accept build argument
ARG COMMIT_HASH

# Set environment variable
ENV COMMIT_HASH=${COMMIT_HASH}

RUN npm install -g pnpm

WORKDIR /usr/src/app

COPY --chown=node:node . .

RUN pnpm install
