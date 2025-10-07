import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../hooks/useAuth";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import AdminNav from "../components/AdminNav";

type Edition = { id: number; title: string; group_id: number; no_self_vote: boolean };
type Member = { id: number; name: string; group_id: number };
type Question = { id: number; text: string };

// Lightweight optimized voting page: fewer effects, memoized transforms, and stable handlers
export default function VoteOptimized() {
  const router = useRouter();
  const { editionId } = router.query;
  const { user, member, isAdmin, isLoading } = useAuth();

  const [editions, setEditions] = useState<Edition[]>([]);
  const [selectedEditionId, setSelectedEditionId] = useState<number | null>(null);
  const [membersToRank, setMembersToRank] = useState<Member[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [rankings, setRankings] = useState<Record<number, Member[]>>({});
  const [hasAlreadyVoted, setHasAlreadyVoted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Load editions once on mount
  useEffect(() => {
    let mounted = true;
    supabase
      .from("editions")
      .select("id, title, group_id, no_self_vote")
      .order("id")
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) return console.error("editions fetch", error);
        setEditions(data || []);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Determine selected edition id from route or session
  useEffect(() => {
    if (editionId) setSelectedEditionId(Number(editionId));
    else {
      const s = typeof window !== 'undefined' ? sessionStorage.getItem('editionId') : null;
      if (s) setSelectedEditionId(Number(s));
    }
  }, [editionId]);

  // Keep member id sync
  useEffect(() => {
    if (member && member.id) {
      // no-op here: we'll use member.id directly where needed
    }
  }, [member]);

  // Fetch members + questions in parallel when edition changes
  useEffect(() => {
    if (!selectedEditionId) return;
    const edition = editions.find(e => e.id === selectedEditionId);
    if (!edition) return;

    let cancelled = false;

    async function fetchBoth() {
      const membersP = supabase
        .from("members")
        .select("id, nom, prenom, group_id")
        .eq("group_id", edition.group_id);

      const questionsP = supabase
        .from("editions_questions")
        .select("question_id, questions(id, text)")
        .eq("edition_id", selectedEditionId);

      const [mRes, qRes] = await Promise.all([membersP, questionsP]);
      if (cancelled) return;

      const membersData = (mRes.data || []).map((m: any) => ({ id: m.id, name: `${m.prenom} ${m.nom}`, group_id: m.group_id }));
      const questionsData = (qRes.data || []).map((r: any) => r.questions).filter(Boolean).flat();

      // Apply no_self_vote rule once
      const filtered = edition.no_self_vote && member ? membersData.filter((m: any) => m.id !== member.id) : membersData;

      setMembersToRank(filtered);
      setQuestions(questionsData || []);

      // initialize rankings only if not set (keeps user ordering stable)
      setRankings(prev => {
        const next = { ...prev };
        (questionsData || []).forEach((q: any) => {
          if (!next[q.id]) next[q.id] = filtered.slice();
        });
        return next;
      });
    }

    fetchBoth().catch(e => console.error('fetchBoth', e));

    return () => { cancelled = true; };
  }, [selectedEditionId, editions, member]);

  // Check existing vote
  useEffect(() => {
    if (!selectedEditionId || !member) return;
    let active = true;

    (async () => {
      try {
        const { data } = await supabase
          .from('votes')
          .select('id')
          .eq('edition_id', selectedEditionId)
          .eq('voter_id', member.id);
        if (!active) return;
        if (data && data.length) setHasAlreadyVoted(true);
      } catch (e) {
        console.error(e);
      }
    })();

    return () => { active = false; };
  }, [selectedEditionId, member]);

  const handleDragEnd = useCallback((questionId: number) => (result: DropResult) => {
    if (!result.destination) return;
    setRankings(prev => {
      const list = Array.from(prev[questionId] || membersToRank);
      const [item] = list.splice(result.source.index, 1);
      list.splice(result.destination.index, 0, item);
      return { ...prev, [questionId]: list };
    });
  }, [membersToRank]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!selectedEditionId || !member) return setError('Données manquantes');
    for (const q of questions) {
      if (!rankings[q.id] || rankings[q.id].length !== membersToRank.length) return setError('Classements incomplets');
    }
    setShowConfirmation(true);
  }, [selectedEditionId, member, questions, rankings, membersToRank]);

  const confirmAndSubmitVote = useCallback(async () => {
    setShowConfirmation(false);
    if (!selectedEditionId || !member) return setError('Données manquantes');

    const { data: already } = await supabase.from('votes').select('id').eq('edition_id', selectedEditionId).eq('voter_id', member.id);
    if (already && already.length) return setHasAlreadyVoted(true);

    const inserts: any[] = [];
    questions.forEach(q => {
      (rankings[q.id] || []).forEach((m, idx) => {
        inserts.push({ edition_id: selectedEditionId, question_id: q.id, voter_id: member.id, member_id: m.id, ranking: idx + 1 });
      });
    });

    if (!inserts.length) return setError('Aucun vote à enregistrer');

    const { error } = await supabase.from('votes').insert(inserts);
    if (error) setError(error.message);
    else setSubmitted(true);
  }, [selectedEditionId, member, questions, rankings]);

  const editionTitle = useMemo(() => editions.find(e => e.id === selectedEditionId)?.title || '', [editions, selectedEditionId]);
  const memberName = member ? `${member.prenom} ${member.nom}` : '';

  if (isLoading) return <div className="loading">Chargement...</div>;
  if (!user || !member) return (
    <div className="auth-required">
      <h2>🔐 Connexion requise</h2>
      <Link href="/auth/login" className="btn-primary">Se connecter</Link>
    </div>
  );
  if (hasAlreadyVoted) return (
    <div className="vote-complete">
      <h1>✅ Vote déjà enregistré</h1>
      <Link href={`/results/${selectedEditionId}`} className="btn-secondary">📊 Voir les résultats</Link>
    </div>
  );
  if (submitted) return (
    <div className="vote-success">
      <h1>🎉 Vote enregistré !</h1>
      <p>{editionTitle}</p>
    </div>
  );

  return (
    <div>
      <AdminNav isAdmin={isAdmin} />
      <div className="page-container">
        <h1>🗳️ Classement des membres (optimisé)</h1>
        <p><strong>Édition:</strong> {editionTitle} — <strong>Votant:</strong> {memberName}</p>

        <form onSubmit={handleSubmit}>
          {questions.map(q => (
            <div key={q.id} className="question-section">
              <h3>{q.text}</h3>
              <DragDropContext onDragEnd={handleDragEnd(q.id)}>
                <Droppable droppableId={`members-${q.id}`}>
                  {(provided) => (
                    <ul {...provided.droppableProps} ref={provided.innerRef}>
                      {((rankings[q.id] && rankings[q.id].length) ? rankings[q.id] : membersToRank).map((m, idx) => (
                        <Draggable key={m.id} draggableId={`${m.id}-${q.id}`} index={idx}>
                          {(prov) => (
                            <li ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}>
                              <span>#{idx + 1}</span> {m.name}
                            </li>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </ul>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          ))}

          <div>
            <button type="submit">✅ Valider</button>
            {error && <div className="error">{error}</div>}
          </div>
        </form>

        {showConfirmation && (
          <div className="modal">
            <p>Confirmer ?</p>
            <button onClick={() => setShowConfirmation(false)}>Annuler</button>
            <button onClick={confirmAndSubmitVote}>Confirmer</button>
          </div>
        )}
      </div>
    </div>
  );
}
