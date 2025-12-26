const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DB_TYPE = process.env.DB_TYPE || 'sqlite';
let db;

if (DB_TYPE === 'sqlite') {
  const Database = require('better-sqlite3');
  const dbPath = process.env.DB_PATH || './database/aonsoku-auth.db';
  const dbDir = path.dirname(dbPath);

  // Ensure database directory exists
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  
  console.log(`✓ Connected to SQLite database: ${dbPath}`);
} else if (DB_TYPE === 'postgres' || DB_TYPE === 'postgresql') {
  const { Pool } = require('pg');
  
  db = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'aonsoku_auth',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
  });
  
  console.log(`✓ Connected to PostgreSQL database: ${process.env.DB_NAME}`);
} else {
  throw new Error(`Unsupported database type: ${DB_TYPE}`);
}

module.exports = db;