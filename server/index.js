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
const DEMO_PASSWORD_HASH = "$2b$10$EX12IfSV7tR6E82lfHXpLuDumgRcwlMzaiw1FQYbzfQsXP3a2Zooe";
const DEMO_USERS = [
  ["admin@salesiq.com", DEMO_PASSWORD_HASH, "admin"],
  ["manager@salesiq.com", DEMO_PASSWORD_HASH, "manager"],
  ["analyst@salesiq.com", DEMO_PASSWORD_HASH, "analyst"],
  ["viewer@salesiq.com", DEMO_PASSWORD_HASH, "viewer"]
];
const DEMO_USER_EMAILS = new Set(DEMO_USERS.map(([email]) => email));
const isDatabaseSetupError = (error) =>
  error && (
    error.code === "42P01" ||
    error.code === "3D000" ||
    /relation .* does not exist/i.test(error.message) ||
    /database .* does not exist/i.test(error.message)
  );

let databaseBootstrapPromise = null;
let nextDemoUserId = 5;
let nextDemoOrderId = 4;
const demoProducts = [
  { id: 1, name: "Wireless Headphones", category: "Electronics", price: 99.99, stock_quantity: 150, reorder_level: 20 },
  { id: 2, name: "Smart Watch", category: "Electronics", price: 299.99, stock_quantity: 75, reorder_level: 10 },
  { id: 3, name: "Laptop Stand", category: "Accessories", price: 49.99, stock_quantity: 200, reorder_level: 25 },
  { id: 4, name: "USB Cable", category: "Accessories", price: 9.99, stock_quantity: 500, reorder_level: 50 },
  { id: 5, name: "Mouse Pad", category: "Accessories", price: 14.99, stock_quantity: 300, reorder_level: 30 }
];
const demoOrders = [
  {
    id: 1,
    customer_email: "customer1@example.com",
    total_amount: 149.98,
    status: "delivered",
    order_date: new Date().toISOString(),
    items: [
      { product_id: 1, product_name: "Wireless Headphones", quantity: 1, unit_price: 99.99 },
      { product_id: 3, product_name: "Laptop Stand", quantity: 1, unit_price: 49.99 }
    ]
  },
  {
    id: 2,
    customer_email: "customer2@example.com",
    total_amount: 299.99,
    status: "shipped",
    order_date: new Date().toISOString(),
    items: [
      { product_id: 2, product_name: "Smart Watch", quantity: 1, unit_price: 299.99 }
    ]
  },
  {
    id: 3,
    customer_email: "customer3@example.com",
    total_amount: 34.97,
    status: "processing",
    order_date: new Date().toISOString(),
    items: [
      { product_id: 4, product_name: "USB Cable", quantity: 2, unit_price: 9.99 },
      { product_id: 5, product_name: "Mouse Pad", quantity: 1, unit_price: 14.99 }
    ]
  }
];
const demoForecast = Array.from({ length: 7 }, (_, index) => ({
  id: index + 1,
  forecast_date: new Date(Date.now() + (index + 1) * 86400000).toISOString(),
  predicted_revenue: 18000 + (index * 850),
  confidence_level: Number((0.85 - (index * 0.015)).toFixed(2)),
  model_version: "demo-v1"
}));
const demoSalesSummary = Array.from({ length: 30 }, (_, index) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - index));
  return {
    date: date.toISOString().split("T")[0],
    total_revenue: 9000 + (index * 275),
    total_orders: 18 + (index % 7),
    total_customers: 12 + (index % 5)
  };
});
const demoUsers = [
  { id: 1, email: "admin@salesiq.com", password: DEMO_PASSWORD_HASH, role: "admin" },
  { id: 2, email: "manager@salesiq.com", password: DEMO_PASSWORD_HASH, role: "manager" },
  { id: 3, email: "analyst@salesiq.com", password: DEMO_PASSWORD_HASH, role: "analyst" },
  { id: 4, email: "viewer@salesiq.com", password: DEMO_PASSWORD_HASH, role: "viewer" }
];
let nextSupportTicketId = 1;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const hasBrokenDbHostPlaceholder = () => {
  const host = (process.env.DB_HOST || "").trim().toLowerCase();
  return host.includes("your-db-host") || host.includes("<your") || host === "example";
};

