# Project Structure & Architecture

Complete guide to SalesIQ's codebase organization.

---

## 📁 Directory Tree

```
salesiq-saas/
│
├── 📄 README.md                    # Main project overview
├── 📄 SETUP.md                     # Setup & local development
├── 📄 DEPLOYMENT.md                # Production deployment guide
├── 📄 FEATURES.md                  # Detailed feature guide
├── 📄 GETTING_STARTED.md           # Quick start for new users
├── 📄 EXECUTIVE_SUMMARY.md         # Business overview & pitch
├── 📄 package.json                 # Root dependencies
├── 📄 render.yaml                  # Render.com deployment config
└── 📄 setup.bat                    # Windows quick setup script
│
├── 📁 client/                      # React Frontend App
│   ├── 📁 public/                  # Static files served
│   │   ├── index.html              # HTML entry point
│   │   ├── manifest.json           # PWA manifest
│   │   └── robots.txt              # SEO robots file
│   │
│   ├── 📁 src/                     # React source code
│   │   ├── App.js                  # Main app component
│   │   ├── App.css                 # App-level styles
│   │   ├── App.test.js             # App tests
│   │   ├── Dashboard.js            # Dashboard component
│   │   ├── LandingPage.js          # Landing page (new)
│   │   ├── LandingPage.css         # Landing page styles
│   │   ├── index.js                # React entry point
│   │   ├── index.css               # Global styles
│   │   └── setupTests.js           # Test configuration
│   │
│   ├── 📄 package.json             # Client dependencies
│   └── 📄 README.md                # Client-specific README
│
├── 📁 server/                      # Node.js Backend
│   ├── index.js                    # Server entry point
│   ├── db.js                       # Database connection
│   ├── package.json                # Server dependencies
│   │
│   ├── 📁 routes/                  # API endpoints (if expanded)
│   │   └── api.js                  # Main API routes
│   │
│   └── 📁 middleware/              # Express middleware (if expanded)
│       ├── auth.js                 # Authentication
│       └── errorHandler.js         # Error handling
│
└── 📁 database/                    # Database files
    ├── schema.sql                  # MySQL schema
    └── sample-data.sql             # Sample data (if needed)
```

---

## 🔧 Technology Stack

### Frontend
```
React.js v19.2.5
├── Component-based UI
├── Virtual DOM (fast rendering)
├── Hooks for state management
└── Easy testing with Jest

Styling:
├── CSS3 with CSS Variables
├── Responsive design (mobile-first)
├── CSS Grid & Flexbox
└── Utility classes

Charts:
├── Chart.js (charting library)
├── React-ChartJS-2 (React wrapper)
└── Real-time chart updates

HTTP Client:
└── Axios (API requests)
```

### Backend
```
Node.js v16+ (Runtime)
├── Single-threaded event loop
├── Excellent for I/O operations
└── Large npm ecosystem

Express.js (Web Framework)
├── Route handling
├── Middleware support
├── WebSocket integration
└── Error handling

WebSocket (Real-time)
├── Live data updates
├── Bi-directional communication
├── <100ms latency
└── Automatic reconnection

Security:
├── JWT (authentication)
├── Bcrypt (password hashing)
├── CORS (cross-origin)
└── SQL injection prevention
```

### Database
```
MySQL 8.0
├── ACID compliance
├── Transaction support
├── Full-text search
├── Spatial queries

Tables:
├── users (user accounts)
├── roles (permissions)
├── sales (transaction data)
├── inventory (stock levels)
├── forecast (predictions)
└── audit_logs (user actions)
```

---

## 🏗️ Architecture Patterns

### Frontend Architecture
```
App.js (Main Component)
├── LandingPage.js (Marketing page)
├── AuthForm.js (Login/Register)
└── Dashboard.js (Main app)
    ├── SalesChart.js
    ├── InventoryWidget.js
    ├── ForecastChart.js
    └── UserPanel.js

State Management:
├── useState (local component state)
├── Props drilling (simple communication)
└── LocalStorage (persistence)
```

### Backend Architecture
```
server/index.js
├── Express app setup
├── Database connection
├── WebSocket server
├── API Routes
│   ├── /api/register (Auth)
│   ├── /api/login (Auth)
│   ├── /api/sales (Data)
│   ├── /api/inventory (Data)
│   ├── /api/forecast (Data)
│   └── /api/users (Admin)
├── WebSocket handlers
│   ├── on('connection')
│   ├── on('disconnect')
│   └── emit('data')
└── Error handling middleware
```

### Data Flow
```
User Action (Browser)
    ↓
React Component (Client)
    ↓
API Call / WebSocket (HTTP/WS)
    ↓
Express Router (Backend)
    ↓
Middleware (Auth, Validation)
    ↓
Database Query (MySQL)
    ↓
Response (JSON)
    ↓
React Update (State)
    ↓
Browser Render (UI Update)
```

