export default async function handler(req, res) {
  const e = process.env;
  const summarize = (v) => (v ? `set(len=${v.length})` : 'unset');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({
    POSTGRES_URL: summarize(e.POSTGRES_URL),
    POSTGRES_URL_NON_POOLING: summarize(e.POSTGRES_URL_NON_POOLING),
    // một số biến integration hay có
    POSTGRES_DATABASE_URL: summarize(e.POSTGRES_DATABASE_URL),
    POSTGRES_DATABASE_URL_UNPOOLED: summarize(e.POSTGRES_DATABASE_URL_UNPOOLED),
    ADMIN_KEY: summarize(e.ADMIN_KEY),
  }));
}
