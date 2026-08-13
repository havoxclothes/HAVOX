import { Pool } from '@neondatabase/serverless';

export default async (req) => {
  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });
  return Response.json({ error: 'Order API is being connected.' }, { status: 501 });
};

export const config = { path: '/api/orders' };
