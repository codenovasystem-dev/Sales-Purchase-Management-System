# SalesIQ Setup Guide

## Quick Reference

| Task | Time | Difficulty |
|------|------|------------|
| Install & Setup | 5 min | ⭐ Easy |
| Database Config | 3 min | ⭐ Easy |
| Run Locally | 2 min | ⭐ Easy |
| Deploy to Cloud | 10 min | ⭐⭐ Medium |

---

## ✅ Setup Checklist

- [ ] Node.js v14+ installed
- [ ] MySQL 8.0+ installed and running
- [ ] Repository cloned
- [ ] Dependencies installed
- [ ] Database created
- [ ] Environment variables configured
- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] Can login with demo account

---

## 🖥️ Local Development Setup

### Step 1: Install Dependencies

```bash
# Navigate to server directory
cd server
npm install

# Navigate to client directory (in separate terminal or after server installs)
cd ../client
npm install
```

### Step 2: Create Database

```bash
# Open MySQL command line
mysql -u root -p

# Create database and tables
mysql> CREATE DATABASE salesiq;
mysql> USE salesiq;
mysql> source ../database/schema.sql;
mysql> exit;
```

Or run the script directly:
```bash
mysql -u root -p < database/schema.sql
```

### Step 3: Configure Environment

**Create `server/.env`:**
```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=salesiq

# Server Configuration
PORT=5000
NODE_ENV=development

# Security
JWT_SECRET=your_super_secret_jwt_key_change_me_in_production
```

**Create `client/.env`:**
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_ENV=development
```

### Step 4: Start the Application

**Terminal 1 - Backend:**
```bash
cd server
npm start
# Should see: "Server running on port 5000"
```

**Terminal 2 - Frontend:**
```bash
cd client
npm start
# Should see: "Compiled successfully!"
# Browser opens to http://localhost:3000
```

### Step 5: Login with Demo Account

```
Email: admin@salesiq.com
Password: password
Role: Admin
```

---

## 🧪 Testing the Features

### Test Real-Time Updates
1. Login as Admin
2. Open dashboard
3. Check live sales counter
4. Simulate new order: `curl -X POST http://localhost:5000/api/sales`

### Test Role-Based Access
1. Logout and login as `analyst@salesiq.com`
2. Verify you can view data
3. Try to access admin panel (should be restricted)

### Test Inventory Management
1. Navigate to Inventory section
2. Check stock levels
3. View reorder alerts for low-stock items

---

## 🐛 Troubleshooting

### "Port 5000 already in use"
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (Windows)
taskkill /PID <PID> /F

# Or use different port
# Edit server/.env: PORT=5001
```

### "Database connection failed"
```bash
# Check MySQL is running
mysql -u root -p

# Verify credentials in server/.env
# Check database exists
mysql> SHOW DATABASES;
mysql> USE salesiq;
mysql> SHOW TABLES;
```

### `"User not found"` when logging in
```bash
# Confirm the users table has demo accounts
mysql -u root -p -D salesiq
mysql> SELECT email, role FROM users;
```

If the demo users are missing, make sure `database/schema.sql` was imported and then restart the backend. The server now retries demo-user seeding on startup, and logging in with a demo email will trigger another seed attempt automatically.

### "Cannot find module 'express'"
```bash
# Reinstall dependencies
cd server
rm -rf node_modules
npm install
```

### "CORS errors in browser console"
```bash
# Ensure REACT_APP_API_URL is correct
# In client/.env, should be: http://localhost:5000
# Restart frontend: npm start
```

---

## 📊 Demo Account Capabilities

| Role | Permissions | Use Case |
|------|-------------|----------|
| **Admin** | Full access, user management | System admin, owner |
| **Manager** | View all data, edit settings | Team lead, manager |
| **Analyst** | View data, create reports | Data analyst, researcher |
| **Viewer** | Read-only access | Executive, client |

### Create New Test Account

1. Go to login page
2. Click "Register"
3. Enter email and password
4. Select role
5. Click Register

---

## 🚀 Deployment Guide

### AWS EC2 Deployment

**Step 1: Launch EC2 Instance**
- AMI: Ubuntu 20.04 LTS
- Instance type: t3.medium (minimum)
- Security group: Allow ports 80, 443, 5000

**Step 2: Setup Server**
```bash
# SSH into instance
ssh -i your-key.pem ubuntu@your-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs

