const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DB_TYPE = process.env.DB_TYPE || 'sqlite';

async function migrate() {
  console.log(`\n🔧 Running database migration (${DB_TYPE})...\n`);

  try {
    if (DB_TYPE === 'sqlite') {
      await migrateSQLite();
    } else if (DB_TYPE === 'postgres' || DB_TYPE === 'postgresql') {
      await migratePostgreSQL();
    } else {
      throw new Error(`Unsupported database type: ${DB_TYPE}`);
    }

    console.log('\n✅ Migration completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

async function migrateSQLite() {
  const Database = require('better-sqlite3');
  const dbPath = process.env.DB_PATH || './database/aonsoku-auth.db';
  const dbDir = path.dirname(dbPath);

  // Create database directory if it doesn't exist
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log(`Created database directory: ${dbDir}`);
  }

  const db = new Database(dbPath);
  console.log(`Connected to SQLite database: ${dbPath}`);

  // Read and execute schema
  const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  // Split by semicolon and execute each statement
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const statement of statements) {
    try {
      db.exec(statement);
      console.log(`✓ Executed: ${statement.split('\n')[0].substring(0, 60)}...`);
    } catch (error) {
      if (!error.message.includes('already exists')) {
        throw error;
      }
      console.log(`⊘ Skipped (exists): ${statement.split('\n')[0].substring(0, 60)}...`);
    }
  }

  db.close();
}

async function migratePostgreSQL() {
  const { Pool } = require('pg');

  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'aonsoku_auth',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
  });

  console.log(`Connected to PostgreSQL: ${process.env.DB_NAME}`);

  // Read and execute schema
  const schemaPath = path.join(__dirname, '..', 'database', 'schema-postgres.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  // Split by semicolon and execute each statement
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const client = await pool.connect();

  try {
    for (const statement of statements) {
      try {
        await client.query(statement);
        console.log(`✓ Executed: ${statement.split('\n')[0].substring(0, 60)}...`);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          throw error;
        }
        console.log(`⊘ Skipped (exists): ${statement.split('\n')[0].substring(0, 60)}...`);
      }
    }
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();