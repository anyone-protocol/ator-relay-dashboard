FROM node:22.22-alpine3.23 AS build
ARG NUXT_PUBLIC_COMMIT_HASH
ENV NUXT_PUBLIC_COMMIT_HASH=${NUXT_PUBLIC_COMMIT_HASH}
RUN apk add git python3 make g++ curl unzip rclone
# Pinned deliberately. An unpinned `pnpm` means the image picks up whatever released that day, so
# CI behaviour changes with no commit behind it — which is how the main branch build broke on
# 2026-07-02 (ERR_PNPM_IGNORED_BUILDS) without anything in the repo changing.
RUN npm install -g pnpm@11.21.0
WORKDIR /usr/src/app
COPY --chown=node:node . .
RUN pnpm install
