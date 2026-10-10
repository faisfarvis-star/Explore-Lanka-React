import 'dotenv/config';

export function getDbConfig() {
  const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL || process.env.MYSQL_PRIVATE_URL || process.env.MYSQL_PUBLIC_URL;
  if (dbUrl) {
    try {
      const parsed = new URL(dbUrl);
      return {
        host: parsed.hostname,
        port: Number(parsed.port || 3306),
        user: parsed.username,
        password: decodeURIComponent(parsed.password),
        database: parsed.pathname.replace(/^\//, '') || process.env.MYSQLDATABASE || process.env.DB_NAME || 'explore_lanka_db',
        waitForConnections: true,
        connectionLimit: 5,
        charset: 'utf8mb4',
        multipleStatements: true,
        ssl: (process.env.DB_SSL === 'true' || process.env.MYSQL_SSL === 'true') ? { rejectUnauthorized: false } : undefined
      };
    } catch (e) {
      console.warn('Failed to parse database URL, using environment variables:', e.message);
    }
  }
  return {
    host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
    port: Number(process.env.MYSQLPORT || process.env.DB_PORT || 3306),
    user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'explore_lanka_db',
    waitForConnections: true,
    connectionLimit: 5,
    charset: 'utf8mb4',
    multipleStatements: true,
    ssl: (process.env.DB_SSL === 'true' || process.env.MYSQL_SSL === 'true') ? { rejectUnauthorized: false } : undefined
  };
}
