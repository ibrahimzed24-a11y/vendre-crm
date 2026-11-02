# VENDRE — Self-Hosted Production Deployment Guide

VENDRE is designed for 100% self-hosted, private operation without requiring third-party SaaS subscriptions, paid databases, or external AI APIs.

---

## 1. Production Architecture Overview

A standard production deployment consists of:
1. **Reverse Proxy / TLS Termination**: Nginx or Traefik managing SSL certificates (Let's Encrypt) and routing to the Node.js application container.
2. **Next.js Application Container**: Running `next start` on internal port 3000.
3. **PostgreSQL Database Container**: Running PostgreSQL 16 with a persistent Docker volume and automated backups.

```
 Internet (HTTPS 443)
          │
    ┌─────▼─────┐
    │   Nginx   │ (SSL Termination & Rate Limiting)
    └─────┬─────┘
          │ Reverse Proxy (Internal Port 3000)
    ┌─────▼──────────┐
    │ VENDRE Next.js │
    │   App Server   │
    └─────┬──────────┘
          │ PostgreSQL 16 (Port 5432)
    ┌─────▼──────────┐
    │  PostgreSQL 16 │ (Persistent Volume)
    └────────────────┘
```

---

## 2. Production Dockerfile

Create `Dockerfile` in the project root:

```dockerfile
# Stage 1: Build dependencies and Next.js bundle
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 2: Production runtime image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
EXPOSE 3000
CMD ["npm", "run", "start"]
```

---

## 3. Production Environment Variables Checklist

Ensure the following variables are configured in production:

| Variable | Description | Example / Requirement |
| :--- | :--- | :--- |
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Listening port | `3000` |
| `DATABASE_URL` | PostgreSQL connection URL | `postgresql://user:password@postgres:5432/vendre_crm?schema=public` |
| `SESSION_SECRET` | Cryptographic HMAC key for JWT session cookies | Minimum 64-character random string (e.g. generated via `openssl rand -hex 32`) |
| `COOKIE_NAME` | Session cookie identifier | `vendre_session` |
| `COOKIE_SECURE` | Force HTTPS-only cookie transmission | `true` |

---

## 4. Production Database Migrations & Safety

Before deploying application updates to production:
1. Back up database state:
   ```bash
   docker exec -t vendre-postgres pg_dump -U postgres vendre_crm > backup_$(date +%Y%m%d_%H%M%S).sql
   ```
2. Apply versioned migrations:
   ```bash
   npx prisma migrate deploy
   ```
3. Never run `prisma db push` or `prisma db seed` against production databases.
