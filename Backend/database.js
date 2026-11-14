import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let sequelize;

const databaseUrl = process.env.DATABASE_URL?.trim();

if (databaseUrl) {
  const requiresSsl =
    process.env.NODE_ENV === 'production' ||
    /render\.com|sslmode=require/i.test(databaseUrl);

  // Use PostgreSQL in production or when DATABASE_URL is set
  sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: requiresSsl
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        }
      : {}
  });
} else {
  // Fall back to SQLite for local development
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.resolve(__dirname, 'database.sqlite'),
    logging: false,
  });
}

export default sequelize;
