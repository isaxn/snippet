import { Pool } from "pg";

declare global {
  var shareCodePool: Pool | undefined;
  var shareCodeSchemaReady: Promise<void> | undefined;
}

export const pool = global.shareCodePool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined
});

if (process.env.NODE_ENV !== "production") global.shareCodePool = pool;

export function ensureSchema() {
  if (!process.env.DATABASE_URL) return Promise.reject(new Error("DATABASE_URL belum diatur"));
  if (!global.shareCodeSchemaReady) {
    global.shareCodeSchemaReady = pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(80) NOT NULL,
        email VARCHAR(190) NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS sessions (
        token_hash CHAR(64) PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS snippets (
        id BIGSERIAL PRIMARY KEY,
        slug VARCHAR(90) NOT NULL UNIQUE,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(80) NOT NULL,
        description VARCHAR(180) NOT NULL DEFAULT '',
        language VARCHAR(40) NOT NULL DEFAULT 'Lainnya',
        code TEXT NOT NULL,
        visibility VARCHAR(20) NOT NULL DEFAULT 'public',
        views INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at);
      CREATE INDEX IF NOT EXISTS snippets_created_at_idx ON snippets(created_at DESC);
    `).then(() => undefined).catch(error => {
      global.shareCodeSchemaReady = undefined;
      throw error;
    });
  }
  return global.shareCodeSchemaReady;
}
