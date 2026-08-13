import { Pool } from '@neondatabase/serverless';

export default async (req) => {
  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: 'Invalid JSON body' }, { status: 400 }); }
  const items = Array.isArray(body?.items) ? body.items : [];
  if (!items.length) return Response.json({ error: 'Your bag is empty.' }, { status: 400 });
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let subtotal = 0;
    const locked = [];
    for (const item of items) {
      const productId = Number(item.productId), quantity = Number(item.quantity), size = String(item.size || '').toUpperCase();
      const result = await client.query('SELECT ps.id AS product_size_id, ps.size, ps.stock, ps.reserved, p.name, p.price FROM product_sizes ps JOIN products p ON p.id = ps.product_id WHERE ps.product_id = $1 AND ps.size = $2 AND p.active = true FOR UPDATE', [productId, size]);
      if (!result.rows.length) throw new Error('Selected size is unavailable.');
      const row = result.rows[0];
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > Number(row.stock) - Number(row.reserved)) throw new Error(`${row.name} (${row.size}) is out of stock.`);
      subtotal += Number(row.price) * quantity;
      locked.push({ ...row, quantity, productId });
    }
    for (const item of locked) await client.query('UPDATE product_sizes SET reserved = reserved + $1 WHERE id = $2', [item.quantity, item.product_size_id]);
    const deliveryFee = 350, total = subtotal + deliveryFee;
    const customer = body.customer || {};
    const orderNumber = `HVX-${Date.now().toString(36).toUpperCase()}`;
    const orderResult = await client.query('INSERT INTO orders (order_number, customer_name, phone, address, payment_method, subtotal, delivery_fee, total) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id, order_number, status, subtotal, delivery_fee, total', [orderNumber, String(customer.name || ''), String(customer.phone || ''), String(customer.address || ''), String(customer.payment || 'Cash on Delivery'), subtotal, deliveryFee, total]);
    const order = orderResult.rows[0];
    for (const item of locked) await client.query('INSERT INTO order_items (order_id, product_size_id, product_name, size, quantity, unit_price) VALUES ($1,$2,$3,$4,$5,$6)', [order.id, item.product_size_id, item.name, item.size, item.quantity, item.price]);
    await client.query('COMMIT');
    return Response.json({ order }, { status: 201 });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    return Response.json({ error: error instanceof Error ? error.message : 'Unable to create order.' }, { status: 400 });
  } finally { client.release(); await pool.end(); }
};

export const config = { path: '/api/orders' };
