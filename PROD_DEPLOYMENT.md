# Production Deployment Guide

Complete guide for deploying Sadoksan ERP to production on Fedora server.

## Table of Contents

1. [Server Setup](#server-setup)
2. [Docker Installation](#docker-installation)
3. [Project Deployment](#project-deployment)
4. [SSL/HTTPS Setup](#sslhttps-setup)
5. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Server Setup

### System Requirements

- **OS**: Fedora 41 (or compatible)
- **CPU**: 4 cores minimum
- **RAM**: 8GB minimum (16GB recommended)
- **Storage**: 100GB SSD minimum
- **Network**: Static IP, ports 80/443 accessible

### Initial Setup

```bash
# Update system
sudo dnf update -y

# Install essential tools
sudo dnf install -y git curl wget vim htop

# Set timezone
sudo timedatectl set-timezone Europe/Istanbul

# Configure firewall
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-port=22/tcp
sudo firewall-cmd --reload

# Create app user
sudo useradd -m -s /bin/bash sadoksan
sudo usermod -aG wheel sadoksan
```

---

## Docker Installation

### Install Docker & Docker Compose

```bash
# Install Docker
sudo dnf install -y dnf-plugins-core
sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start Docker daemon
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker sadoksan
newgrp docker

# Verify installation
docker --version
docker compose version
```

---

## Project Deployment

### 1. Clone Repository

```bash
cd /home/sadoksan
git clone <repository-url> sadoksaninsaat
cd sadoksaninsaat
```

### 2. Create Environment File

```bash
cp .env.example .env

# Edit with production values
nano .env
```

**Required environment variables:**

```bash
# Database
DB_NAME=sadoksan_prod
DB_USER=sadoksan
DB_PASSWORD=<strong-password-here>

# JWT & Security
JWT_SECRET=<generate-with-openssl>

# API Configuration
PUBLIC_API_BASE=https://api.sadoksan.com

# Logging
LOG_LEVEL=info
```

**Generate JWT secret:**

```bash
openssl rand -base64 32
```

### 3. Build Images

```bash
# Build all images (takes 10-15 minutes)
docker compose -f docker-compose.prod.yml build

# Verify images were built
docker images | grep sadoksan
```

### 4. Start Services

```bash
# Start all services in background
docker compose -f docker-compose.prod.yml up -d

# Watch startup progress
docker compose -f docker-compose.prod.yml logs -f

# Check all services are healthy
docker compose -f docker-compose.prod.yml ps
```

**Expected output:**

```
NAME                 STATUS              PORTS
sadoksan-postgres    Up (healthy)        5432/tcp
sadoksan-redis       Up (healthy)        6379/tcp
sadoksan-api         Up (healthy)        3001/tcp
sadoksan-storefront  Up (healthy)        3000/tcp
sadoksan-admin       Up (healthy)        3002/tcp
sadoksan-python      Up (healthy)        5000/tcp
sadoksan-nginx       Up (healthy)        80/tcp, 443/tcp
```

### 5. Run Database Migrations

```bash
# Connect to API container
docker compose -f docker-compose.prod.yml exec api sh

# Run Prisma migrations
npx prisma migrate deploy

# Seed data (optional)
npm run db:seed

# Exit container
exit
```

---

## SSL/HTTPS Setup

### Option A: Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo dnf install -y certbot python3-certbot-nginx

# Generate certificate (replace domain)
sudo certbot certonly --standalone \
  -d sadoksan.com \
  -d www.sadoksan.com \
  -d api.sadoksan.com \
  --email admin@sadoksan.com \
  --agree-tos \
  --non-interactive

# Copy certificates to project
mkdir -p ssl
sudo cp /etc/letsencrypt/live/sadoksan.com/fullchain.pem ssl/sadoksan.crt
sudo cp /etc/letsencrypt/live/sadoksan.com/privkey.pem ssl/sadoksan.key
sudo chown sadoksan:sadoksan ssl/*
```

### Option B: Self-Signed (Development Only)

```bash
mkdir -p ssl

# Generate self-signed certificate (valid for 365 days)
openssl req -x509 -newkey rsa:4096 -keyout ssl/sadoksan.key -out ssl/sadoksan.crt -days 365 -nodes \
  -subj "/C=TR/ST=Istanbul/L=Istanbul/O=Sadoksan/CN=sadoksan.com"
```

### Auto-Renewal (Let's Encrypt)

```bash
# Create renewal script
cat > /home/sadoksan/renew-certs.sh << 'EOF'
#!/bin/bash
certbot renew --quiet
cp /etc/letsencrypt/live/sadoksan.com/fullchain.pem /home/sadoksan/sadoksaninsaat/ssl/sadoksan.crt
cp /etc/letsencrypt/live/sadoksan.com/privkey.pem /home/sadoksan/sadoksaninsaat/ssl/sadoksan.key
chown sadoksan:sadoksan /home/sadoksan/sadoksaninsaat/ssl/*
cd /home/sadoksan/sadoksaninsaat && docker compose -f docker-compose.prod.yml restart nginx
EOF

chmod +x /home/sadoksan/renew-certs.sh

# Add to crontab (runs daily at 2 AM)
crontab -e
# Add: 0 2 * * * /home/sadoksan/renew-certs.sh >> /var/log/sadoksan-cert-renewal.log 2>&1
```

### Reload Nginx with New Certificates

```bash
docker compose -f docker-compose.prod.yml restart nginx
```

---

## Monitoring & Maintenance

### Health Checks

```bash
# Check all services
docker compose -f docker-compose.prod.yml ps

# View logs for specific service
docker compose -f docker-compose.prod.yml logs -f api

# View all logs
docker compose -f docker-compose.prod.yml logs -f

# Follow logs with filtering
docker compose -f docker-compose.prod.yml logs -f api | grep error
```

### Common Tasks

#### Start/Stop Services

```bash
# Start
docker compose -f docker-compose.prod.yml up -d

# Stop
docker compose -f docker-compose.prod.yml down

# Restart specific service
docker compose -f docker-compose.prod.yml restart api

# Full restart (preserves data)
docker compose -f docker-compose.prod.yml restart
```

#### Database Backup

```bash
# Backup PostgreSQL
docker compose -f docker-compose.prod.yml exec postgres pg_dump \
  -U sadoksan sadoksan_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup with gzip compression
docker compose -f docker-compose.prod.yml exec postgres pg_dump \
  -U sadoksan sadoksan_prod | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Backup Redis
docker compose -f docker-compose.prod.yml exec redis redis-cli BGSAVE
docker cp sadoksan-redis:/data/dump.rdb ./redis_backup_$(date +%Y%m%d_%H%M%S).rdb
```

#### Database Restore

```bash
# Restore PostgreSQL
docker compose -f docker-compose.prod.yml exec -T postgres psql \
  -U sadoksan sadoksan_prod < backup_20260512_120000.sql

# Restore Redis
docker cp redis_backup_20260512_120000.rdb sadoksan-redis:/data/dump.rdb
docker compose -f docker-compose.prod.yml restart redis
```

### Updates & Deployments

```bash
# Pull latest code
cd /home/sadoksan/sadoksaninsaat
git pull origin main

# Rebuild images
docker compose -f docker-compose.prod.yml build

# Restart services (zero-downtime if possible)
docker compose -f docker-compose.prod.yml up -d

# Verify deployment
docker compose -f docker-compose.prod.yml ps
curl https://sadoksan.com/api/health
```

### Disk Space Management

```bash
# Check disk usage
df -h

# Prune old Docker images/containers
docker system prune -a --volumes

# View volume usage
docker system df
```

### Resource Monitoring

```bash
# Real-time resource usage
docker stats

# Container resource limits (set in docker-compose.prod.yml)
# Example:
# services:
#   api:
#     deploy:
#       resources:
#         limits:
#           cpus: '1'
#           memory: 1G
#         reservations:
#           cpus: '0.5'
#           memory: 512M
```

### Log Rotation

Logs are automatically rotated (see `docker-compose.prod.yml`):

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "20m"
    max-file: "5"
```

### Security Updates

```bash
# Update base images periodically
docker pull postgres:15-alpine
docker pull redis:7-alpine
docker pull nginx:1.25-alpine

# Rebuild with updated base images
docker compose -f docker-compose.prod.yml build --no-cache

# Restart services
docker compose -f docker-compose.prod.yml up -d
```

---

## Troubleshooting

### Services Won't Start

```bash
# Check Docker daemon
sudo systemctl status docker

# View container logs
docker compose -f docker-compose.prod.yml logs api

# Restart Docker
sudo systemctl restart docker

# Recreate containers
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
```

### Database Connection Issues

```bash
# Test PostgreSQL connectivity
docker compose -f docker-compose.prod.yml exec api \
  psql -h postgres -U sadoksan -d sadoksan_prod -c "SELECT 1"

# Check environment variables
docker compose -f docker-compose.prod.yml exec api env | grep DB
```

### Out of Disk Space

```bash
# Find large Docker objects
docker system df

# Clean up old images
docker image prune -a

# Clean up old volumes (⚠️ be careful)
docker volume prune
```

### Certificate Issues

```bash
# Verify SSL certificate
openssl x509 -in ssl/sadoksan.crt -text -noout

# Check certificate expiration
openssl x509 -in ssl/sadoksan.crt -noout -dates

# Test HTTPS connectivity
curl -vv https://sadoksan.com
```

---

## Useful Commands Reference

```bash
# View running containers
docker compose -f docker-compose.prod.yml ps

# Shell access to service
docker compose -f docker-compose.prod.yml exec api sh
docker compose -f docker-compose.prod.yml exec postgres psql -U sadoksan

# View real-time logs
docker compose -f docker-compose.prod.yml logs -f --tail=50

# Restart single service
docker compose -f docker-compose.prod.yml restart api

# Remove everything (⚠️ data loss)
docker compose -f docker-compose.prod.yml down -v

# Update .env and reload
# (Edit .env file, then)
docker compose -f docker-compose.prod.yml up -d
```

---

## Monitoring Dashboard

Access the admin panel for monitoring:

```
https://sadoksan.com/admin
```

Monitor:
- API health status
- Database performance
- Recent errors
- Active users

---

## Support & Escalation

For production issues:

1. Check logs: `docker compose -f docker-compose.prod.yml logs -f`
2. Verify health endpoints
3. Check disk space and resources
4. Restart affected service
5. If unresolved, escalate to development team

---

**Last Updated**: 2026-05-12  
**Version**: 1.0.0
