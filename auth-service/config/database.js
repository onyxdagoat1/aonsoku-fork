const sqlite3 = require('better-sqlite3');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_TYPE = process.env.DATABASE_TYPE || 'sqlite';
const DATABASE_PATH = process.env.DATABASE_PATH || './data/auth.db';
const DATABASE_URL = process.env.DATABASE_URL;

let db = null;

/**
 * Initialize database connection
 */
function initDatabase() {
  if (DATABASE_TYPE === 'postgres') {
    return initPostgres();
  }
  return initSQLite();
}

/**
 * Initialize SQLite database
 */
function initSQLite() {
  console.log('Initializing SQLite database...');
  
  // Ensure data directory exists
  const dataDir = path.dirname(DATABASE_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Create database connection
  db = sqlite3(DATABASE_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Run migrations
  const schema = fs.readFileSync(
    path.join(__dirname, '../db/schema.sql'),
    'utf8'
  );
  
  db.exec(schema);
  console.log('SQLite database initialized successfully');
  
  return {
    type: 'sqlite',
    db,
    query: sqliteQuery,
    run: sqliteRun,
    get: sqliteGet,
    all: sqliteAll,
    close: () => db.close()
  };
}

/**
 * Initialize PostgreSQL database
 */
function initPostgres() {
  console.log('Initializing PostgreSQL database...');
  
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is required for PostgreSQL');
  }

  const pool = new Pool({
    connectionString: DATABASE_URL,
  });

  console.log('PostgreSQL database initialized successfully');
  
  return {
    type: 'postgres',
    pool,
    query: (sql, params = []) => pool.query(sql, params),
    close: () => pool.end()
  };
}

/**
 * SQLite query wrapper
 */
function sqliteQuery(sql, params = []) {
  return db.prepare(sql).all(params);
}

/**
 * SQLite run wrapper (for INSERT, UPDATE, DELETE)
 */
function sqliteRun(sql, params = []) {
  return db.prepare(sql).run(params);
}

/**
 * SQLite get wrapper (for single row)
 */
function sqliteGet(sql, params = []) {
  return db.prepare(sql).get(params);
}

/**
 * SQLite all wrapper (for multiple rows)
 */
function sqliteAll(sql, params = []) {
  return db.prepare(sql).all(params);
}

module.exports = {
  initDatabase,
  DATABASE_TYPE
};
