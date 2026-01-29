# Use official Node.js image
FROM node:18

# Create app directory
WORKDIR /app

# Copy only package info first for caching
COPY package*.json ./

# Install all dependencies
RUN npm install --legacy-peer-deps --silent

# Copy remaining source files
COPY . .

# Expose application port
EXPOSE 8082

# Set env variables
ENV HOST=localhost
ENV PORT=8082

# Start using npm (which calls nodemon with babel-node)
CMD ["npm", "start"]
