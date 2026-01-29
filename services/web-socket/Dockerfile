# Use the official Node.js 18 image as the base image
FROM node:18

# Set the working directory inside the container to /app
WORKDIR /app

# Copy package.json and package-lock.json (if present) to the container
COPY package*.json ./

# Install dependencies defined in package.json
RUN npm install --silent

# Copy all remaining source files into the container
COPY . .

# Expose port 8081 for the application
EXPOSE 8081

# Set environment variables for host and port
ENV HOST=localhost
ENV PORT=8081

# Start the Node.js application using index.js as the entry point
CMD ["node", "index.js"]
