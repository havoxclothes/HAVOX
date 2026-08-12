import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

function orderNumber() {
  return `HVX-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { customer, items, deliveryFee = 350 } = req.body || {};
    if (!customer?.name || !customer?.phone || !customer?.address || !Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: 'Missing order details' });
    }

    const result = await sql.transaction(async (tx) => {
      const normalized = items.map((item) => ({ productId: Number(item.productId), size: String(item.size), quantity: Number(item.quantity) }));
      if (normalized.some(i => !Number.isInteger(i.productId) || !Number.isInteger(i.quantity) || i.quantity < 1 || !i.size)) throw new Error('Invalid items');

      const ids = normalized.map(i => i.productId);
      const products = await tx`
        SELECT p.id, p.name, p.price, ps.id AS product_size_id, ps.size, ps.stock, ps.reserved
        FROM products p JOIN product_sizes ps ON ps.product_id=p.id
        WHERE p.id = ANY(${ids}) AND p.active=true
        FOR UPDATE OF ps
      `;

      const lookup = new Map(products.map(p => [`${p.id}:${p.size}`, p]));
      let subtotal = 0;
      const orderItems = [];
      for (const item of normalized) {
        const p = lookup.get(`${item.productId}:${item.size}`);
        if (!p) throw new Error(`Product or size unavailable`);
        const available = Number(p.stock) - Number(p.reserved);
        if (available < item.quantity) throw new Error(`${p.name} ${p.size} has only ${available} available`);
        subtotal += Number(p.price) * item.quantity;
        orderItems.push({ p, ...item });
      }

      const total = subtotal + Number(deliveryFee);
      const number = orderNumber();
      const [order] = await tx`
        INSERT INTO orders (order_number, customer_name, phone, address, payment_method, subtotal, delivery_fee, total)
        VALUES (${number}, ${customer.name}, ${customer.phone}, ${customer.address}, ${customer.payment || 'Cash on Delivery'}, ${subtotal}, ${deliveryFee}, ${total})
        RETURNING id, order_number, status, subtotal, delivery_fee, total, created_at
      `;

      for (const item of orderItems) {
        await tx`UPDATE product_sizes SET reserved = reserved + ${item.quantity} WHERE id=${item.p.product_size_id}`;
        await tx`
          INSERT INTO order_items (order_id, product_size_id, product_name, size, quantity, unit_price)
          VALUES (${order.id}, ${item.p.product_size_id}, ${item.p.name}, ${item.size}, ${item.quantity}, ${item.p.price})
        `;
      }
      return order;
    });

    return res.status(201).json({ ok: true, order: result, message: 'Order created and stock reserved pending HAVOX confirmation.' });
  } catch (error) {
    console.error(error);
    return res.status(409).json({ error: error.message || 'Unable to create order' });
  }
}
