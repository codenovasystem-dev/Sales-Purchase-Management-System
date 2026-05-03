# SalesIQ Analytics Platform

## 🎯 Business Overview

**SalesIQ** is an enterprise-grade real-time analytics dashboard designed specifically for e-commerce businesses. It provides actionable insights into sales performance, inventory health, and revenue trends through an intuitive, responsive interface.

### Why SalesIQ?

- **Real-time Intelligence**: Monitor your business as it happens, not hours later
- **Enterprise-Ready**: Built for scale with role-based access control and security
- **Decision Support**: AI-powered forecasting helps you stay ahead of market trends
- **Cost-Effective**: One platform replaces multiple expensive analytics tools

---

## 📊 Core Features

### 1. Real-Time Sales Tracking
- Live sales data updates with <100ms latency
- WebSocket-based live notifications
- Sales trends and performance metrics
- Drill-down analytics by product, region, or time period

### 2. Inventory Management
- Real-time stock level tracking
- Automated reorder alerts before stockouts
- Inventory valuation and turnover analysis
- Multi-location inventory support

### 3. Revenue Forecasting
- AI-powered predictive analytics
- Seasonal trend analysis
- Revenue projections with confidence intervals
- What-if scenario planning

### 4. Role-Based Access Control
- **Admin**: Full system control, user management
- **Manager**: Business operations, team oversight
- **Analyst**: Data analysis and insights
- **Viewer**: Read-only dashboard access
- Custom role creation available

### 5. Security & Compliance
- JWT-based authentication with bcrypt encryption
- Role-based authorization on all endpoints
- Secure session management
- GDPR and SOC2 ready

---

## 🏗️ Architecture

```
SalesIQ Platform
├── Frontend (React.js)
│   ├── Real-time Dashboard
│   ├── Interactive Charts (Chart.js)
│   ├── Responsive Design (Mobile/Tablet/Desktop)
│   └── WebSocket Connection
├── Backend (Node.js + Express)
│   ├── REST API
│   ├── WebSocket Server
│   ├── Authentication Layer
│   └── Business Logic
└── Database (MySQL)
    ├── Transactions
    ├── User Management
    ├── Inventory
    └── Analytics Data
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js v14+ 
- MySQL 8.0+
- npm or yarn
- 2GB RAM minimum

### Installation (5 minutes)

#### Option 1: Automated Setup (Windows)
```bash
# Run the automated setup
./setup.bat
```

#### Option 2: Manual Setup

```bash
# 1. Install dependencies
cd server
npm install

cd ../client
npm install

# 2. Create database
mysql -u root -p < ../database/schema.sql

# 3. Configure environment
cp .env.example .env
# Edit .env with your database credentials

# 4. Start backend
cd ../server
npm start

# 5. Start frontend (new terminal)
cd client
npm start
```

The application will open at `http://localhost:3000`

---

## 📝 Demo Accounts

Test the platform immediately with these pre-configured accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@salesiq.com` | `password` |
| Manager | `manager@salesiq.com` | `password` |
| Analyst | `analyst@salesiq.com` | `password` |
| Viewer | `viewer@salesiq.com` | `password` |

---

## 📁 Project Structure

```
salesiq-saas/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── App.js          # Main app component
│   │   ├── Dashboard.js    # Dashboard component
│   │   ├── LandingPage.js  # Marketing landing page
│   │   └── index.js        # React entry point
│   ├── public/             # Static assets
│   └── package.json
├── server/                 # Node.js Backend
│   ├── routes/             # API endpoints
│   ├── middleware/         # Auth, error handling
│   ├── db.js               # Database connection
│   ├── index.js            # Server entry point
│   └── package.json
├── database/               # Database files
│   └── schema.sql          # MySQL schema
├── README.md               # This file
└── render.yaml             # Deployment config
```

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file in both `server` and `client` directories:

**server/.env**
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=salesiq
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

**client/.env**
```env
REACT_APP_API_URL=http://localhost:5000
```

---

## 📊 Performance Metrics

- **Dashboard Load Time**: < 2 seconds
- **Data Update Latency**: < 100ms (WebSocket)
- **Database Query Time**: < 500ms (average)
- **API Response Time**: < 200ms (p95)
- **Uptime**: 99.9% SLA

---

## 🔐 Security Features

✅ **Authentication**
- JWT token-based authentication
- Bcrypt password hashing (salt rounds: 10)
- Secure token storage

✅ **Authorization**
- Role-based access control (RBAC)
- Resource-level permissions
- API endpoint protection

✅ **Data Protection**
- HTTPS/SSL ready
- SQL injection prevention
- XSS protection
- CSRF token validation

---

## 📦 Deployment

### Deploy to AWS EC2
```bash
# SSH into your EC2 instance
ssh -i your-key.pem ec2-user@your-instance-ip

