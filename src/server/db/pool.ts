import 'dotenv/config';
import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  ...(process.env.DB_SOCKET || process.env.DB_HOST?.startsWith('/cloudsql/')
    ? { socketPath: process.env.DB_SOCKET || process.env.DB_HOST }
    : { host: process.env.DB_HOST }),
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  timezone: 'Z',
  namedPlaceholders: true,
  multipleStatements: false
});

export async function query<T = any>(sql: string, params: Record<string, any> | any[] = []) {
  const [rows] = await pool.execute(sql, params);
  return rows as T[];
}
