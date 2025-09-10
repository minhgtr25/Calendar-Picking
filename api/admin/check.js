import { getAdminKey, ok, bad } from '../_db.js';

export default async function handler(req, res) {
  const key = getAdminKey(req);
  const ADMIN_KEY = String(process.env.ADMIN_KEY || '').trim();
  if (key && ADMIN_KEY && key === ADMIN_KEY) return ok(res, { ok: true });
  return bad(res, 'Admin key invalid', 401);
}
