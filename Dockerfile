FROM node:18-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package.json package-lock.json ./

# Install ALL dependencies (including dev deps like drizzle-kit)
RUN npm ci

# Copy source code
COPY . .

# Use npm run start:dev for hot-reload
CMD ["npm", "run", "start:dev"]