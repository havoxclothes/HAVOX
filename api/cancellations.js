import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);
const adminKey = process.env.HAVOX_ADMIN_KEY;
function authorized(req) { return Boolean(adminKey && req.headers['x-havox-admin-key'] === adminKey); }

export default async function handler(req, res) {
  try {
    if (req.method === 'POST' && req.body?.action === 'request') {
      const { orderNumber, phone, reason = '' } = req.body;
      if (!orderNumber || !phone) return res.status(400).json({ error: 'Order number and phone are required' });
      const rows = await sql`SELECT id, order_number, phone, status FROM orders WHERE order_number=${String(orderNumber).trim()} LIMIT 1`;
      const order = rows[0];
      if (!order || String(order.phone).replace(/\D/g,'').slice(-9) !== String(phone).replace(/\D/g,'').slice(-9)) return res.status(404).json({ error: 'Order not found or phone number does not match' });
      if (order.status !== 'pending') return res.status(409).json({ error: `This order is ${order.status} and cannot be cancelled through this request flow` });
      const existing = await sql`SELECT id, status FROM cancellation_requests WHERE order_id=${order.id} ORDER BY created_at DESC LIMIT 1`;
      if (existing[0]?.status === 'requested') return res.status(200).json({ ok: true, request: existing[0], message: 'Cancellation request already exists' });
      const [request] = await sql`INSERT INTO cancellation_requests (order_id, phone, reason, status) VALUES (${order.id}, ${phone}, ${reason}, 'requested') RETURNING id, order_id, phone, reason, status, created_at`;
      return res.status(201).json({ ok: true, request });
    }
    if (!authorized(req)) return res.status(401).json({ error: 'Admin authorization required' });
    if (req.method === 'GET') {
      const requests = await sql`SELECT cr.id, cr.order_id, o.order_number, o.customer_name, cr.phone, cr.reason, cr.status, cr.created_at, cr.resolved_at, o.total FROM cancellation_requests cr JOIN orders o ON o.id=cr.order_id ORDER BY cr.created_at DESC`;
      return res.status(200).json({ ok: true, requests });
    }
    if (req.method === 'POST' && ['accept','reject'].includes(req.body?.action)) {
      const requestId = Number(req.body.requestId);
      if (!Number.isInteger(requestId)) return res.status(400).json({ error: 'Invalid request id' });
      const result = await sql.transaction(async (tx) => {
        const rows = await tx`SELECT cr.id, cr.order_id, cr.status, o.status AS order_status FROM cancellation_requests cr JOIN orders o ON o.id=cr.order_id WHERE cr.id=${requestId} FOR UPDATE`;
        const request = rows[0];
        if (!request) throw new Error('Cancellation request not found');
        if (request.status !== 'requested') throw new Error('Cancellation request has already been resolved');
        if (req.body.action === 'reject') {
          const [updated] = await tx`UPDATE cancellation_requests SET status='rejected', resolved_at=now() WHERE id=${requestId} RETURNING id, status, resolved_at`;
          return updated;
        }
        if (request.order_status !== 'pending') throw new Error(`Order is already ${request.order_status}`);
        const items = await tx`SELECT product_size_id, quantity FROM order_items WHERE order_id=${request.order_id}`;
        for (const item of items) await tx`UPDATE product_sizes SET reserved=GREATEST(0, reserved-${item.quantity}) WHERE id=${item.product_size_id}`;
        await tx`UPDATE orders SET status='cancelled', updated_at=now() WHERE id=${request.order_id}`;
        const [updated] = await tx`UPDATE cancellation_requests SET status='accepted', resolved_at=now() WHERE id=${requestId} RETURNING id, status, resolved_at`;
        return updated;
      });
      return res.status(200).json({ ok: true, request: result });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error(error);
    return res.status(409).json({ error: error.message || 'Cancellation request failed' });
  }
}
