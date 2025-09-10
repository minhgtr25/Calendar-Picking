import { sql } from '@vercel/postgres';
import { ensureSchema, ok, bad, readJson } from '../_db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.statusCode = 405; return res.end(); }
  await ensureSchema();

  const { name, days } = await readJson(req);
  if (!name || !Array.isArray(days) || days.length === 0) {
    return bad(res, 'Missing name or days[]');
  }

  const clean = days
    .filter(d => d && d.date && Array.isArray(d.slots) && d.slots.length)
    .map(d => ({ date: d.date, slots: d.slots }));

  if (!clean.length) return bad(res, 'No valid days provided');

  for (const d of clean) {
    await sql`
      INSERT INTO availabilities (name, date, slots)
      VALUES (${String(name).trim()}, ${d.date}, ${sql.json(d.slots)})
    `;
  }
  return ok(res, { inserted: clean.length, name: String(name).trim() }, 201);
}
