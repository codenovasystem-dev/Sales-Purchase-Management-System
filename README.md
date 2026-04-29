# SalesIQ Analytics Platform

A real-time business analytics dashboard for e-commerce companies with live sales tracking, inventory management, revenue forecasting, and role-based access control.

## Features

- **Real-time Sales Tracking**: Live updates of sales data with WebSocket connections
- **Inventory Management**: Track stock levels, reorder alerts, and inventory value
- **Revenue Forecasting**: Predictive analytics for future revenue
- **Role-based Access Control**: Different permission levels (Admin, Manager, Analyst, Viewer)
- **Interactive Charts**: Visual analytics with Chart.js
- **Responsive Dashboard**: Modern UI with real-time indicators

## Tech Stack

- **Frontend**: React.js, Chart.js, WebSockets
- **Backend**: Node.js, Express.js, WebSockets
- **Database**: MySQL
- **Authentication**: JWT with bcrypt
- **Deployment**: AWS EC2 ready

## Prerequisites

- Node.js (v14 or higher)
- MySQL Server
- npm or yarn

## Installation & Setup

### 1. Clone and Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Database Setup

#### Install MySQL
- Download and install MySQL from https://dev.mysql.com/downloads/mysql/
- Or use XAMPP/WAMP for Windows
- Or use Docker: `docker run --name mysql-siq -e MYSQL_ROOT_PASSWORD=yourpassword -p 3306:3306 -d mysql:8.0`

#### Create Database
```sql
mysql -u root -p
CREATE DATABASE salesiq;
exit;
```

#### Run Schema
```bash
mysql -u root -p salesiq < ../database/schema.sql
```

#### Update Database Configuration
Edit `server/db.js` and update the MySQL connection details:
```javascript
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "yourpassword", // Change this to your MySQL password
  database: "salesiq"
});
```

### 3. Environment Variables

Create a `.env` file in the server directory:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=salesiq
JWT_SECRET=your-secret-key-here
```

### 4. Start the Application

#### Terminal 1: Start the Server
```bash
cd server
npm start
```

#### Terminal 2: Start the Client
```bash
cd client
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@salesiq.com | password |
| Manager | manager@salesiq.com | password |
| Analyst | analyst@salesiq.com | password |
| Viewer | viewer@salesiq.com | password |

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