import { sql } from '@vercel/postgres';
import { ensureSchema, ok, bad, readJson } from '../_db.js';

export default async function handler(req, res) {
  await ensureSchema();

  if (req.method === 'GET') {
    const { rows } = await sql`
      SELECT id, name, to_char(date, 'YYYY-MM-DD') AS date, slots, created_at
      FROM availabilities
      ORDER BY date ASC, name ASC
    `;
    return ok(res, { items: rows });
  }

  if (req.method === 'POST') {
    const { name, date, slots } = await readJson(req);
    if (!name || !date || !Array.isArray(slots) || slots.length === 0) {
      return bad(res, 'Missing name, date, or slots[]');
    }
    const { rows } = await sql`
      INSERT INTO availabilities (name, date, slots)
      VALUES (${String(name).trim()}, ${date}, ${sql.json(slots)})
      RETURNING id, name, to_char(date, 'YYYY-MM-DD') AS date, slots
    `;
    return ok(res, rows[0], 201);
  }

  res.statusCode = 405; res.end();
}
