# syntax=docker/dockerfile:1
#
# One Dockerfile, three images — pick one with `--target`:
#
#   calc-service   internal calculation service      node, :3001
#   api-gateway    the public API                    node, :3000
#   web            the built SPA behind nginx, which  nginx, :80
#                  proxies /api/ to the gateway
#
# docker-compose.yml builds all three and wires them together. Node 22 is the
# line the repo pins (see AGENTS.md); the services run their .ts sources
# directly, so the version has to clear the type-stripping floor there.

ARG NODE_VERSION=22.23.2
ARG NGINX_VERSION=1

# ---------------------------------------------------------------------------
# manifests — just what npm needs to resolve the workspace graph, so the
# install layers survive source edits.
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS manifests
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
COPY apps/api-gateway/package.json apps/api-gateway/
COPY apps/calc-service/package.json apps/calc-service/
COPY apps/sezzle-calculator/package.json apps/sezzle-calculator/
COPY packages/contracts/package.json packages/contracts/
COPY packages/eslint-config/package.json packages/eslint-config/
COPY packages/typescript-config/package.json packages/typescript-config/
COPY packages/ui/package.json packages/ui/

# ---------------------------------------------------------------------------
# web-build — the SPA's production bundle. VITE_GATEWAY_URL is baked in at
# build time; empty means "same origin", which is what the nginx proxy below
# expects. Set it to an absolute URL only when the gateway is served elsewhere.
# ---------------------------------------------------------------------------
FROM manifests AS web-build
RUN --mount=type=cache,target=/root/.npm npm ci
COPY packages ./packages
COPY apps/sezzle-calculator ./apps/sezzle-calculator
ARG VITE_GATEWAY_URL=""
ENV VITE_GATEWAY_URL=${VITE_GATEWAY_URL}
RUN npm run build -w sezzle-calculator

# ---------------------------------------------------------------------------
# service-deps — production dependencies of the two services only (hono, zod,
# and the @repo/contracts workspace link). No root devDependencies, no React.
# ---------------------------------------------------------------------------
FROM manifests AS service-deps
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --workspace=calc-service --workspace=api-gateway

# ---------------------------------------------------------------------------
# service-base — shared runtime layer: node_modules plus the contract package
# both services import as source across the workspace symlink.
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS service-base
ENV NODE_ENV=production
WORKDIR /app
COPY --from=service-deps /app ./
COPY packages/contracts ./packages/contracts
USER node

FROM service-base AS calc-service
COPY apps/calc-service ./apps/calc-service
WORKDIR /app/apps/calc-service
ENV CALC_SERVICE_PORT=3001
EXPOSE 3001
# No health route yet (PRD-P1 BE-18), so the probe is a real calculation.
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.CALC_SERVICE_PORT??3001)+'/calculate',{method:'POST',headers:{'content-type':'application/json'},body:'{\"operation\":\"add\",\"operands\":[1,1]}'}).then(r=>process.exit(r.status===200?0:1),()=>process.exit(1))"
CMD ["node", "src/server.ts"]

FROM service-base AS api-gateway
COPY apps/api-gateway ./apps/api-gateway
WORKDIR /app/apps/api-gateway
ENV GATEWAY_PORT=3000
EXPOSE 3000
# Goes green only once a calculation round-trips through calc-service.
HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.GATEWAY_PORT??3000)+'/api/v1/calculate',{method:'POST',headers:{'content-type':'application/json'},body:'{\"operation\":\"add\",\"operands\":[1,1]}'}).then(r=>process.exit(r.status===200?0:1),()=>process.exit(1))"
CMD ["node", "src/server.ts"]

# ---------------------------------------------------------------------------
# web — static files behind nginx. GATEWAY_UPSTREAM is read at container start
# (the nginx image renders /etc/nginx/templates/*.template with envsubst), so
# the same image points at any gateway.
# ---------------------------------------------------------------------------
FROM nginx:${NGINX_VERSION}-alpine AS web
# NGINX_ENTRYPOINT_LOCAL_RESOLVERS makes the entrypoint export the container's
# DNS servers as NGINX_LOCAL_RESOLVERS, which the template's `resolver` uses.
ENV GATEWAY_UPSTREAM=http://api-gateway:3000 \
    NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1
COPY docker/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=web-build /app/apps/sezzle-calculator/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --start-period=3s --retries=3 \
  CMD wget -qO /dev/null http://127.0.0.1/ || exit 1
