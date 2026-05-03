const mysql = require("mysql2");
require("dotenv").config();

let isConnected = false;

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "salesiq"
});

db.connect((err) => {
  if (err) {
    isConnected = false;
    console.error("MySQL connection error:", err.message);
    return;
  }

  isConnected = true;
  console.log("MySQL Connected");
});

db.on("error", (err) => {
  isConnected = false;
  console.error("MySQL runtime error:", err.message);
});

db.isConnected = () => isConnected;

module.exports = db;
