# Node app + isolated Python venv for the ytmusicapi adapter.
FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:22-bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-venv && rm -rf /var/lib/apt/lists/*
COPY adapter/requirements.txt adapter/requirements.txt
RUN python3 -m venv /opt/ytm && /opt/ytm/bin/pip install --no-cache-dir -r adapter/requirements.txt
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/dist dist
COPY --from=build /app/package.json package.json
COPY adapter adapter
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8787 PYTHON_BIN=/opt/ytm/bin/python DATABASE_PATH=/data/companion.sqlite
RUN mkdir -p /data && chown node:node /data
USER node
VOLUME /data
EXPOSE 8787
CMD ["node", "dist/src/server.js"]
