# Agent Network Platform — Express API + dashboard on port 3001
FROM node:22-slim

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the source (src, seed, public, data)
COPY . .

EXPOSE 3001

# Seed demo data on first boot (only if the data store is empty), then start.
# data/ is bind-mounted in docker-compose, so on a fresh checkout the committed
# seed data is reused and this skips straight to the server.
CMD ["sh", "-c", "[ -f data/agents.json ] || npm run seed; npm run dev"]
