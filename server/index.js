const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const WebSocket = require("ws");
const db = require("./db");

const app = express();
const allowedOrigins = (process.env.CLIENT_URLS || process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("CORS origin not allowed"));
  }
}));
app.use(express.json());

const SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Access token required' });

  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Middleware for role-based access
const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};

/* ---------------- AUTH ---------------- */

// Register
app.post("/api/register", async (req, res) => {
  const { email, password, role = 'viewer' } = req.body;

  try {
    const hash = await bcrypt.hash(password, 10);

    db.query(
      "INSERT INTO users (email, password, role) VALUES (?, ?, ?)",
      [email, hash, role],
      (err, result) => {
        if (err) return res.status(400).json({ message: err.message });

        const token = jwt.sign({ id: result.insertId, role }, SECRET);
        res.json({
          token,
          user: { id: result.insertId, email, role }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM users WHERE email=?", [email], async (err, result) => {
    if (err || result.length === 0) return res.status(400).json({ message: "User not found" });

    const user = result[0];

    const match = await bcrypt.compare(password, user.password);

    if (!match) return res.status(400).json({ message: "Wrong password" });

    const token = jwt.sign({ id: user.id, role: user.role }, SECRET);

    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  });
});

/* ---------------- DASHBOARD DATA ---------------- */

app.get("/health", (_req, res) => {
  res.status(db.isConnected() ? 200 : 503).json({
    status: db.isConnected() ? "ok" : "degraded",
    database: db.isConnected() ? "connected" : "disconnected"
  });
});

// Get dashboard summary
app.get("/api/dashboard/summary", authenticateToken, (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  // Get today's real order totals from manual orders
  db.query(`
    SELECT 
      COALESCE(SUM(total_amount), 0) as total_revenue,
      COUNT(*) as total_orders,
      COUNT(DISTINCT customer_email) as total_customers
    FROM orders
    WHERE DATE(order_date) = ?
  `, [today], (err, orderSummary) => {
    if (err) return res.status(500).json({ message: err.message });

    const summary = orderSummary[0];

    // Get total inventory value
    db.query(`
      SELECT SUM(p.price * p.stock_quantity) as inventory_value,
             SUM(CASE WHEN p.stock_quantity <= p.reorder_level THEN 1 ELSE 0 END) as low_stock_items
      FROM products p
    `, (err, inventoryResult) => {
      if (err) return res.status(500).json({ message: err.message });

      res.json({
        ...summary,
        inventory_value: inventoryResult[0].inventory_value || 0,
        low_stock_items: inventoryResult[0].low_stock_items || 0
      });
    });
  });
});

// Get sales chart data (last 30 days)
app.get("/api/dashboard/sales-chart", authenticateToken, (req, res) => {
  db.query(`
    SELECT date, total_revenue, total_orders
    FROM sales_summary
    WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    ORDER BY date ASC
  `, (err, result) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(result);
  });
});

// Get inventory data
app.get("/api/inventory", authenticateToken, authorizeRole(['admin', 'manager']), (req, res) => {
  db.query(`
    SELECT p.*, (p.stock_quantity <= p.reorder_level) as needs_reorder
    FROM products p
    ORDER BY p.name ASC
  `, (err, result) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(result);
  });
});

// Update inventory
app.put("/api/inventory/:id", authenticateToken, authorizeRole(['admin', 'manager']), (req, res) => {
  const { stock_quantity } = req.body;
  const productId = req.params.id;

  db.query(
    "UPDATE products SET stock_quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [stock_quantity, productId],
    (err) => {
      if (err) return res.status(500).json({ message: err.message });

      // Log the action
      db.query(
        "INSERT INTO audit_log (user_id, action, resource) VALUES (?, ?, ?)",
        [req.user.id, 'UPDATE_INVENTORY', `product_${productId}`]
      );

      res.json({ message: "Inventory updated successfully" });
    }
  );
});

// Get revenue forecast
app.get("/api/forecast", authenticateToken, authorizeRole(['admin', 'manager', 'analyst']), (req, res) => {
  db.query(`
    SELECT * FROM revenue_forecast
    WHERE forecast_date >= CURDATE()
    ORDER BY forecast_date ASC
    LIMIT 30
  `, (err, result) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(result);
  });
});

// Get all orders
app.get("/api/orders", authenticateToken, authorizeRole(['admin', 'manager']), (req, res) => {
  db.query(`
    SELECT o.*, 
           GROUP_CONCAT(CONCAT(p.name, ' (', oi.quantity, ' x ₹', oi.unit_price, ')')) as items
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN products p ON oi.product_id = p.id
    GROUP BY o.id
    ORDER BY o.order_date DESC
  `, (err, result) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(result);
  });
});

// Get order details
app.get("/api/orders/:id", authenticateToken, authorizeRole(['admin', 'manager']), (req, res) => {
  const orderId = req.params.id;
  
  db.query(`
    SELECT o.*, oi.quantity, oi.unit_price, p.name as product_name, p.id as product_id
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE o.id = ?
  `, [orderId], (err, result) => {
    if (err) return res.status(500).json({ message: err.message });
    if (result.length === 0) return res.status(404).json({ message: 'Order not found' });
    
    const order = {
      id: result[0].id,
      customer_email: result[0].customer_email,
      total_amount: result[0].total_amount,
      status: result[0].status,
      order_date: result[0].order_date,
      items: result.map(row => ({
        product_id: row.product_id,
        product_name: row.product_name,
        quantity: row.quantity,
        unit_price: row.unit_price
      }))
    };
    
    res.json(order);
  });
});

