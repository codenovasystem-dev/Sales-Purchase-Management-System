CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'manager', 'analyst', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  price NUMERIC(10, 2) NOT NULL,
  stock_quantity INT DEFAULT 0,
  reorder_level INT DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  customer_email VARCHAR(255),
  total_amount NUMERIC(10, 2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  order_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INT REFERENCES orders(id) ON DELETE CASCADE,
  product_id INT REFERENCES products(id),
  quantity INT NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS sales_summary (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  total_revenue NUMERIC(10, 2) DEFAULT 0,
  total_orders INT DEFAULT 0,
  total_customers INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS revenue_forecast (
  id SERIAL PRIMARY KEY,
  forecast_date DATE NOT NULL,
  predicted_revenue NUMERIC(10, 2) NOT NULL,
  confidence_level NUMERIC(3, 2),
  model_version VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  action VARCHAR(255) NOT NULL,
  resource VARCHAR(255),
  timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45)
);

INSERT INTO users (email, password, role) VALUES
('admin@salesiq.com', '$2b$10$XEU8iyO4h4Jyj7QjOUAA6OsPGMOOUAPYlkWWsXLHsKd1JMYjCzNjO', 'admin'),
('manager@salesiq.com', '$2b$10$XEU8iyO4h4Jyj7QjOUAA6OsPGMOOUAPYlkWWsXLHsKd1JMYjCzNjO', 'manager'),
('analyst@salesiq.com', '$2b$10$XEU8iyO4h4Jyj7QjOUAA6OsPGMOOUAPYlkWWsXLHsKd1JMYjCzNjO', 'analyst'),
('viewer@salesiq.com', '$2b$10$XEU8iyO4h4Jyj7QjOUAA6OsPGMOOUAPYlkWWsXLHsKd1JMYjCzNjO', 'viewer')
ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  role = EXCLUDED.role;

INSERT INTO products (name, category, price, stock_quantity, reorder_level) VALUES
('Wireless Headphones', 'Electronics', 99.99, 150, 20),
('Smart Watch', 'Electronics', 299.99, 75, 10),
('Laptop Stand', 'Accessories', 49.99, 200, 25),
('USB Cable', 'Accessories', 9.99, 500, 50),
('Mouse Pad', 'Accessories', 14.99, 300, 30)
ON CONFLICT DO NOTHING;

INSERT INTO orders (customer_email, total_amount, status) VALUES
('customer1@example.com', 149.98, 'delivered'),
('customer2@example.com', 299.99, 'shipped'),
('customer3@example.com', 59.98, 'processing')
ON CONFLICT DO NOTHING;

INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
(1, 1, 1, 99.99),
(1, 3, 1, 49.99),
(2, 2, 1, 299.99),
(3, 4, 2, 9.99),
(3, 5, 1, 14.99)
ON CONFLICT DO NOTHING;

INSERT INTO revenue_forecast (forecast_date, predicted_revenue, confidence_level, model_version) VALUES
(CURRENT_DATE + INTERVAL '1 day', 18500.00, 0.85, 'v1.0'),
(CURRENT_DATE + INTERVAL '2 day', 19200.00, 0.82, 'v1.0'),
(CURRENT_DATE + INTERVAL '3 day', 17800.00, 0.88, 'v1.0'),
(CURRENT_DATE + INTERVAL '4 day', 20100.00, 0.79, 'v1.0'),
(CURRENT_DATE + INTERVAL '5 day', 21500.00, 0.76, 'v1.0'),
(CURRENT_DATE + INTERVAL '6 day', 18900.00, 0.84, 'v1.0'),
(CURRENT_DATE + INTERVAL '7 day', 22300.00, 0.73, 'v1.0')
ON CONFLICT DO NOTHING;
