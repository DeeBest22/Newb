# Stage 1: Build the application
FROM node:20 AS builder

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./  
COPY prisma ./prisma/
RUN npm install  

# Copy application files
COPY . .  

# Run the build process
RUN npm run build  

# Debugging step: List the contents of the dist directory
RUN ls -l /app/dist
RUN ls -l /app/dist/src

# Stage 2: Production image
FROM node:20  

WORKDIR /app

# Copy only necessary files
COPY --from=builder /app/package*.json ./  
COPY --from=builder /app/node_modules ./node_modules  
COPY --from=builder /app/dist ./dist  
COPY --from=builder /app/prisma ./prisma  

EXPOSE 4001  

# Ensure DATABASE_URL is available at runtime before running Prisma
CMD npx prisma generate && npx prisma migrate deploy && node dist/src/main


# CMD ["sh", "-c", "source .env && npm run start:prod"]