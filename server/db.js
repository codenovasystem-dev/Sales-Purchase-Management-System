const fs = require("fs/promises");
const path = require("path");
const { Pool } = require("pg");
require("dotenv").config();

let isConnected = false;
let lastConnectionError = null;

const connectionString = process.env.DATABASE_URL;
const shouldUseSsl = process.env.DB_SSL === "true" || Boolean(connectionString);

const pool = new Pool(
  connectionString
    ? {
        connectionString,
        ssl: shouldUseSsl ? { rejectUnauthorized: false } : false,
        max: Number(process.env.DB_POOL_LIMIT || 10)
      }
    : {
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT || 5432),
        user: process.env.DB_USER || "postgres",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "salesiq",
        ssl: shouldUseSsl ? { rejectUnauthorized: false } : false,
        max: Number(process.env.DB_POOL_LIMIT || 10)
      }
);

const formatQuery = (sql, values = []) => {
  let valueIndex = 0;
  const params = [];

  const text = sql.replace(/\?/g, () => {
    const value = values[valueIndex];
    valueIndex += 1;

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return "NULL";
      }

      if (Array.isArray(value[0])) {
        return value
          .map((row) => `(${row.map((cell) => {
            params.push(cell);
            return `$${params.length}`;
          }).join(", ")})`)
          .join(", ");
      }

      return value
        .map((cell) => {
          params.push(cell);
          return `$${params.length}`;
        })
        .join(", ");
    }

    params.push(value);
    return `$${params.length}`;
  });

  return { text, values: params };
};

const execute = async (sql, values = []) => {
  const query = formatQuery(sql, values);
  const result = await pool.query(query);
  isConnected = true;
  lastConnectionError = null;

  const rows = result.rows || [];
  rows.affectedRows = result.rowCount || 0;

  if (rows[0] && typeof rows[0].id !== "undefined") {
    rows.insertId = rows[0].id;
  }

  return rows;
};

const db = {
  query(sql, values, callback) {
    const hasValues = typeof values !== "function";
    const params = hasValues ? values : [];
    const cb = hasValues ? callback : values;
    const promise = execute(sql, params).catch((error) => {
      isConnected = false;
      lastConnectionError = error;
      console.error("PostgreSQL query error:", error.message);
      throw error;
    });

    if (typeof cb === "function") {
      promise.then((rows) => cb(null, rows)).catch((error) => cb(error));
    }

    return promise;
  },

  testConnection() {
    return pool.query("SELECT 1").then(() => {
      isConnected = true;
      lastConnectionError = null;
      return true;
    }).catch((error) => {
      isConnected = false;
      lastConnectionError = error;
      throw error;
    });
  },

  async initializeSchema() {
    const schemaPath = path.join(__dirname, "..", "database", "schema.sql");
    const schemaSql = await fs.readFile(schemaPath, "utf8");
    await pool.query(schemaSql);
    isConnected = true;
    return true;
  },

  isConnected() {
    return isConnected;
  },

  getLastConnectionError() {
    return lastConnectionError;
  },

  getConnectionMode() {
    return connectionString ? "DATABASE_URL" : "DB_HOST";
  }
};

db.testConnection()
  .then(() => {
    console.log("PostgreSQL connected");
  })
  .catch((error) => {
    console.error("PostgreSQL connection error:", error.message);
  });

module.exports = db;
