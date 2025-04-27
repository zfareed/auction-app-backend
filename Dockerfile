# Stage 1: Build the application
FROM node:20-alpine AS build

WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Create the production image
FROM node:20-alpine

WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy the built application from the build stage
COPY --from=build /usr/src/app/dist ./dist

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["node", "dist/main"]
