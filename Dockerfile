FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY frontend/package.json frontend/package-lock.json* ./

# Install dependencies
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY frontend .

# Set default environment variables for build time
ARG NEXTAUTH_SECRET=default-nextauth-secret-please-change-in-production
ARG JWT_SECRET=default-jwt-secret-please-change-in-production
ARG NEXT_PUBLIC_FHIR_SERVER_URL=http://localhost:8091/fhir

# Set environment variables
ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
ENV JWT_SECRET=${JWT_SECRET}
ENV NEXT_PUBLIC_FHIR_SERVER_URL=${NEXT_PUBLIC_FHIR_SERVER_URL}

# Next.js collects completely anonymous telemetry data about general usage
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line to disable telemetry during the build
ENV NEXT_TELEMETRY_DISABLED 1

# Build the Next.js application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# Disable telemetry during runtime
ENV NEXT_TELEMETRY_DISABLED 1

# Create a non-root user to run the app and own app files
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set the correct permissions for the app directory
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Set the user to nextjs
USER nextjs

# Expose the port the app will run on
EXPOSE 3000

# Set environment variables
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Copy environment variables from builder stage if not provided at runtime
ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
ENV JWT_SECRET=${JWT_SECRET}
ENV NEXT_PUBLIC_FHIR_SERVER_URL=${NEXT_PUBLIC_FHIR_SERVER_URL}

# Run the application
CMD ["node", "server.js"]