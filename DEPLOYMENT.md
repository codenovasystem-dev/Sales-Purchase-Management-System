# SalesIQ Deployment Guide

Complete guide to deploy SalesIQ to production environments.

---

## 🚀 Quick Deployment Options

Choose the deployment option that best fits your needs:

| Platform | Difficulty | Cost | Setup Time | Notes |
|----------|-----------|------|-----------|-------|
| **AWS EC2** | Medium | Low ($20-50/mo) | 15 min | Full control, scalable |
| **Heroku** | Easy | Medium ($50+/mo) | 5 min | Simple, good for startups |
| **Render** | Easy | Low-Medium | 5 min | Modern, auto-deploys |
| **DigitalOcean** | Easy | Low ($5-20/mo) | 10 min | Simple droplets |
| **Vercel** | Easy | Low (free-$100) | 5 min | React frontend only |
| **Docker** | Medium | Varies | 10 min | Containerized, flexible |

---

## 1️⃣ AWS EC2 Deployment (Recommended)

### Prerequisites
- AWS Account
- EC2 key pair created
- Domain name (optional but recommended)

### Step 1: Launch EC2 Instance

1. Go to [AWS EC2 Console](https://console.aws.amazon.com/ec2/)
2. Click "Launch Instance"
3. Select **Ubuntu 20.04 LTS** (Free Tier eligible)
4. Instance type: **t3.medium** (1 GB RAM minimum)
5. Storage: **20 GB** (gp2)
6. Security Group: Create new
   - Allow SSH (port 22) from your IP
   - Allow HTTP (port 80) from anywhere
   - Allow HTTPS (port 443) from anywhere

### Step 2: Connect to Instance

```bash
# Change key permissions
chmod 400 your-key.pem

# SSH into instance
ssh -i your-key.pem ubuntu@YOUR_INSTANCE_IP
```

### Step 3: Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 16
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs

# Install MySQL 8
sudo apt install -y mysql-server

# Install Git
sudo apt install -y git

# Install Nginx
sudo apt install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2
```

### Step 4: Setup Application

```bash
# Clone repository
git clone https://github.com/yourname/salesiq-saas.git
cd salesiq-saas

# Install dependencies
cd server && npm install
cd ../client && npm install

# Create database
sudo mysql < ../database/schema.sql

# Setup environment
nano server/.env
```

**server/.env content:**
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_secure_password
DB_NAME=salesiq
JWT_SECRET=your_very_long_random_secret_key_12345
NODE_ENV=production
```

### Step 5: Build Frontend

```bash
cd client
npm run build
```

### Step 6: Start Application with PM2

```bash
cd /home/ubuntu/salesiq-saas

# Start backend
pm2 start server/index.js --name "salesiq-api"

# Start frontend static server
pm2 start "npx serve -s client/build" --name "salesiq-web"

# Save PM2 config
pm2 save

# Setup auto-start
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup ubuntu -u ubuntu --hp /home/ubuntu
```

### Step 7: Setup Nginx Reverse Proxy

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/salesiq
```

**Add this content:**
```nginx
upstream api {
    server 127.0.0.1:5000;
}

upstream web {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Serve static frontend
    location / {
        proxy_pass http://web;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API proxy
    location /api/ {
        proxy_pass http://api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        proxy_pass http://api;
    }
}
```

**Enable config:**
```bash
sudo ln -s /etc/nginx/sites-available/salesiq /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 8: Setup SSL with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Monitoring

```bash
# View logs
pm2 logs

# Monitor processes
pm2 monit

# Check Nginx
sudo tail -f /var/log/nginx/error.log
```

---

## 2️⃣ Heroku Deployment (Easiest)

### Prerequisites
- Heroku account
- Heroku CLI installed
- GitHub repository

### Step 1: Install Heroku CLI

```bash
# Windows
choco install heroku-cli

# macOS
brew tap heroku/brew && brew install heroku

# Linux
curl https://cli-assets.heroku.com/install.sh | sh
```

### Step 2: Create Heroku App

```bash
# Login to Heroku
heroku login

# Create app
heroku create salesiq-yourname

# Add MySQL add-on
heroku addons:create cleardb:ignite
```

### Step 3: Setup Environment Variables

```bash
heroku config:set PORT=5000
heroku config:set JWT_SECRET=your_super_secret_key
heroku config:set NODE_ENV=production
```

### Step 4: Create Procfile

Create `Procfile` in root:
```
web: npm install && npm start
```

### Step 5: Deploy

```bash
# Add to git
git add .
git commit -m "Ready for Heroku deployment"

# Push to Heroku
git push heroku main
```

### View Logs

```bash
heroku logs --tail
```

---

## 3️⃣ Render Deployment (Modern & Easy)

### Step 1: Prepare render.yaml

File already exists at `render.yaml` - review and adjust if needed.

### Step 2: Connect Repository

1. Push code to GitHub
2. Go to [render.com](https://render.com)
3. Create new "Web Service"
4. Connect GitHub repository
5. Select branch: `main`
6. Build command: `npm install && npm run build`
7. Start command: `npm start`

### Step 3: Set Environment Variables

In Render dashboard:
```
DB_HOST=your_mysql_host
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=salesiq
JWT_SECRET=your_secret
NODE_ENV=production
```

### Step 4: Deploy

Click "Create Web Service" - Render will auto-deploy!

---

## 4️⃣ Docker Deployment

### Create Dockerfile

```dockerfile
FROM node:16-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies
RUN npm install
RUN cd server && npm install
RUN cd ../client && npm install

# Copy application
COPY . .

# Build React app
RUN cd client && npm run build

# Expose ports
EXPOSE 5000 3000

# Start application
CMD npm start
```

### Build and Run

```bash
# Build image
docker build -t salesiq:latest .

# Run container
docker run -d \
  -p 5000:5000 \
  -p 3000:3000 \
  -e DB_HOST=mysql \
  -e DB_USER=root \
  -e DB_PASSWORD=password \
  -e DB_NAME=salesiq \
  -e JWT_SECRET=secret \
  --name salesiq \
  salesiq:latest
```

### Using Docker Compose

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: salesiq
    ports:
      - "3306:3306"
    volumes:
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql

  app:
    build: .
    ports:
      - "5000:5000"
      - "3000:3000"
    environment:
      DB_HOST: db
      DB_USER: root
      DB_PASSWORD: root
      DB_NAME: salesiq
      JWT_SECRET: secret
    depends_on:
      - db
```

Run:
```bash
docker-compose up -d
```

---

## ✅ Post-Deployment Checklist

- [ ] Application loads without errors
- [ ] Can login with demo account
- [ ] Dashboard shows live data
- [ ] Charts render correctly
- [ ] WebSocket connection works
- [ ] All API endpoints respond
- [ ] Responsive design works on mobile
- [ ] SSL certificate installed (if using domain)
- [ ] Error logging configured
- [ ] Database backups scheduled
- [ ] Monitoring alerts setup
- [ ] Performance metrics tracked

---

## 🔒 Production Security

### Environment Variables
```bash
# NEVER commit these to git
.env
.env.local
.env.*.local
```

### Database Backups
```bash
# AWS EC2
mysqldump -u root -p salesiq > backup.sql

# Schedule with cron
0 2 * * * mysqldump -u root -p salesiq > /backups/salesiq-$(date +\%Y-\%m-\%d).sql
```

### SSL/HTTPS
- Use Let's Encrypt (free)
- Set up auto-renewal
- Update security headers

### Monitoring
```bash
# PM2 monitoring
pm2 web

# Access at http://localhost:9615
```

---

## 🆘 Troubleshooting

### Application won't start
```bash
# Check logs
pm2 logs

# Check ports
netstat -tulpn | grep 5000

# Restart
pm2 restart all
```

### Database connection error
```bash
# Check MySQL
sudo systemctl status mysql

# Test connection
mysql -u root -p -h localhost salesiq
```

### Out of memory
```bash
# Increase swap
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

## 📈 Scaling Tips

1. **Database**: Use RDS for managed MySQL
2. **Frontend**: Use CDN (CloudFront, Cloudflare)
3. **Backend**: Use load balancer (ALB)
4. **Caching**: Implement Redis
5. **Monitoring**: Use Datadog or New Relic

---

## 📞 Support

- Documentation: [README.md](../README.md)
- Setup Guide: [SETUP.md](../SETUP.md)
- Email: support@salesiq.com

---

**Last Updated**: May 2026 | **Version**: 1.0
