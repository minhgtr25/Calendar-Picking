import { sql } from '@vercel/postgres';
export default async function handler(req, res) {
  try {
    const { rows } = await sql`select now() as now`;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ ok: true, now: rows[0].now }));
  } catch (e) {
    res.statusCode = 500;
    res.end(JSON.stringify({ ok: false, error: String(e?.message || e) }));
  }
}
