import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '../../../lib/supabase-auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const groupId = req.query.groupId ? parseInt(String(req.query.groupId), 10) : undefined
  const limit = req.query.limit ? Math.min(500, parseInt(String(req.query.limit), 10)) : 100
  const offset = req.query.offset ? parseInt(String(req.query.offset), 10) : 0

  try {
    const supabase = createClient()

    let query = supabase.from('members').select(`*, member_groups(groups(id, name))`).order('id')
    if (groupId) query = query.eq('group_id', groupId)

    // support pagination via range
    const start = offset
    const end = offset + limit - 1
    const { data, error } = await query.range(start, end)

    if (error) throw error
    return res.status(200).json({ ok: true, data })
  } catch (err: any) {
    console.error('api/admin/members error', err)
    return res.status(500).json({ ok: false, error: String(err?.message || err) })
  }
}
