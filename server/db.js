const mysql = require("mysql2");
require("dotenv").config();

let isConnected = false;

const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "salesiq",
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_LIMIT || 10),
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

const rawQuery = db.query.bind(db);

db.query = (sql, values, callback) => {
  const hasValues = typeof values !== "function";
  const params = hasValues ? values : [];
  const cb = hasValues ? callback : values;

  return rawQuery(sql, params, (err, results, fields) => {
    isConnected = !err;

    if (err) {
      console.error("MySQL query error:", err.message);
    }

    if (typeof cb === "function") {
      cb(err, results, fields);
    }
  });
};

db.testConnection = () =>
  new Promise((resolve, reject) => {
    db.getConnection((err, connection) => {
      if (err) {
        isConnected = false;
        reject(err);
        return;
      }

      isConnected = true;
      connection.ping((pingErr) => {
        if (pingErr) {
          isConnected = false;
          connection.release();
          reject(pingErr);
          return;
        }

        connection.release();
        resolve(true);
      });
    });
  });

db.isConnected = () => isConnected;

db.testConnection()
  .then(() => {
    console.log("MySQL Connected");
  })
  .catch((err) => {
    console.error("MySQL connection error:", err.message);
  });

module.exports = db;
