# Self-Hosting Guide

This guide covers deploying BastionAuth to your own infrastructure.

## Deployment Options

BastionAuth can be deployed in several ways:

1. **Docker Compose** - Simplest setup for single-server deployments
2. **Kubernetes** - For scalable, production deployments
3. **Cloud Platforms** - Railway, Render, Fly.io, etc.

## Prerequisites

- A server with Docker installed
- Domain name (recommended)
- SSL certificate (required for production)
- PostgreSQL 15+ database
- Redis 7+ instance

## Docker Compose Deployment

### 1. Prepare Environment

```bash
# Clone repository
git clone https://github.com/bastionauth/bastionauth.git
cd bastionauth

# Create production env file
cp env.example .env.production
```

### 2. Configure Environment

Edit `.env.production`:

```env
# Application
NODE_ENV=production
API_URL=https://api.yourdomain.com
APP_URL=https://app.yourdomain.com

# Database
DATABASE_URL=postgresql://user:password@db:5432/bastionauth

# Redis
REDIS_URL=redis://redis:6379

# Security
JWT_PRIVATE_KEY_PATH=/app/keys/private.pem
JWT_PUBLIC_KEY_PATH=/app/keys/public.pem
ENCRYPTION_KEY=your-production-encryption-key

# Email
RESEND_API_KEY=re_production_key
FROM_EMAIL=noreply@yourdomain.com

# OAuth (configure each provider)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

### 3. Generate Production Keys

```bash
# Generate RSA keys
openssl genrsa -out keys/private.pem 4096
openssl rsa -in keys/private.pem -pubout -out keys/public.pem

# Set permissions
chmod 600 keys/private.pem
chmod 644 keys/public.pem
```

### 4. Deploy with Docker Compose

```bash
# Build and start
docker-compose -f docker/docker-compose.prod.yml up -d

# Run migrations
docker-compose -f docker/docker-compose.prod.yml exec api pnpm db:migrate:prod

# Check logs
docker-compose -f docker/docker-compose.prod.yml logs -f
```

## Kubernetes Deployment

### Helm Chart (Coming Soon)

```bash
helm repo add bastionauth https://charts.bastionauth.dev
helm install bastionauth bastionauth/bastionauth -f values.yaml
```

### Sample values.yaml

```yaml
api:
  replicas: 3
  resources:
    requests:
      memory: "256Mi"
      cpu: "200m"
    limits:
      memory: "512Mi"
      cpu: "500m"

database:
  external: true
  url: postgresql://user:pass@db.example.com:5432/bastionauth

redis:
  external: true
  url: redis://redis.example.com:6379

ingress:
  enabled: true
  hosts:
    - api.yourdomain.com
  tls:
    - secretName: bastionauth-tls
      hosts:
        - api.yourdomain.com
```

## Security Considerations

### HTTPS

Always use HTTPS in production. Options:

1. **Nginx/Caddy Reverse Proxy** - Handle SSL termination
2. **Cloud Load Balancer** - AWS ALB, GCP Load Balancer, etc.
3. **Built-in** - Pass certs to the server directly

### Environment Variables

Never commit secrets to git. Use:

- Docker secrets
- Kubernetes secrets
- Environment variable management (Doppler, HashiCorp Vault)

### Database Security

- Use strong passwords
- Enable SSL for database connections
- Restrict network access
- Regular backups

### JWT Keys

- Keep private keys secure
- Rotate keys periodically
- Never expose private keys

## Scaling

### Horizontal Scaling

BastionAuth is stateless and can be scaled horizontally:

```yaml
# docker-compose.prod.yml
services:
  api:
    deploy:
      replicas: 3
```

### Database Connection Pooling

For high traffic, use connection pooling:

```env
DATABASE_URL=postgresql://user:pass@pgbouncer:6432/bastionauth
```

### Redis Clustering

For high availability:

```env
REDIS_URL=redis://redis-cluster:6379
REDIS_CLUSTER=true
```

## Monitoring

### Health Checks

```bash
curl https://api.yourdomain.com/health
```

### Metrics

Enable Prometheus metrics:

```env
METRICS_ENABLED=true
METRICS_PORT=9090
```

### Logging

Configure structured logging:

```env
LOG_LEVEL=info
LOG_FORMAT=json
```

## Backup Strategy

### Database

```bash
# Automated daily backups
pg_dump $DATABASE_URL | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Encryption Keys

- Store key backups securely (not in regular backup)
- Document key rotation procedures

## Updates

### Rolling Updates

```bash
# Pull latest
git pull origin main

# Build new image
docker-compose -f docker/docker-compose.prod.yml build

# Rolling restart
docker-compose -f docker/docker-compose.prod.yml up -d --no-deps api

# Run migrations if needed
docker-compose -f docker/docker-compose.prod.yml exec api pnpm db:migrate:prod
```

## Troubleshooting

### Common Issues

**Connection Refused**
- Check firewall rules
- Verify service is running
- Check environment variables

**Database Errors**
- Run pending migrations
- Check connection string
- Verify database exists

**Redis Errors**
- Check Redis connection
- Verify Redis is running
- Check memory limits

### Debug Mode

Enable debug logging temporarily:

```env
LOG_LEVEL=debug
DEBUG=bastionauth:*
```