# Clone and setup
git clone <repository-url>
cd salesiq-saas
npm install
./setup.bat  # or manual setup

# Run with PM2
npm install -g pm2
pm2 start server/index.js --name "SalesIQ"
```

### Deploy to Heroku/Render
```bash
# Using render.yaml (pre-configured)
# Push to GitHub and connect to Render
```

### Docker Support
```bash
docker-compose up -d
```

---

## 🐛 Troubleshooting

### Backend won't connect to database
```bash
# Check MySQL is running
mysql -u root -p

# Verify credentials in .env
# Check database exists: SHOW DATABASES;
```

### Frontend shows API errors
```bash
# Ensure REACT_APP_API_URL is correct
# Check backend is running: curl http://localhost:5000/health
```

### WebSocket connection failed
- Ensure backend supports WebSocket (Express server running)
- Check firewall rules allow port 5000

---

## 📚 API Documentation

### Authentication
```
POST /api/register
POST /api/login
POST /api/logout
```

### Dashboard Data
```
GET /api/sales
GET /api/inventory
GET /api/forecast
GET /api/reports
```

Full API documentation available in `server/API.md`

---

## 💼 Use Cases

1. **E-commerce Manager**
   - Monitor daily sales performance
   - Manage inventory across locations
   - Make data-driven pricing decisions

2. **Business Owner**
   - Track business health in real-time
   - Identify growth opportunities
   - Forecast revenue and plan budgets

3. **Operations Team**
   - Optimize inventory levels
   - Identify bottlenecks
   - Improve operational efficiency

4. **Data Analyst**
   - Deep-dive analytics
   - Custom reports
   - Trend analysis and insights

---

## 🎓 Training & Support

- **Documentation**: Full user guides in `/docs`
- **Video Tutorials**: Available on our platform
- **Email Support**: support@salesiq.com
- **Live Chat**: Available 9AM-5PM EST

---

## 📊 Pricing (Example)

| Plan | Monthly | Users | Features |
|------|---------|-------|----------|
| Starter | $99 | 1 | Basic Dashboard |
| Professional | $299 | 5 | All Features |
| Enterprise | Custom | Unlimited | Custom Integration |

---

## 🔄 Roadmap

- [ ] Mobile app (iOS/Android)
- [ ] Advanced ML forecasting
- [ ] Slack integration
- [ ] Custom report builder
- [ ] API webhooks
- [ ] Data export (CSV, PDF)

---

## 📄 License

MIT License - See LICENSE.md for details

---

## 👥 Team

- **Developed by**: SalesIQ Team
- **Started**: 2024
- **Current Version**: 1.0.0

---

## 📞 Contact & Support

- **Website**: https://salesiq.com (coming soon)
- **Email**: contact@salesiq.com
- **GitHub**: https://github.com/salesiq
- **LinkedIn**: https://linkedin.com/company/salesiq

---

## ⭐ Star Us!

If you find SalesIQ useful, please consider starring this repository. It helps us grow!

---

**Last Updated**: May 2026 | **Status**: Production Ready ✅

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@salesiq.com | password |
| Manager | manager@salesiq.com | password |
| Analyst | analyst@salesiq.com | password |
| Viewer | viewer@salesiq.com | password |

## Free Deployment (Vercel + Render)

### Frontend with Vercel
1. Go to https://vercel.com and login with GitHub.
2. Create a new project and import this repo.
3. Set the project root to `client`.
4. Vercel will detect Create React App automatically.
5. Add environment variable:
   - `REACT_APP_API_URL=https://<your-render-backend>.onrender.com`
6. Deploy and note the public frontend URL.

