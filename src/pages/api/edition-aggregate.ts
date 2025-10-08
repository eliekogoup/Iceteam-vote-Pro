import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '../../lib/supabase-auth'
import { getEditionAggregate } from '../../lib/voting-utils-optimized'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const editionId = parseInt(String(req.query.editionId || req.query.id || ''), 10)
  const userEmail = String(req.query.userEmail || '')

  if (Number.isNaN(editionId) || editionId <= 0) {
    return res.status(400).json({ error: 'invalid editionId' })
  }

  try {
    const supabase = createClient()
    const payload = await getEditionAggregate(supabase, editionId, userEmail)
    return res.status(200).json({ ok: true, data: payload })
  } catch (err: any) {
    console.error('Error in edition-aggregate:', err)
    return res.status(500).json({ ok: false, error: String(err?.message || err) })
  }
}
