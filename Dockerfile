# Agent Network Platform — Express API + dashboard on port 3001
FROM node:22-slim

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the source (src, seed, public, data)
COPY . .

EXPOSE 3001

# Seed fresh demo data on every boot, then start. Seeding regenerates run/review
# timestamps relative to "now", so the Dashboard and Metrics tabs (which window
# on the last 7 days) always show live activity on a hosted deploy. On the
# ephemeral free tier this also gives a clean demo state after each restart.
CMD ["sh", "-c", "npm run seed && npm run dev"]
