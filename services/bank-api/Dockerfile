# Use the official Node.js 18 image as the base image
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if present) to the container
COPY package*.json ./

# Install dependencies defined in package.json
RUN npm install --silent

# Copy all remaining source code into the container
COPY . .

# Expose HTTP (2001) and HTTPS (3443) ports
EXPOSE 2001 3443

# Set environment variables for the application
ENV HOST=localhost
ENV PORT_HTTP=2001
ENV PORT_HTTPS=3443

# Start the Node.js application
CMD ["node", "index.js"]
