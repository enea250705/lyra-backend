# Deployment Guide - Lyra AI Backend

## Prerequisites

- Node.js 18 or higher
- PostgreSQL 12 or higher
- Git
- Domain name (for production)

## Environment Setup

### 1. Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
NODE_ENV=production
PORT=3000
API_VERSION=v1

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/lyra_ai
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lyra_ai
DB_USER=username
DB_PASSWORD=password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret-here-also-long-and-random
JWT_REFRESH_EXPIRES_IN=30d

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email Configuration (optional)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Nordigen (Banking API) (optional)
NORDIGEN_SECRET_ID=your-nordigen-secret-id
NORDIGEN_SECRET_KEY=your-nordigen-secret-key

# Encryption
ENCRYPTION_KEY=your-32-character-encryption-key-here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

## Local Development

### 1. Clone and Setup

```bash
git clone <repository-url>
cd lyra_ai/backend
npm install
```

### 2. Database Setup

```bash
# Install PostgreSQL and create database
createdb lyra_ai

# Copy environment file
cp .env.example .env

# Edit .env with your database credentials
nano .env
```

### 3. Run Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## Production Deployment

### Option 1: VPS Deployment (Ubuntu/CentOS)

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx for reverse proxy
sudo apt install nginx -y
```

#### 2. Database Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE lyra_ai;
CREATE USER lyra_user WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE lyra_ai TO lyra_user;
\q
```

#### 3. Application Deployment

```bash
# Clone repository
git clone <repository-url> /var/www/lyra_ai
cd /var/www/lyra_ai/backend

# Install dependencies
npm ci --production

# Build application
npm run build

# Set up environment
cp .env.example .env
nano .env  # Edit with production values

# Create logs directory
mkdir -p logs

# Start with PM2
pm2 start dist/app.js --name lyra-ai-backend
pm2 startup
pm2 save
```

#### 4. Nginx Configuration

```nginx
# /etc/nginx/sites-available/lyra-ai
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/lyra-ai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 5. SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

### Option 2: Docker Deployment

#### 1. Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3000

CMD ["npm", "start"]
```

#### 2. Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://lyra_user:password@db:5432/lyra_ai
    depends_on:
      - db
    volumes:
      - ./logs:/app/logs
      - ./uploads:/app/uploads
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=lyra_ai
      - POSTGRES_USER=lyra_user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
```

### Option 3: Cloud Deployment

#### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
```

#### Railway Deployment

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway deploy

# Set environment variables in Railway dashboard
```

#### Render Deployment

1. Connect GitHub repository to Render
2. Set build command: `npm run build`
3. Set start command: `npm start`
4. Add environment variables in dashboard

## Database Migrations

For production database updates:

```bash
# Backup database first
pg_dump lyra_ai > backup.sql

# Run migrations (if using Sequelize migrations)
npm run migrate

# Or sync database (development only)
npm run sync
```

## Monitoring and Maintenance

### 1. PM2 Monitoring

```bash
# View logs
pm2 logs lyra-ai-backend

# Monitor resources
pm2 monit

# Restart app
pm2 restart lyra-ai-backend
```

### 2. Database Backup

```bash
# Automated backup script
#!/bin/bash
BACKUP_DIR="/var/backups/lyra_ai"
mkdir -p $BACKUP_DIR
pg_dump lyra_ai > $BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql

# Add to crontab for daily backups
# 0 2 * * * /path/to/backup_script.sh
```

### 3. Log Rotation

```bash
# Install logrotate
sudo apt install logrotate

# Create logrotate config
sudo nano /etc/logrotate.d/lyra-ai

# Add content:
/var/www/lyra_ai/backend/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 nodejs nodejs
}
```

## Security Checklist

- [ ] Strong JWT secrets configured
- [ ] Database credentials secured
- [ ] SSL certificate installed
- [ ] Firewall configured (UFW)
- [ ] Regular security updates
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Sensitive data encrypted
- [ ] Regular backups scheduled
- [ ] Monitoring and alerting set up

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check DATABASE_URL format
   - Verify PostgreSQL is running
   - Check firewall rules

2. **JWT Token Issues**
   - Verify JWT_SECRET is set
   - Check token expiration
   - Validate token format

3. **Rate Limiting Issues**
   - Adjust rate limit settings
   - Check IP whitelisting
   - Monitor request patterns

4. **Memory Issues**
   - Monitor with `pm2 monit`
   - Increase server resources
   - Check for memory leaks

### Logs

```bash
# Application logs
tail -f logs/app.log

# PM2 logs
pm2 logs lyra-ai-backend

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# PostgreSQL logs
tail -f /var/log/postgresql/postgresql-*.log
```

## Performance Optimization

1. **Database Indexing**: Ensure proper indexes on frequently queried columns
2. **Connection Pooling**: Configure PostgreSQL connection pool
3. **Caching**: Implement Redis for session and data caching
4. **CDN**: Use CDN for static assets
5. **Compression**: Enable gzip compression in Nginx
6. **Database Optimization**: Regular VACUUM and ANALYZE operations

## Support

For deployment issues:
- Check the logs first
- Review environment variables
- Verify database connectivity
- Check system resources
- Monitor application metrics