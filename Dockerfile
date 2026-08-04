FROM node:26.5.1-alpine3.23 AS dependencies
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json .npmrc ./
RUN npm ci --ignore-scripts

FROM node:26.5.1-alpine3.23 AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:26.5.1-alpine3.23 AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
RUN addgroup --system --gid 1001 sentinel && adduser --system --uid 1001 --ingroup sentinel sentinel
COPY --from=builder --chown=sentinel:sentinel /app/public ./public
COPY --from=builder --chown=sentinel:sentinel /app/.next/standalone ./
COPY --from=builder --chown=sentinel:sentinel /app/.next/static ./.next/static
USER sentinel
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "server.js"]
