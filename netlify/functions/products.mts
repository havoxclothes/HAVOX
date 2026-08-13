import { neon } from '@neondatabase/serverless';

export default async () => {
  const sql = neon(process.env.DATABASE_URL);
  const rows = await sql`
    SELECT p.id, p.name, p.slug, p.price, p.image_path, p.active,
           COALESCE(
             json_object_agg(ps.size, GREATEST(ps.stock - ps.reserved, 0)
             ORDER BY CASE ps.size WHEN 'M' THEN 1 WHEN 'L' THEN 2 WHEN 'XL' THEN 3 ELSE 4 END)
             FILTER (WHERE ps.id IS NOT NULL), '{}'::json
           ) AS stock
    FROM products p
    LEFT JOIN product_sizes ps ON ps.product_id = p.id
    WHERE p.active = true
    GROUP BY p.id
    ORDER BY p.id;
  `;

  return Response.json(rows.map((p) => ({
    id: Number(p.id),
    name: p.name,
    slug: p.slug,
    price: Number(p.price),
    image: p.image_path,
    stock: p.stock || {}
  })), { headers: { 'Cache-Control': 'no-store' } });
};

export const config = { path: '/api/products' };
