# Production container for the "mofa" host app (serves libs/modules/mofa-chatbot,
# among the other agent modules, at its dedicated appId). Build from the
# WORKSPACE ROOT so this stage can see the libs/ packages apps/mofa depends on:
#
#   docker build -f apps/mofa/Dockerfile -t infinyx-mofa-frontend .
#
# See NGINX_STREAMING.md for what a fronting gateway/ingress needs if this
# container's own nginx isn't the thing directly proxying to the backend.

FROM node:22-alpine AS build
WORKDIR /workspace

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml nx.json tsconfig.base.json ./
COPY apps ./apps
COPY libs ./libs

RUN corepack enable && pnpm install --frozen-lockfile
RUN npx nx build mofa -c production

FROM nginx:alpine AS runtime

# envsubst'd into /etc/nginx/conf.d/default.conf at container start by the
# base image's own entrypoint scripts -- only ${BACKEND_ORIGIN} below is
# substituted (envsubst is restricted to variables actually present in the
# environment), nginx's own $host/$remote_addr/etc. runtime variables are
# left untouched.
COPY apps/mofa/nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /workspace/dist/apps/mofa/browser /usr/share/nginx/html

# Where the backend is reachable from inside this container. Point this at a
# docker-compose service name for a local/self-hosted stack (e.g.
# http://backend:8000), or leave unset only if something in front of this
# container (not this container itself) is what proxies /mofa-chatbot/api/ --
# see NGINX_STREAMING.md.
ENV BACKEND_ORIGIN=http://backend:8000

EXPOSE 80
