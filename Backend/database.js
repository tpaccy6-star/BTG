import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sqliteStoragePath = path.resolve(__dirname, 'database.sqlite');

function createSqliteSequelize() {
  return new Sequelize({
    dialect: 'sqlite',
    storage: sqliteStoragePath,
    logging: false
  });
}

let sequelize;

const databaseUrl = process.env.DATABASE_URL?.trim();

if (databaseUrl) {
  const requiresSsl =
    process.env.NODE_ENV === 'production' ||
    /render\.com|sslmode=require/i.test(databaseUrl);

  let pgSequelize = null;
  try {
    pgSequelize = new Sequelize(databaseUrl, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ...(requiresSsl
          ? {
              ssl: {
                require: true,
                rejectUnauthorized: false
              }
            }
          : {}),
        connectionTimeoutMillis: 5000
      }
    });
    await pgSequelize.authenticate();
    sequelize = pgSequelize;
  } catch (err) {
    if (pgSequelize) {
      await pgSequelize.close().catch(() => {});
    }
    if (process.env.REQUIRE_POSTGRES === 'true') {
      throw err;
    }
    const reason = err?.parent?.code || err?.original?.code || err?.message || 'connection error';
    console.warn(
      `PostgreSQL connection unavailable (${reason}); falling back to local SQLite (${sqliteStoragePath}).`
    );
    sequelize = createSqliteSequelize();
  }
} else {
  sequelize = createSqliteSequelize();
}

export default sequelize;
