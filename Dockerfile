# Stage 1: Build the Vite application
FROM docker.io/node:26-alpine AS builder

WORKDIR /app

# Copy dependency files first to leverage Docker layer caching
COPY package*.json ./

# Install dependencies cleanly
RUN npm ci

# Copy the rest of the application source code
COPY tsconfig.json .
COPY tsconfig.app.json .
COPY tsconfig.node.json .
COPY vite.config.ts .
COPY index.html .
COPY ./src/ ./src/
COPY ./public/ ./public/
COPY .env .

# Build the project for production (outputs to /app/dist)
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM docker.io/nginx:1.31-alpine

# Copy custom Nginx configuration for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the compiled static files from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
