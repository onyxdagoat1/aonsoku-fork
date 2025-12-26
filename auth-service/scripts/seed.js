require('dotenv').config();
const bcrypt = require('bcryptjs');
const DB_TYPE = process.env.DB_TYPE || 'sqlite';

async function seed() {
  console.log('\n🌱 Seeding database with sample data...\n');

  try {
    if (DB_TYPE === 'sqlite') {
      await seedSQLite();
    } else if (DB_TYPE === 'postgres' || DB_TYPE === 'postgresql') {
      await seedPostgreSQL();
    } else {
      throw new Error(`Unsupported database type: ${DB_TYPE}`);
    }

    console.log('\n✅ Seeding completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

async function seedSQLite() {
  const Database = require('better-sqlite3');
  const dbPath = process.env.DB_PATH || './database/aonsoku-auth.db';
  const db = new Database(dbPath);

  const passwordHash = await bcrypt.hash('password123', 10);

  // Insert test user
  const insertUser = db.prepare(`
    INSERT INTO users (email, username, password_hash, is_verified, is_active)
    VALUES (?, ?, ?, ?, ?)
  `);

  try {
    insertUser.run('admin@aonsoku.local', 'admin', passwordHash, 1, 1);
    console.log('✓ Created admin user (email: admin@aonsoku.local, password: password123)');
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      console.log('⊘ Admin user already exists');
    } else {
      throw error;
    }
  }

  // Create profile for admin
  try {
    const insertProfile = db.prepare(`
      INSERT INTO user_profiles (user_id, display_name, bio)
      VALUES (1, ?, ?)
    `);
    insertProfile.run('Admin User', 'Test administrator account for Aonsoku');
    console.log('✓ Created admin profile');
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      console.log('⊘ Admin profile already exists');
    } else {
      throw error;
    }
  }

  db.close();
}

async function seedPostgreSQL() {
  const { Pool } = require('pg');
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'aonsoku_auth',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
  });

  const client = await pool.connect();
  const passwordHash = await bcrypt.hash('password123', 10);

  try {
    // Insert test user
    await client.query(`
      INSERT INTO users (email, username, password_hash, is_verified, is_active)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `, ['admin@aonsoku.local', 'admin', passwordHash, true, true]);

    console.log('✓ Created admin user (email: admin@aonsoku.local, password: password123)');

    // Create profile
    await client.query(`
      INSERT INTO user_profiles (user_id, display_name, bio)
      VALUES (1, $1, $2)
      ON CONFLICT (user_id) DO NOTHING
    `, ['Admin User', 'Test administrator account for Aonsoku']);

    console.log('✓ Created admin profile');
  } catch (error) {
    console.error('Error seeding:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();