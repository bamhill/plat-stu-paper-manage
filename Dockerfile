FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV DATABASE_URL="file:./data/dev.db"
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /app ./
RUN mkdir -p /app/seed/prisma-data /app/prisma/data /app/data \
    && cp /app/prisma/data/dev.db /app/seed/prisma-data/dev.db
EXPOSE 3000
CMD ["sh", "-c", "if [ ! -f /app/prisma/data/dev.db ]; then cp /app/seed/prisma-data/dev.db /app/prisma/data/dev.db; fi; npm start"]
