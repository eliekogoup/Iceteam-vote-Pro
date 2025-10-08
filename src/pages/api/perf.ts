import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { metrics } = req.body || {};
    if (Array.isArray(metrics) && metrics.length) {
      console.log('PERF BATCH (received):', metrics.map((m: any) => `${m.name}:${m.duration}ms`).join(', '));
    }
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Error in perf endpoint', err);
    res.status(500).json({ ok: false });
  }
}
