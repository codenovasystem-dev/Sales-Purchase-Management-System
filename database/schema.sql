CREATE DATABASE salesiq;
USE salesiq;

-- Users table with roles
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'manager', 'analyst', 'viewer') DEFAULT 'viewer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products/Inventory table
CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  price DECIMAL(10,2) NOT NULL,
  stock_quantity INT DEFAULT 0,
  reorder_level INT DEFAULT 10,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Orders/Sales transactions
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_email VARCHAR(255),
  total_amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order items (junction table for orders and products)
CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT,
  product_id INT,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Sales summary (aggregated data for dashboard)
CREATE TABLE sales_summary (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  total_orders INT DEFAULT 0,
  total_customers INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_date (date)
);

-- Revenue forecasting data
CREATE TABLE revenue_forecast (
  id INT AUTO_INCREMENT PRIMARY KEY,
  forecast_date DATE NOT NULL,
  predicted_revenue DECIMAL(10,2) NOT NULL,
  confidence_level DECIMAL(3,2), -- 0.00 to 1.00
  model_version VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit log for role-based access tracking
CREATE TABLE audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(255) NOT NULL,
  resource VARCHAR(255),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Insert sample data
INSERT INTO users (email, password, role) VALUES
('admin@salesiq.com', '$2b$10$XEU8iyO4h4Jyj7QjOUAA6OsPGMOOUAPYlkWWsXLHsKd1JMYjCzNjO', 'admin'),
('manager@salesiq.com', '$2b$10$XEU8iyO4h4Jyj7QjOUAA6OsPGMOOUAPYlkWWsXLHsKd1JMYjCzNjO', 'manager'),
('analyst@salesiq.com', '$2b$10$XEU8iyO4h4Jyj7QjOUAA6OsPGMOOUAPYlkWWsXLHsKd1JMYjCzNjO', 'analyst');

INSERT INTO products (name, category, price, stock_quantity, reorder_level) VALUES
('Wireless Headphones', 'Electronics', 99.99, 150, 20),
('Smart Watch', 'Electronics', 299.99, 75, 10),
('Laptop Stand', 'Accessories', 49.99, 200, 25),
('USB Cable', 'Accessories', 9.99, 500, 50),
('Mouse Pad', 'Accessories', 14.99, 300, 30);

INSERT INTO orders (customer_email, total_amount, status) VALUES
('customer1@example.com', 149.98, 'delivered'),
('customer2@example.com', 299.99, 'shipped'),
('customer3@example.com', 59.98, 'processing');

INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
(1, 1, 1, 99.99),
(1, 3, 1, 49.99),
(2, 2, 1, 299.99),
(3, 4, 2, 9.99),
(3, 5, 1, 14.99);

-- Insert sample forecast data
INSERT INTO revenue_forecast (forecast_date, predicted_revenue, confidence_level, model_version) VALUES
(CURDATE() + INTERVAL 1 DAY, 18500.00, 0.85, 'v1.0'),
(CURDATE() + INTERVAL 2 DAY, 19200.00, 0.82, 'v1.0'),
(CURDATE() + INTERVAL 3 DAY, 17800.00, 0.88, 'v1.0'),
(CURDATE() + INTERVAL 4 DAY, 20100.00, 0.79, 'v1.0'),
(CURDATE() + INTERVAL 5 DAY, 21500.00, 0.76, 'v1.0'),
(CURDATE() + INTERVAL 6 DAY, 18900.00, 0.84, 'v1.0'),
(CURDATE() + INTERVAL 7 DAY, 22300.00, 0.73, 'v1.0');