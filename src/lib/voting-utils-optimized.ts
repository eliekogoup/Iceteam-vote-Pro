import type { SupabaseClient } from '@supabase/supabase-js'

type Member = { id: number; email: string; nom?: string; prenom?: string; is_active?: boolean }
type Vote = { id: number; edition_id: number; voter_id: number; member_id?: number; question_id?: number; choice?: string }
type Question = { id: number; edition_id: number; title?: string; ord?: number }
type Edition = { id: number; title?: string; description?: string; group_id?: number; no_self_vote?: boolean }

/**
 * Returns: { edition, members, votes, userHasVoted }
 * - members: active members for the edition's group
 * - votes: all votes for the edition
 * - userHasVoted: boolean (if userEmail provided)
 */
export async function getEditionAggregate(supabase: SupabaseClient, editionId: number, userEmail?: string | null) {
  // Run three queries in parallel: edition (to get group), members in group, votes in edition
  const editionP = supabase.from('editions').select('id, title, description, group_id, no_self_vote').eq('id', editionId).maybeSingle()
  const votesP = supabase.from('votes').select('*').eq('edition_id', editionId)
  const questionsP = supabase.from('questions').select('*').eq('edition_id', editionId)

  const [editionRes, votesRes, questionsRes] = await Promise.all([editionP, votesP, questionsP])

  if (editionRes.error) throw editionRes.error
  const edition = editionRes.data
  if (!edition) throw new Error('Edition not found')

  // members: join via member_groups
  const membersRes = await supabase
    .from('member_groups')
    .select(`member_id, members(id, email, nom, prenom, is_active)`, { count: 'exact' })
    .eq('group_id', edition.group_id)

  if (membersRes.error) throw membersRes.error

  const members: Member[] = (membersRes.data || []).map((mg: any) => {
    const m = mg.members
    // handle join shapes
    if (Array.isArray(m)) return m[0]
    return m
  }).filter(Boolean).filter((m: Member) => m.is_active !== false)

  if (votesRes.error) throw votesRes.error
  const votes: Vote[] = votesRes.data || []

  if (questionsRes.error) throw questionsRes.error
  const questions: Question[] = questionsRes.data || []

  // compute userHasVoted
  let userHasVoted = false
  if (userEmail) {
    // find member by email among members list first (fast path)
    const member = members.find(m => m.email === userEmail)
    if (member) {
      userHasVoted = votes.some(v => v.voter_id === member.id || v.member_id === member.id)
    } else {
      // fallback: query members table
  const { data: memberRes, error: memberError } = await supabase.from('members').select('id').eq('email', userEmail).maybeSingle()
      if (!memberError && memberRes) {
        userHasVoted = votes.some(v => v.voter_id === memberRes.id || v.member_id === memberRes.id)
      }
    }
  }

  return { edition, members, votes, questions, userHasVoted }
}

export default getEditionAggregate