---

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'manager', 'analyst', 'viewer'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Sales Table
```sql
CREATE TABLE sales (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id VARCHAR(50) UNIQUE NOT NULL,
  user_id INT NOT NULL,
  product_name VARCHAR(200),
  quantity INT,
  price DECIMAL(10, 2),
  total DECIMAL(10, 2),
  status ENUM('pending', 'completed', 'shipped'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Inventory Table
```sql
CREATE TABLE inventory (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id VARCHAR(50) UNIQUE NOT NULL,
  product_name VARCHAR(200),
  stock_level INT,
  reorder_point INT,
  reorder_quantity INT,
  unit_price DECIMAL(10, 2),
  location VARCHAR(100),
  last_updated TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔌 API Endpoints

### Authentication
```
POST /api/register
  Body: { email, password, role }
  Response: { token, user }

POST /api/login
  Body: { email, password }
  Response: { token, user }

POST /api/logout
  Headers: { Authorization: token }
  Response: { success }
```

### Sales Data
```
GET /api/sales
  Query: { page, limit, date }
  Response: { sales[], total, page }

GET /api/sales/daily
  Query: { date }
  Response: { date, total, count, details }

POST /api/sales
  Body: { order_id, product, quantity, price }
  Response: { sale }
```

### Inventory
```
GET /api/inventory
  Query: { page, limit }
  Response: { inventory[], total }

GET /api/inventory/alerts
  Response: { alerts[] }

PUT /api/inventory/:id
  Body: { stock_level, reorder_point }
  Response: { inventory }
```

### Analytics
```
GET /api/forecast
  Query: { days: 30 }
  Response: { forecast[] }

GET /api/analytics/trends
  Query: { period: 'daily'|'weekly'|'monthly' }
  Response: { trend_data[] }

GET /api/reports/export
  Query: { format: 'csv'|'pdf'|'json' }
  Response: { file_url }
```

### Admin
```
GET /api/users
  Response: { users[] }

POST /api/users
  Body: { email, role }
  Response: { user }

DELETE /api/users/:id
  Response: { success }
```

---

## 🚀 Deployment Architecture

### Development Environment
```
localhost:3000 (React Dev Server)
localhost:5000 (Express Backend)
localhost:3306 (MySQL)

Ports:
├─ 3000: Frontend development
├─ 5000: Backend API
└─ 3306: Database
```

### Production Environment (AWS EC2)
```
Nginx (Reverse Proxy)
├─ Port 80 → Frontend (static)
└─ Port 80 → API (localhost:5000)

Node.js (PM2 Process Manager)
├─ salesiq-api (backend)
└─ salesiq-web (frontend static)

MySQL
└─ Port 3306 (internal only)
```

---

## 📦 Dependencies

### Frontend Key Packages
```json
"react": "^19.2.5",           // UI library
"react-dom": "^19.2.5",        // React DOM
"chart.js": "^4.5.1",          // Charts
"react-chartjs-2": "^5.3.1",  // React Chart wrapper
"axios": "^1.15.2"             // HTTP client
```

### Backend Key Packages
```json
"express": "^4.x",             // Web framework
"mysql2": "^3.x",              // MySQL driver
"jsonwebtoken": "^9.x",        // JWT authentication
"bcryptjs": "^2.x",            // Password hashing
"cors": "^2.x",                // CORS middleware
"dotenv": "^16.x"              // Environment variables
```

---

## 🔄 Development Workflow

### Making Changes to Frontend
```bash
1. Edit src/App.js or other component
2. Save file
3. React automatically reloads (hot reload)
4. See changes in browser
5. Test in dev tools (F12)
6. Commit changes to git
```

### Making Changes to Backend
```bash
1. Edit server/index.js or routes
2. Manually stop server (Ctrl+C)
3. Restart: npm start
4. Backend reloads
5. Test with Postman or curl
6. Commit changes to git
```

### Database Changes
```bash
1. Create migration file
2. Run: mysql < migration.sql
3. Update schema documentation
4. Update ORM/queries if needed
5. Test with sample data
6. Commit changes to git
```

---

## 📈 Scaling Considerations

### Database Optimization
```
Current: Single MySQL instance
Scale 1: Add database replication
Scale 2: Use read replicas
Scale 3: Migrate to cloud RDS
Scale 4: Add caching layer (Redis)
```

### Backend Optimization
```
Current: Single Node.js instance
Scale 1: Load balancer (ALB)
Scale 2: Multiple backend instances
Scale 3: API gateway (AWS API Gateway)
Scale 4: Microservices architecture
```

### Frontend Optimization
```
Current: React dev server
Scale 1: Build and serve static
Scale 2: CDN distribution (CloudFront)
Scale 3: Next.js (server-side rendering)
Scale 4: Multi-region deployment
```

---

## 🔐 Security Layers

### Transport Layer
```
HTTP → HTTPS (SSL/TLS)
Encryption in transit
Certificate management
```

### Application Layer
```
Authentication: JWT tokens
Authorization: Role-based access
Input validation: SQL injection prevention
Output encoding: XSS prevention
```

### Database Layer
```
Encrypted passwords: Bcrypt hashing
Secure queries: Parameterized statements
Access control: User-level permissions
Audit logging: All changes tracked
```

---

## 📚 Code Quality

### Testing
```
Frontend:
├─ Unit tests: Jest
├─ Component tests: React Testing Library
└─ E2E tests: Cypress (future)

Backend:
├─ Unit tests: Mocha/Chai
├─ API tests: Supertest
└─ Load tests: Apache JMeter
```

### Code Style
```
Frontend:
├─ Prettier (formatting)
├─ ESLint (linting)
└─ React best practices

Backend:
├─ Prettier (formatting)
├─ ESLint (linting)
└─ Node.js best practices
```

### Documentation
```
├─ Code comments
├─ README files
├─ API documentation
├─ Setup guides
└─ Deployment guides
```

---

## 🎯 Next Steps for Developers

### First Time Setup
1. Read this document
2. Run SETUP.md instructions
3. Explore codebase structure
4. Try making small changes
5. Deploy locally to test

### Feature Development
1. Create feature branch
2. Implement feature
3. Write tests
4. Document changes
5. Create pull request

### Performance Optimization
1. Profile application
2. Identify bottlenecks
3. Implement improvements
4. Measure results
5. Document findings

---

**Last Updated**: May 2026 | **Version**: 1.0
