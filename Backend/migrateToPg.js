import { Sequelize } from 'sequelize';
import models from './models.js';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Utility script to migrate data from local SQLite to Production PostgreSQL.
 * Run using: node migrateToPg.js
 * Requires DATABASE_URL to be set to your PostgreSQL instance.
 */

const migrateData = async () => {
  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL is not set in .env. Cannot migrate to PostgreSQL.');
    process.exit(1);
  }

  console.log('Connecting to Local SQLite Database...');
  const sqliteDb = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: false
  });

  console.log('Connecting to Production PostgreSQL Database...');
  const pgDb = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });

  try {
    await sqliteDb.authenticate();
    await pgDb.authenticate();
    console.log('Connections successful.');

    // Note: To fully migrate, we would query sqliteDb and insert into pgDb using models
    // Because models are bound to the default sequelize instance, a true data pump
    // requires binding models to both instances or using raw queries.
    // Since this is a placeholder for future deployment, we verify connections.

    console.log('--- MIGRATION READY ---');
    console.log('To migrate your data, use a tool like pgloader or configure a data pump script here.');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await sqliteDb.close();
    await pgDb.close();
  }
};

migrateData();
