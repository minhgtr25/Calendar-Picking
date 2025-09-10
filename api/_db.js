// api/_db.js
import { sql } from '@vercel/postgres';

/**
 * Shim ENV: map các biến Neon -> tên mà @vercel/postgres mong đợi
 * + Bổ sung ?sslmode=require nếu thiếu
 */
(() => {
  const e = process.env;

  // alias cho pooled URL
  if (!e.POSTGRES_URL) {
    e.POSTGRES_URL =
      e.POSTGRES_DATABASE_URL ||        // Neon (Integration)
      e.DATABASE_URL ||                 // fallback chung
      '';
  }

  // alias cho non-pooling (không bắt buộc)
  if (!e.POSTGRES_URL_NON_POOLING) {
    e.POSTGRES_URL_NON_POOLING =
      e.POSTGRES_DATABASE_URL_UNPOOLED ||      // Neon unpooled
      e.POSTGRES_POSTGRES_URL_NON_POOLING ||   // một số preset khác
      '';
  }

  // đảm bảo SSL
  const ensureSSL = (u) =>
    u && !/sslmode=/i.test(u)
      ? (u.includes('?') ? `${u}&sslmode=require` : `${u}?sslmode=require`)
      : u;

  if (e.POSTGRES_URL) e.POSTGRES_URL = ensureSSL(e.POSTGRES_URL);
  if (e.POSTGRES_URL_NON_POOLING) e.POSTGRES_URL_NON_POOLING = ensureSSL(e.POSTGRES_URL_NON_POOLING);
})();

export async function ensureSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS availabilities (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      date DATE NOT NULL,
      slots JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `;
}

export function ok(res, data, code = 200) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

export function bad(res, message, code = 400) {
  ok(res, { error: message }, code);
}

export function getAdminKey(req) {
  try {
    const fromHeader = req.headers['x-admin-key'];
    const url = new URL(req.url, 'http://x');
    const fromQuery = url.searchParams.get('adminKey');
    return String(fromHeader || fromQuery || '').trim();
  } catch {
    return '';
  }
}

export async function readJson(req) {
  return await new Promise((resolve) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); }
      catch { resolve({}); }
    });
  });
}
