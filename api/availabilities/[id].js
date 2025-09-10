import { sql } from '@vercel/postgres';
import { ensureSchema, ok, bad, getAdminKey, readJson } from '../_db.js';

export default async function handler(req, res) {
  await ensureSchema();

  const url = new URL(req.url, 'http://x');
  const id = url.pathname.split('/').pop();

  if (!id || isNaN(Number(id))) return bad(res, 'Invalid id');

  if (req.method === 'PUT' || req.method === 'DELETE') {
    const key = getAdminKey(req);
    if (!process.env.ADMIN_KEY || key !== String(process.env.ADMIN_KEY).trim()) {
      return bad(res, 'Admin key required', 401);
    }
  }

  if (req.method === 'PUT') {
    const { name, date, slots } = await readJson(req);
    if (!name || !date || !Array.isArray(slots) || slots.length === 0) {
      return bad(res, 'Missing name, date, or slots[]');
    }
    const { rowCount } = await sql`
      UPDATE availabilities
      SET name=${String(name).trim()}, date=${date}, slots=${sql.json(slots)}
      WHERE id=${Number(id)}
    `;
    return ok(res, { updated: rowCount > 0 });
  }

  if (req.method === 'DELETE') {
    const { rowCount } = await sql`DELETE FROM availabilities WHERE id=${Number(id)}`;
    return ok(res, { deleted: rowCount > 0 });
  }

  res.statusCode = 405; res.end();
}
