FROM node:18.20-alpine

# Install dependencies for sharp and other native modules
RUN apk add --no-cache python3 make g++ vips-dev

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p uploads/attachments

# Expose port
EXPOSE 7070

# Start the application
CMD ["npm", "run", "dev"]