const useDemoMode = () => !db.isConnected() && (!process.env.DATABASE_URL || hasBrokenDbHostPlaceholder());

const getDemoUserByEmail = (email) => demoUsers.find((user) => user.email === email) || null;
const getTodayKey = () => new Date().toISOString().split("T")[0];
const getDemoSummaryForDate = (date) => demoSalesSummary.find((entry) => entry.date === date);

const getDemoDashboardSummary = () => {
  const today = getTodayKey();
  const todaysSales = getDemoSummaryForDate(today) || {
    total_revenue: 0,
    total_orders: 0,
    total_customers: 0
  };
  const inventoryValue = demoProducts.reduce((sum, product) => sum + (product.price * product.stock_quantity), 0);
  const lowStockItems = demoProducts.filter((product) => product.stock_quantity <= product.reorder_level).length;

  return {
    total_revenue: Number(todaysSales.total_revenue.toFixed ? todaysSales.total_revenue.toFixed(2) : todaysSales.total_revenue),
    total_orders: todaysSales.total_orders,
    total_customers: todaysSales.total_customers,
    inventory_value: Number(inventoryValue.toFixed(2)),
    low_stock_items: lowStockItems
  };
};

const getDemoInventory = () =>
  demoProducts.map((product) => ({
    ...product,
    needs_reorder: product.stock_quantity <= product.reorder_level
  }));

const updateDemoSalesSummary = (revenueIncrement, ordersIncrement, customersIncrement) => {
  const today = getTodayKey();
  let entry = getDemoSummaryForDate(today);

  if (!entry) {
    entry = { date: today, total_revenue: 0, total_orders: 0, total_customers: 0 };
    demoSalesSummary.push(entry);
    if (demoSalesSummary.length > 30) {
      demoSalesSummary.shift();
    }
  }

  entry.total_revenue = Number((entry.total_revenue + revenueIncrement).toFixed(2));
  entry.total_orders += ordersIncrement;
  entry.total_customers += customersIncrement;
};

const getSupportSnapshot = async (user) => {
  if (useDemoMode()) {
    return {
      summary: getDemoDashboardSummary(),
      lowStockProducts: getDemoInventory()
        .filter((product) => product.needs_reorder)
        .slice(0, 5)
        .map(({ id, name, stock_quantity, reorder_level }) => ({
          id,
          name,
          stock_quantity,
          reorder_level
        })),
      recentOrders: ["admin", "manager"].includes(user.role)
        ? demoOrders.slice(0, 5).map((order) => ({
            id: order.id,
            customer_email: order.customer_email,
            total_amount: order.total_amount,
            status: order.status,
            order_date: order.order_date
          }))
        : []
    };
  }

  const today = new Date().toISOString().split("T")[0];
  const [orderSummary, inventorySummary, lowStockProducts, recentOrders] = await Promise.all([
    db.query(`
      SELECT
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COUNT(*) as total_orders,
        COUNT(DISTINCT customer_email) as total_customers
      FROM orders
      WHERE DATE(order_date) = ?
    `, [today]),
    db.query(`
      SELECT
        COALESCE(SUM(price * stock_quantity), 0) as inventory_value,
        COALESCE(SUM(CASE WHEN stock_quantity <= reorder_level THEN 1 ELSE 0 END), 0) as low_stock_items
      FROM products
    `),
    db.query(`
      SELECT id, name, stock_quantity, reorder_level
      FROM products
      WHERE stock_quantity <= reorder_level
      ORDER BY stock_quantity ASC
      LIMIT 5
    `),
    ["admin", "manager"].includes(user.role)
      ? db.query(`
          SELECT id, customer_email, total_amount, status, order_date
          FROM orders
          ORDER BY order_date DESC
          LIMIT 5
        `)
      : Promise.resolve([])
  ]);

  return {
    summary: {
      ...orderSummary[0],
      inventory_value: inventorySummary[0].inventory_value || 0,
      low_stock_items: inventorySummary[0].low_stock_items || 0
    },
    lowStockProducts,
    recentOrders
  };
};

