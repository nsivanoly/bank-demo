# Use the official Node.js 18 image as the base image
FROM node:18

# Set working directory inside the container
WORKDIR /app

# Install curl for health checks and API calls
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy package.json and package-lock.json (if present)
COPY package*.json ./

# Install project dependencies
RUN npm install --silent

# Copy all source files into the container
COPY . .

# Copy setup scripts and custom entrypoint
COPY container-init/ /app/container-init/
COPY custom-entrypoint.sh /app/custom-entrypoint.sh
RUN chmod +x /app/custom-entrypoint.sh

# Expose port 3000 for the development server
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=development
ENV SETUP_SCRIPT=/app/container-init/setup-app.sh
ENV CONFIG_FILE=/app/src/config.json

# Use custom entrypoint to run setup-app.sh before starting the app
ENTRYPOINT ["/app/custom-entrypoint.sh"]
