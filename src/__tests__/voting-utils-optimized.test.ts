import { getEditionAggregate } from '../lib/voting-utils-optimized'

type MockResp = { data?: any; error?: any }

function makeMockSupabase(responses: Record<string, MockResp>) {
  // Create a chainable result: select(...).eq(...).maybeSingle() etc.
  const makeChain = (table: string) => ({
    select: (sel?: string, opts?: any) => {
      const resp = responses[table] || { data: [], error: null }

      const chain = {
        eq: (_k: string, _v: any) => ({
          then: (onFulfilled: any) => Promise.resolve(resp).then(onFulfilled),
          maybeSingle: () => Promise.resolve(resp),
        }),
        // Support awaiting the chained call directly (for selects that expect array)
        then: (onFulfilled: any) => Promise.resolve(resp).then(onFulfilled),
        maybeSingle: () => Promise.resolve(resp),
      }
      return chain
    }
  })

  return {
    from: (table: string) => makeChain(table)
  } as any
}

test('getEditionAggregate returns aggregated data and userHasVoted true when member voted', async () => {
  const edition = { id: 1, group_id: 10 }
  const membersJoin = [{ member_id: 100, members: { id: 100, email: 'a@example.com', is_active: true } }]
  const votes = [{ id: 500, edition_id: 1, voter_id: 100 }]

  const supabase = makeMockSupabase({
    editions: { data: edition, error: null },
    votes: { data: votes, error: null },
    member_groups: { data: membersJoin, error: null },
    members: { data: null, error: null }
  })

  const result = await getEditionAggregate(supabase as any, 1, 'a@example.com')

  expect(result.edition.id).toBe(1)
  expect(result.members.length).toBe(1)
  expect(result.votes.length).toBe(1)
  expect(result.userHasVoted).toBe(true)
})

test('getEditionAggregate handles missing edition', async () => {
  const supabase = makeMockSupabase({ editions: { data: null, error: null }, votes: { data: [], error: null }, member_groups: { data: [], error: null } })
  await expect(getEditionAggregate(supabase as any, 999, 'b@example.com')).rejects.toThrow('Edition not found')
})