# Install MySQL
sudo apt install -y mysql-server

# Install Git
sudo apt install -y git
```

**Step 3: Clone and Setup**
```bash
git clone https://github.com/yourname/salesiq-saas.git
cd salesiq-saas

# Install dependencies
cd server && npm install
cd ../client && npm install

# Configure database
sudo mysql < database/schema.sql

# Setup environment
nano server/.env
# Add your configuration

# Build client
cd client && npm run build
```

**Step 4: Run with PM2**
```bash
# Install PM2 globally
sudo npm install -g pm2

# Start backend
pm2 start server/index.js --name "salesiq-api"

# Start frontend (static serve)
pm2 start "npx serve -s client/build" --name "salesiq-web"

# Save PM2 config
pm2 save

# Enable startup
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup ubuntu -u ubuntu --hp /home/ubuntu
```

**Step 5: Setup Nginx Reverse Proxy**
```bash
sudo apt install -y nginx

# Create config
sudo nano /etc/nginx/sites-available/salesiq

# Add:
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}

# Enable config
sudo ln -s /etc/nginx/sites-available/salesiq /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**Step 6: Setup SSL (Free with Let's Encrypt)**
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

### Heroku/Render Deployment

**Using render.yaml** (pre-configured):

1. Push to GitHub
2. Connect repository to Render
3. Set environment variables in Render dashboard
4. Deploy automatically

---

### Docker Deployment

**Create Dockerfile (if not exists):**
```dockerfile
FROM node:16-alpine

WORKDIR /app

# Install server dependencies
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install

# Install client dependencies
WORKDIR /app
COPY client/package*.json ./client/
WORKDIR /app/client
RUN npm install && npm run build

# Copy everything
WORKDIR /app
COPY . .

EXPOSE 5000 3000

CMD npm start
```

**Run Docker:**
```bash
docker build -t salesiq .
docker run -p 5000:5000 -p 3000:3000 \
  -e DB_HOST=mysql \
  -e DB_USER=root \
  -e DB_PASSWORD=root \
  -e DB_NAME=salesiq \
  salesiq
```

---

## 📊 Performance Checklist

- [ ] Frontend loads in < 2 seconds
- [ ] Dashboard updates in < 100ms
- [ ] API responses < 200ms
- [ ] Database queries < 500ms
- [ ] No console errors
- [ ] All charts render smoothly
- [ ] WebSocket connection active
- [ ] Responsive on mobile (test with dev tools)

---

## 🔒 Security Checklist

- [ ] Change JWT_SECRET in production
- [ ] Use HTTPS/SSL
- [ ] Set strong database passwords
- [ ] Enable firewall rules
- [ ] Regular backups enabled
- [ ] SQL injection prevention tested
- [ ] CORS configured correctly
- [ ] Session timeouts enabled

---

## 📈 Monitoring & Logs

**View PM2 logs:**
```bash
pm2 logs salesiq-api
pm2 logs salesiq-web
```

**Monitor performance:**
```bash
pm2 monit
```

**Check database:**
```bash
mysql -u root -p
> SHOW PROCESSLIST;
> SHOW STATUS;
```

---

## 🆘 Need Help?

1. Check [README.md](../README.md) for overview
2. Review error messages carefully
3. Check backend/server logs
4. Check frontend browser console
5. Verify all credentials and ports
6. Contact support: support@salesiq.com

---

**Last Updated**: May 2026 | **Version**: 1.0