const formatSupportContext = (snapshot, user) => {
  const { summary, lowStockProducts, recentOrders } = snapshot;
  const lowStockText = lowStockProducts.length
    ? lowStockProducts.map((product) =>
        `${product.name} (${product.stock_quantity} left, reorder at ${product.reorder_level})`
      ).join("; ")
    : "No low-stock alerts.";
  const orderText = recentOrders.length
    ? recentOrders.map((order) =>
        `#${order.id} ${order.customer_email} ${order.status} Rs ${order.total_amount}`
      ).join("; ")
    : "No recent order details shared for this role.";

  return [
    `User role: ${user.role}.`,
    `Today's revenue: Rs ${summary.total_revenue || 0}.`,
    `Today's orders: ${summary.total_orders || 0}.`,
    `Today's customers: ${summary.total_customers || 0}.`,
    `Inventory value: Rs ${summary.inventory_value || 0}.`,
    `Low stock count: ${summary.low_stock_items || 0}.`,
    `Low stock products: ${lowStockText}`,
    `Recent orders: ${orderText}`
  ].join(" ");
};

const shouldSuggestEscalation = (message) =>
  /(human|agent|manager|urgent|angry|refund|complaint|broken|issue|payment|cancel)/i.test(message || "");

const generateDemoSupportReply = ({ message, context }) => {
  const summary = context.summary || {};
  const lowerMessage = (message || "").toLowerCase();

  if (lowerMessage.includes("inventory") || lowerMessage.includes("stock")) {
    if (context.lowStockProducts?.length) {
      const products = context.lowStockProducts
        .map((product) => `${product.name} (${product.stock_quantity} left)`)
        .join(", ");

      return {
        reply: `I found ${summary.low_stock_items || 0} low-stock items right now. The most urgent are ${products}. I can also connect you with a human teammate if you want help planning a reorder.`,
        source: "demo"
      };
    }

    return {
      reply: "Inventory looks healthy right now with no low-stock alerts in the dashboard snapshot. If you want, I can still escalate this to a human teammate for a manual check.",
      source: "demo"
    };
  }

  if (lowerMessage.includes("order") || lowerMessage.includes("customer")) {
    return {
      reply: `Today the dashboard shows ${summary.total_orders || 0} orders and ${summary.total_customers || 0} customers. Managers and admins can review the latest orders directly from the dashboard order panel.`,
      source: "demo"
    };
  }

  if (lowerMessage.includes("revenue") || lowerMessage.includes("sales")) {
    return {
      reply: `Today's revenue is Rs ${summary.total_revenue || 0} across ${summary.total_orders || 0} orders. The live charts will keep updating as new activity comes in.`,
      source: "demo"
    };
  }

  return {
    reply: `I can help with sales, inventory, orders, and dashboard usage. Right now I see ${summary.total_orders || 0} orders today and ${summary.low_stock_items || 0} low-stock alerts. Ask me a question, or I can escalate you to a live human teammate.`,
    source: "demo"
  };
};

const callOpenAI = async ({ message, history, user, contextText }) => {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: `You are SalesIQ Support Copilot. Give concise, helpful support replies for dashboard users. Use this business context when relevant: ${contextText}`
        },
        ...history.map((entry) => ({
          role: entry.role === "assistant" ? "assistant" : "user",
          content: String(entry.content || "")
        })),
        {
          role: "user",
          content: `User email: ${user.email}\nUser role: ${user.role}\nQuestion: ${message}`
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
  }

  const payload = await response.json();
  return payload.choices?.[0]?.message?.content?.trim();
};

