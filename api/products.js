import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const rows = await sql`
      SELECT p.id, p.name, p.slug, p.price, p.image_path AS image,
             COALESCE(json_object_agg(ps.size, ps.stock - ps.reserved) FILTER (WHERE ps.id IS NOT NULL), '{}'::json) AS stock
      FROM products p
      LEFT JOIN product_sizes ps ON ps.product_id = p.id
      WHERE p.active = true
      GROUP BY p.id
      ORDER BY p.id
    `;
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Unable to load inventory' });
  }
}
