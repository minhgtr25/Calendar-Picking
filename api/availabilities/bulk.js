// api/availabilities/bulk.js
import { sql } from '@vercel/postgres';
import { ensureSchema, ok, bad, readJson } from '../_db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.statusCode = 405; return res.end(); }
  try {
    await ensureSchema();

    const { name, days } = await readJson(req);
    if (!name || !Array.isArray(days) || !days.length) return bad(res, 'Missing name or days[]');

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
  } catch (e) {
    console.error('POST /api/availabilities/bulk error:', e);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: String(e?.message || e) }));
  }
}