// Create new order
app.post("/api/orders", authenticateToken, authorizeRole(['admin', 'manager']), (req, res) => {
  const { customer_email, items } = req.body;
  
  if (!customer_email || !items || items.length === 0) {
    return res.status(400).json({ message: 'Customer email and items are required' });
  }
  
  // Calculate total amount
  let totalAmount = 0;
  const orderItems = [];
  
  // First, get product prices and validate stock
  const productIds = items.map(item => item.product_id);
  db.query('SELECT id, name, price, stock_quantity FROM products WHERE id IN (?)', 
    [productIds], (err, products) => {
    if (err) return res.status(500).json({ message: err.message });
    
    // Validate all products exist and have sufficient stock
    for (const item of items) {
      const product = products.find(p => p.id === item.product_id);
      if (!product) {
        return res.status(400).json({ message: `Product ${item.product_id} not found` });
      }
      if (product.stock_quantity < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }
      
      totalAmount += product.price * item.quantity;
      orderItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: product.price
      });
    }
    
    // Create the order
    db.query(
      'INSERT INTO orders (customer_email, total_amount, status) VALUES (?, ?, ?)',
      [customer_email, totalAmount, 'pending'],
      (err, result) => {
        if (err) return res.status(500).json({ message: err.message });
        
        const orderId = result.insertId;
        
        // Insert order items
        const itemValues = orderItems.map(item => 
          [orderId, item.product_id, item.quantity, item.unit_price]
        );
        
        db.query(
          'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ?',
          [itemValues],
          (err) => {
            if (err) {
              // Rollback order if items insertion fails
              db.query('DELETE FROM orders WHERE id = ?', [orderId]);
              return res.status(500).json({ message: err.message });
            }
            
            // Update inventory
            const updatePromises = orderItems.map(item => {
              return new Promise((resolve, reject) => {
                db.query(
                  'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
                  [item.quantity, item.product_id],
                  (err) => {
                    if (err) reject(err);
                    else resolve();
                  }
                );
              });
            });
            
            Promise.all(updatePromises)
              .then(() => {
                // Update sales_summary for today's manual order
                const today = new Date().toISOString().split('T')[0];
                db.query(
                  `INSERT INTO sales_summary (date, total_revenue, total_orders, total_customers)
                   VALUES (?, ?, ?, ?)
                   ON DUPLICATE KEY UPDATE
                     total_revenue = total_revenue + VALUES(total_revenue),
                     total_orders = total_orders + VALUES(total_orders),
                     total_customers = total_customers + VALUES(total_customers)`,
                  [today, totalAmount, 1, 1],
                  (summaryErr) => {
                    if (summaryErr) {
                      console.error('Failed to update sales_summary for manual order:', summaryErr.message);
                    }

                    // Log the action
                    db.query(
                      'INSERT INTO audit_log (user_id, action, resource) VALUES (?, ?, ?)',
                      [req.user.id, 'CREATE_ORDER', `order_${orderId}`]
                    );

                    res.status(201).json({ 
                      message: 'Order created successfully', 
                      order_id: orderId,
                      total_amount: totalAmount 
                    });
                  }
                );
              })
              .catch(err => {
                res.status(500).json({ message: 'Failed to update inventory: ' + err.message });
              });
          }
        );
      }
    );
  });
});

// Update order status
app.put("/api/orders/:id/status", authenticateToken, authorizeRole(['admin', 'manager']), (req, res) => {
  const { status } = req.body;
  const orderId = req.params.id;
  
  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }
  
  db.query(
    'UPDATE orders SET status = ? WHERE id = ?',
    [status, orderId],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      if (result.affectedRows === 0) return res.status(404).json({ message: 'Order not found' });
      
      // Log the action
      db.query(
        'INSERT INTO audit_log (user_id, action, resource) VALUES (?, ?, ?)',
        [req.user.id, 'UPDATE_ORDER_STATUS', `order_${orderId}`]
      );
      
      res.json({ message: 'Order status updated successfully' });
    }
  );
});

/* ---------------- LIVE SALES SIMULATION ---------------- */

let wss;

// Simulate live sales updates
setInterval(() => {
  if (!db.isConnected()) {
    return;
  }

  const today = new Date().toISOString().split('T')[0];

  // Random sales increment
  const revenueIncrement = Math.floor(Math.random() * 500) + 100;
  const ordersIncrement = Math.floor(Math.random() * 5) + 1;

  db.query(`
    INSERT INTO sales_summary (date, total_revenue, total_orders, total_customers)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
    total_revenue = total_revenue + VALUES(total_revenue),
    total_orders = total_orders + VALUES(total_orders),
    total_customers = total_customers + VALUES(total_customers)
  `, [today, revenueIncrement, ordersIncrement, Math.floor(ordersIncrement * 0.8)], (err) => {
    if (err) {
      console.error("Sales simulation skipped:", err.message);
      return;
    }

    // Broadcast update to WebSocket clients
    if (wss) {
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'SALES_UPDATE',
            data: { revenueIncrement, ordersIncrement, timestamp: new Date() }
          }));
        }
      });
    }
  });
}, 5000); // Update every 5 seconds

/* ---------------- WEBSOCKET SERVER ---------------- */

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');

  ws.on('message', (message) => {
    console.log('Received:', message.toString());
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});
