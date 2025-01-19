FROM node:20-alpine AS development
ENV NODE_ENV development
# Add a work directory
WORKDIR /app
# Cache and Install dependencies
COPY package.json package-lock.json ./
# Using npm ci to install dependencies based on package-lock.json for a more reliable install
RUN npm ci
COPY . .
# Expose port
EXPOSE 3000
# Start the app
CMD ["npm", "run", "dev"]