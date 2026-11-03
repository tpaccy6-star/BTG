import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let sequelize;

if (process.env.DATABASE_URL) {
  // Use PostgreSQL in production or when DATABASE_URL is set
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
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