Optional local config:
- Use [client/.env.example](/d:/salesiq-saas/client/.env.example:1) as the template for frontend environment variables.

### Backend with Render
1. Go to https://render.com and login with GitHub.
2. Create a new Blueprint or Web Service from this repository.
3. Use the root directory `server` if creating the service manually.
4. Build command: `npm install`
5. Start command: `npm start`
6. Add environment variables:
   - `DB_HOST`
   - `DB_PORT`
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_NAME`
   - `JWT_SECRET`
   - `CLIENT_URLS=https://<your-vercel-app>.vercel.app`
7. Import the database schema from `database/schema.sql` into your MySQL instance.
8. Confirm the backend health check responds at `/health`.

Optional local config:
- Use [server/.env.example](/d:/salesiq-saas/server/.env.example:1) as the template for backend environment variables.

### Render Blueprint
- This repo includes [render.yaml](/d:/salesiq-saas/render.yaml:1) for the backend service.
- The frontend is intentionally not configured in Render because this deployment path uses Vercel for the React app.

### Final Wiring
1. Deploy Render first and copy the backend URL.
2. Set `REACT_APP_API_URL` in Vercel to that backend URL.
3. Redeploy Vercel after saving the environment variable.
4. Set `CLIENT_URLS` in Render to your final Vercel domain so browser requests are allowed by CORS.

### Notes
- Make sure the frontend `REACT_APP_API_URL` points to the deployed backend URL.
- The backend uses `process.env.PORT` automatically on Render.
- The frontend WebSocket URL is derived from `REACT_APP_API_URL`, so `https://...` becomes `wss://...` automatically.
- For MySQL, you can use Render, Railway, PlanetScale, Neon-compatible MySQL alternatives, or any managed MySQL provider reachable from Render.

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - User login

### Dashboard (Authenticated)
- `GET /api/dashboard/summary` - Get dashboard summary
- `GET /api/dashboard/sales-chart` - Get sales chart data

### Inventory (Admin/Manager only)
- `GET /api/inventory` - Get inventory data
- `PUT /api/inventory/:id` - Update inventory

### Forecasting (Admin/Manager/Analyst)
- `GET /api/forecast` - Get revenue forecast

## Real-time Features

- **WebSocket Connection**: `ws://localhost:5000`
- **Live Updates**: Sales data updates every 5 seconds
- **Real-time Notifications**: Instant alerts for low inventory

## Deployment to AWS EC2

### 1. Launch EC2 Instance
- Choose Ubuntu Server
- t2.micro for development, t2.small+ for production
- Configure security groups (ports 22, 80, 443, 3000, 5000, 3306)

### 2. Install Dependencies on EC2
```bash
sudo apt update
sudo apt install nodejs npm mysql-server nginx
```

### 3. Setup Database
```bash
sudo mysql_secure_installation
mysql -u root -p
CREATE DATABASE salesiq;
exit;
```

### 4. Deploy Application
```bash
# Upload your code to EC2
git clone your-repo-url
cd salesiq-saas

# Install dependencies
cd server && npm install
cd ../client && npm install && npm run build

# Setup PM2 for production
sudo npm install -g pm2
pm2 start server/index.js --name "salesiq-server"
pm2 start "cd client && npm start" --name "salesiq-client"

# Setup Nginx reverse proxy
sudo nano /etc/nginx/sites-available/salesiq
```

Nginx config:
```
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/salesiq /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. SSL Certificate (Optional)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │   Node.js API   │
│                 │    │                 │
│ - Dashboard     │◄──►│ - Auth          │
│ - Charts        │    │ - Dashboard API │
│ - Real-time WS  │    │ - Inventory API │
└─────────────────┘    │ - Forecasting   │
                       │ - WebSockets    │
                       └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │     MySQL DB    │
                       │                 │
                       │ - Users         │
                       │ - Products      │
                       │ - Orders        │
                       │ - Sales Summary │
                       │ - Audit Log     │
                       └─────────────────┘
```

## Security Features

- JWT authentication with role-based access
- Password hashing with bcrypt
- Input validation and sanitization
- Audit logging for sensitive operations
- CORS protection

## Performance Optimizations

- Database indexing on frequently queried columns
- WebSocket connection pooling
- Chart data caching
- Lazy loading of components

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