const callGemini = async ({ message, history, user, contextText }) => {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{
            text: `You are SalesIQ Support Copilot. Give concise, helpful support replies for dashboard users. Use this business context when relevant: ${contextText}`
          }]
        },
        contents: [
          ...history.map((entry) => ({
            role: entry.role === "assistant" ? "model" : "user",
            parts: [{ text: String(entry.content || "") }]
          })),
          {
            role: "user",
            parts: [{
              text: `User email: ${user.email}\nUser role: ${user.role}\nQuestion: ${message}`
            }]
          }
        ],
        generationConfig: {
          temperature: 0.3
        }
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${errorText}`);
  }

  const payload = await response.json();
  return payload.candidates?.[0]?.content?.parts?.map((part) => part.text).join("").trim();
};

const generateSupportReply = async ({ message, history, user, context }) => {
  const contextText = formatSupportContext(context, user);

  try {
    if (OPENAI_API_KEY) {
      const reply = await callOpenAI({ message, history, user, contextText });
      if (reply) {
        return { reply, source: "openai" };
      }
    } else if (GEMINI_API_KEY) {
      const reply = await callGemini({ message, history, user, contextText });
      if (reply) {
        return { reply, source: "gemini" };
      }
    }
  } catch (error) {
    console.error("AI support request failed:", error.message);
  }

  return generateDemoSupportReply({ message, context });
};

const broadcastSalesUpdate = (revenueIncrement, ordersIncrement) => {
  if (!wss) {
    return;
  }

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: "SALES_UPDATE",
        data: { revenueIncrement, ordersIncrement, timestamp: new Date() }
      }));
    }
  });
};

const broadcastSupportEvent = (type, data) => {
  if (!wss) {
    return;
  }

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type, data }));
    }
  });
};

const getUserByEmail = async (email) => {
  const rows = await db.query("SELECT * FROM users WHERE email = ?", [email]);
  return rows[0] || null;
};

const ensureDemoUsers = async () => {
  try {
    await db.query(
      `INSERT INTO users (email, password, role) VALUES ?
       ON CONFLICT (email) DO UPDATE SET
         password = EXCLUDED.password,
         role = EXCLUDED.role`,
      [DEMO_USERS]
    );
    console.log("Demo users are ready");
    return true;
  } catch (error) {
    console.error("Failed to seed demo users:", error.message);
    return false;
  }
};

const bootstrapDatabase = async () => {
  if (!databaseBootstrapPromise) {
    databaseBootstrapPromise = (async () => {
      try {
        await db.initializeSchema();
        await ensureDemoUsers();
        console.log("Database schema is ready");
        return true;
      } finally {
        databaseBootstrapPromise = null;
      }
    })();
  }

  return databaseBootstrapPromise;
};

const primeDemoUsers = async (attempts = 5, delayMs = 2000) => {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const seeded = await ensureDemoUsers();
    if (seeded) {
      return;
    }

    if (attempt < attempts) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
};

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
    if (useDemoMode()) {
      const existingUser = getDemoUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const hash = await bcrypt.hash(password, 10);
      const newUser = { id: nextDemoUserId, email, password: hash, role };
      nextDemoUserId += 1;
      demoUsers.push(newUser);

      const token = jwt.sign({ id: newUser.id, role }, SECRET);
      return res.json({
        token,
        user: { id: newUser.id, email, role }
      });
    }

    const hash = await bcrypt.hash(password, 10);

    db.query(
      "INSERT INTO users (email, password, role) VALUES (?, ?, ?) RETURNING id",
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
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    if (useDemoMode()) {
      const user = getDemoUserByEmail(email);
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(400).json({ message: "Wrong password" });
      }

      const token = jwt.sign({ id: user.id, role: user.role }, SECRET);
      return res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
    }

    let user;

    try {
      user = await getUserByEmail(email);
    } catch (error) {
      if (!isDatabaseSetupError(error)) {
        throw error;
      }

      await bootstrapDatabase();
      user = await getUserByEmail(email);
    }

    if (!user && DEMO_USER_EMAILS.has(email)) {
      await ensureDemoUsers();
      user = await getUserByEmail(email);
    }

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({ message: "Wrong password" });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, SECRET);

    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    console.error("Login failed:", error.message);

    if (isDatabaseSetupError(error)) {
      try {
        await bootstrapDatabase();
        return res.status(503).json({
          message: "Database was empty and is being initialized. Please try logging in again in a few seconds."
        });
      } catch (bootstrapError) {
        console.error("Database bootstrap failed:", bootstrapError.message);
      }

      return res.status(503).json({
        message: "Database is not initialized. Check Render DATABASE_URL access and import database/schema.sql if auto-setup does not complete."
      });
    }

    res.status(500).json({ message: "Unable to complete login" });
  }
});

/* ---------------- DASHBOARD DATA ---------------- */

app.get("/health", async (_req, res) => {
  if (useDemoMode()) {
    return res.status(200).json({
      status: "ok",
      database: "demo",
      connectionMode: "demo",
      reason: "Running with in-memory demo data because database configuration is missing or invalid."
    });
  }

  try {
    await db.testConnection();
    res.status(200).json({
      status: "ok",
      database: "connected",
      connectionMode: db.getConnectionMode()
    });
  } catch (_error) {
    const lastError = db.getLastConnectionError();
    res.status(503).json({
      status: "degraded",
      database: "disconnected",
      connectionMode: db.getConnectionMode(),
      reason: lastError ? lastError.message : "Unknown database connection error"
    });
  }
});

app.get("/api/support/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    supportApi: true,
    providers: {
      openai: Boolean(OPENAI_API_KEY),
      gemini: Boolean(GEMINI_API_KEY),
      demoFallback: true
    }
  });
});

app.post("/api/support/chat", authenticateToken, async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message || !String(message).trim()) {
    return res.status(400).json({ message: "A support message is required" });
  }

  try {
    const context = await getSupportSnapshot(req.user);
    const result = await generateSupportReply({
      message: String(message).trim(),
      history: Array.isArray(history) ? history.slice(-8) : [],
      user: req.user,
      context
    });

    res.json({
      reply: result.reply,
      source: result.source,
      escalationSuggested: shouldSuggestEscalation(message)
    });
  } catch (error) {
    console.error("Support chat failed:", error.message);
    res.status(500).json({ message: "Unable to process support chat right now" });
  }
});

app.post("/api/support/escalate", authenticateToken, async (req, res) => {
  const { transcript = [], reason = "" } = req.body;
  const ticketId = `SUP-${String(nextSupportTicketId).padStart(4, "0")}`;
  nextSupportTicketId += 1;

  const escalation = {
    ticketId,
    userEmail: req.user.email,
    role: req.user.role,
    reason: String(reason || "Customer requested live support"),
    transcript: Array.isArray(transcript) ? transcript.slice(-10) : [],
    createdAt: new Date().toISOString()
  };

  broadcastSupportEvent("SUPPORT_ESCALATED", escalation);

  setTimeout(() => {
    broadcastSupportEvent("SUPPORT_AGENT_ASSIGNED", {
      ticketId,
      agentName: "Asha",
      eta: "2 minutes"
    });
  }, 2000);

  res.status(201).json({
    message: "Support escalation created",
    ticketId
  });
});

// Get dashboard summary
app.get("/api/dashboard/summary", authenticateToken, (req, res) => {
  if (useDemoMode()) {
    return res.json(getDemoDashboardSummary());
  }

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
  if (useDemoMode()) {
    return res.json(demoSalesSummary);
  }

  db.query(`
    SELECT date, total_revenue, total_orders
    FROM sales_summary
    WHERE date >= CURRENT_DATE - INTERVAL '30 days'
    ORDER BY date ASC
  `, (err, result) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(result);
  });
});

// Get inventory data
app.get("/api/inventory", authenticateToken, authorizeRole(['admin', 'manager']), (req, res) => {
  if (useDemoMode()) {
    return res.json(getDemoInventory());
  }

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

  if (useDemoMode()) {
    const product = demoProducts.find((item) => item.id === Number(productId));
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.stock_quantity = Number(stock_quantity);
    return res.json({ message: "Inventory updated successfully" });
  }

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
  if (useDemoMode()) {
    return res.json(demoForecast);
  }

  db.query(`
    SELECT * FROM revenue_forecast
    WHERE forecast_date >= CURRENT_DATE
    ORDER BY forecast_date ASC
    LIMIT 30
  `, (err, result) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(result);
  });
});

// Get all orders
app.get("/api/orders", authenticateToken, authorizeRole(['admin', 'manager']), (req, res) => {
  if (useDemoMode()) {
    return res.json(
      demoOrders
        .slice()
        .sort((a, b) => new Date(b.order_date) - new Date(a.order_date))
        .map((order) => ({
          ...order,
          items: order.items.map((item) =>
            `${item.product_name} (${item.quantity} x Rs ${item.unit_price})`
          ).join(", ")
        }))
    );
  }

  db.query(`
    SELECT o.*, 
           STRING_AGG(
             p.name || ' (' || oi.quantity || ' x Rs ' || oi.unit_price || ')',
             ', '
           ) as items
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

  if (useDemoMode()) {
    const order = demoOrders.find((item) => item.id === Number(orderId));
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.json(order);
  }
  
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

  if (useDemoMode()) {
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = demoProducts.find((entry) => entry.id === Number(item.product_id));
      if (!product) {
        return res.status(400).json({ message: `Product ${item.product_id} not found` });
      }
      if (product.stock_quantity < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }

      totalAmount += product.price * item.quantity;
      product.stock_quantity -= item.quantity;
      orderItems.push({
        product_id: product.id,
        product_name: product.name,
        quantity: item.quantity,
        unit_price: product.price
      });
    }

    const orderId = nextDemoOrderId;
    nextDemoOrderId += 1;
    demoOrders.unshift({
      id: orderId,
      customer_email,
      total_amount: Number(totalAmount.toFixed(2)),
      status: "pending",
      order_date: new Date().toISOString(),
      items: orderItems
    });
    updateDemoSalesSummary(totalAmount, 1, 1);
    broadcastSalesUpdate(totalAmount, 1);

    return res.status(201).json({
      message: "Order created successfully",
      order_id: orderId,
      total_amount: Number(totalAmount.toFixed(2))
    });
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
      'INSERT INTO orders (customer_email, total_amount, status) VALUES (?, ?, ?) RETURNING id',
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
                   ON CONFLICT (date) DO UPDATE SET
                     total_revenue = sales_summary.total_revenue + EXCLUDED.total_revenue,
                     total_orders = sales_summary.total_orders + EXCLUDED.total_orders,
                     total_customers = sales_summary.total_customers + EXCLUDED.total_customers`,
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

  if (useDemoMode()) {
    const order = demoOrders.find((item) => item.id === Number(orderId));
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.status = status;
    return res.json({ message: "Order status updated successfully" });
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
  if (!db.isConnected() && !useDemoMode()) {
    return;
  }

  const today = new Date().toISOString().split('T')[0];

  // Random sales increment
  const revenueIncrement = Math.floor(Math.random() * 500) + 100;
  const ordersIncrement = Math.floor(Math.random() * 5) + 1;
  const customersIncrement = Math.floor(ordersIncrement * 0.8);

  if (useDemoMode()) {
    updateDemoSalesSummary(revenueIncrement, ordersIncrement, customersIncrement);
    broadcastSalesUpdate(revenueIncrement, ordersIncrement);
    return;
  }

  db.query(`
    INSERT INTO sales_summary (date, total_revenue, total_orders, total_customers)
    VALUES (?, ?, ?, ?)
    ON CONFLICT (date) DO UPDATE SET
    total_revenue = sales_summary.total_revenue + EXCLUDED.total_revenue,
    total_orders = sales_summary.total_orders + EXCLUDED.total_orders,
    total_customers = sales_summary.total_customers + EXCLUDED.total_customers
  `, [today, revenueIncrement, ordersIncrement, customersIncrement], (err) => {
    if (err) {
      console.error("Sales simulation skipped:", err.message);
      return;
    }

    broadcastSalesUpdate(revenueIncrement, ordersIncrement);
  });
}, 5000); // Update every 5 seconds

/* ---------------- WEBSOCKET SERVER ---------------- */

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  bootstrapDatabase().catch((error) => {
    console.error("Startup bootstrap failed:", error.message);
  });
  primeDemoUsers();
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
