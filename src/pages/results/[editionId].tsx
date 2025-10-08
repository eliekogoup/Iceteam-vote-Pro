import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";
import { clientCache } from '../../lib/client-cache';
import Link from "next/link";

export default function ResultsPage() {
  const router = useRouter();
  const { editionId } = router.query;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [edition, setEdition] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [authorized, setAuthorized] = useState(false);

  // Vérifier l'authentification et l'autorisation
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        const { data: member } = await supabase
          .from("members")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (!member) {
          setError('Accès non autorisé');
          return;
        }
        
        // Vérifier si l'utilisateur peut voir les résultats de cette édition
        if (editionId) {
          const { data: editionData } = await supabase
            .from("editions")
            .select("*")
            .eq("id", editionId)
            .single();

          if (editionData) {
            setEdition(editionData);
            
            // Vérifier si l'utilisateur fait partie du groupe de l'édition
            const { data: memberGroup } = await supabase
              .from("member_groups")
              .select("*")
              .eq("member_id", member.id)
              .eq("group_id", editionData.group_id)
              .single();

            if (memberGroup || member.is_admin) {
              setAuthorized(true);
              
              // Charger les résultats après autorisation
              await fetchResults(editionData);
            }
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Erreur d\'authentification:', error);
        setLoading(false);
      }
    }
    checkAuth();
  }, [editionId, router]);

  async function fetchResults(edition: any) {
    try {
      // Exécuter toutes les requêtes en parallèle pour optimiser la performance
      const [editionQuestionsResult, membersResult, votesResult] = await Promise.all([
        supabase.from("editions_questions").select("question_id").eq("edition_id", edition.id),
        (async () => {
          const cacheKey = `results:edition:${edition.id}:members`;
          const cached = clientCache.get<any[]>(cacheKey);
          if (cached) return { data: cached };
          const res = await supabase.from("members").select("id, name, group_id").eq("group_id", edition.group_id).order("name");
          if (res.data) clientCache.set(cacheKey, res.data, 5 * 60 * 1000);
          return res;
        })(),
        supabase.from("votes").select("id, question_id, voter_id, member_id, ranking").eq("edition_id", edition.id)
      ]);

      if (!editionQuestionsResult.data || editionQuestionsResult.data.length === 0) {
        setQuestions([]);
        setMembers(membersResult.data || []);
        setResults([]);
        return;
      }

      // Récupérer les détails des questions
      const questionIds = editionQuestionsResult.data.map((eq: any) => eq.question_id);

      const qCacheKey = `results:edition:${edition.id}:questions:${questionIds.join(',')}`;
      const cachedQs = clientCache.get<any[]>(qCacheKey);
      let questionsData: any[] | null = null;
      if (cachedQs) {
        questionsData = cachedQs;
      } else {
        const { data } = await supabase
          .from("questions")
          .select("id, text")
          .in("id", questionIds);
        questionsData = data || [];
        if (questionsData.length) clientCache.set(qCacheKey, questionsData, 5 * 60 * 1000);
      }

      setQuestions(questionsData || []);
      setMembers(membersResult.data || []);

      // Calculer les résultats
      if (questionsData && membersResult.data && votesResult.data) {
        // Pré-indexer les votes côté client pour des calculs plus rapides
        const votes = votesResult.data;
        const votesByQuestion: Record<number, any[]> = votes.reduce((acc, v) => {
          if (!acc[v.question_id]) acc[v.question_id] = [];
          acc[v.question_id].push(v);
          return acc;
        }, {} as Record<number, any[]>);

        const votesByMember: Record<number, any[]> = votes.reduce((acc, v) => {
          if (!acc[v.member_id]) acc[v.member_id] = [];
          acc[v.member_id].push(v);
          return acc;
        }, {} as Record<number, any[]>);

        const calculatedResults = calculateResults(questionsData, membersResult.data, votesResult.data, votesByQuestion, votesByMember);
        setResults(calculatedResults);
      }

    } catch (error) {
      console.error("Erreur lors du chargement des résultats:", error);
    }
  }



  // Calculer les résultats avec classement en utilisant des index de votes pour performance
  function calculateResults(
    questions: any[],
    members: any[],
    votes: any[],
    votesByQuestion?: Record<number, any[]>,
    votesByMember?: Record<number, any[]>
  ) {
    // Construire les index si non fournis
    const vByQ = votesByQuestion || votes.reduce((acc: Record<number, any[]>, v: any) => {
      if (!acc[v.question_id]) acc[v.question_id] = [];
      acc[v.question_id].push(v);
      return acc;
    }, {} as Record<number, any[]>);

    return questions.map(question => {
      const questionVotes = vByQ[question.id] || [];
      const maxRank = questionVotes.length ? Math.max(...questionVotes.map((v: any) => v.ranking)) : 0;

      // Index votes par membre pour cette question
      const votesByMemberLocal = questionVotes.reduce((acc: Record<number, any[]>, v: any) => {
        if (!acc[v.member_id]) acc[v.member_id] = [];
        acc[v.member_id].push(v);
        return acc;
      }, {} as Record<number, any[]>);

      const memberScores = members.map(member => {
        const memberVotes = votesByMemberLocal[member.id] || [];
        if (memberVotes.length === 0) return { member, averageRank: null, voteCount: 0, totalPoints: 0 };
        const totalRank = memberVotes.reduce((sum: number, vote: any) => sum + vote.ranking, 0);
        const averageRank = totalRank / memberVotes.length;
        const totalPoints = memberVotes.reduce((sum: number, vote: any) => sum + (maxRank + 1 - vote.ranking), 0);
        return { member, averageRank, voteCount: memberVotes.length, totalPoints, votes: memberVotes };
      });

      const sortedMembers = memberScores
        .filter(ms => ms.averageRank !== null)
        .sort((a, b) => a.averageRank! - b.averageRank!);

      return { question, memberScores: sortedMembers, totalVotes: questionVotes.length };
    });
  }

  // Fonction pour générer une couleur basée sur le rang
  function getRankColor(rank: number, total: number) {
    if (rank === 1) return '#gold';
    if (rank === 2) return '#silver';
    if (rank === 3) return '#cd7f32'; // bronze
    
    const ratio = (rank - 1) / (total - 1);
    const red = Math.floor(255 * ratio);
    const green = Math.floor(255 * (1 - ratio));
    return `rgb(${red}, ${green}, 100)`;
  }

  if (loading) {
    return (
      <div className="container">
        <div className="page-container">
          <div className="loading">Chargement...</div>
        </div>
      </div>
    );
  }



  if (error) {
    return (
      <div className="container">
        <div className="page-container">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <h2>❌ Erreur</h2>
            <p>{error}</p>
            <Link href="/" className="btn btn-primary" style={{ marginTop: '20px' }}>
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!authorized || !edition) {
    return (
      <div className="container">
        <div className="page-container">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <h2>� Accès refusé</h2>
            <p>Vous n'avez pas l'autorisation d'accéder à cette page.</p>
            <Link href="/" className="btn btn-primary" style={{ marginTop: '20px' }}>
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Navigation avec retour à l'accueil */}
      <nav>
        <ul>
          <li>
            <Link href="/" className="active">
              🏠 Accueil
            </Link>
          </li>
          <li>
            <Link href="/identite">
              🗳️ Voter
            </Link>
          </li>
        </ul>
      </nav>
      
      <div className="page-container">
        <h1>🏆 Résultats des votes</h1>
        
        <div style={{ 
          marginBottom: '30px',
          padding: '20px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h2 style={{ margin: '0 0 10px 0', color: '#333' }}>
            {edition.title}
          </h2>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link 
              href={`/admin/votes?edition=${edition.id}`}
              className="btn btn-secondary"
              style={{ 
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              📊 Voir les détails des votes
            </Link>
          </div>
        </div>

        {questions.length === 0 && (
          <div className="warning">
            Aucune question n'est associée à cette édition.
          </div>
        )}

        {results.map((result, index) => (
          <div key={result.question.id} style={{ 
            marginBottom: '50px',
            background: 'white',
            padding: '30px',
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            <h2 style={{ color: '#495057', marginBottom: '20px' }}>
              {result.question.text}
            </h2>
            
            <div style={{ 
              color: '#666', 
              marginBottom: '20px',
              fontSize: '14px' 
            }}>
              {result.totalVotes} vote(s) • {result.memberScores.length} participant(s) classé(s)
            </div>

            {result.memberScores.length === 0 ? (
              <div className="warning">Aucun vote pour cette question</div>
            ) : (
              <div>
                {/* Podium pour les 3 premiers */}
                {result.memberScores.length >= 3 && (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'end',
                    marginBottom: '30px',
                    gap: '20px'
                  }}>
                    {/* 2ème place */}
                    <div style={{ 
                      textAlign: 'center',
                      background: '#f8f9fa',
                      padding: '20px',
                      borderRadius: '8px',
                      minWidth: '120px'
                    }}>
                      <div style={{ fontSize: '40px' }}>🥈</div>
                      <div style={{ fontWeight: 'bold', fontSize: '18px' }}>
                        {result.memberScores[1]?.member.name}
                      </div>
                      <div style={{ color: '#666', fontSize: '14px' }}>
                        Rang moyen: {result.memberScores[1]?.averageRank.toFixed(2)}
                      </div>
                    </div>

                    {/* 1ère place */}
                    <div style={{ 
                      textAlign: 'center',
                      background: '#fff3cd',
                      padding: '30px 20px',
                      borderRadius: '8px',
                      minWidth: '120px',
                      border: '2px solid #ffc107'
                    }}>
                      <div style={{ fontSize: '50px' }}>🥇</div>
                      <div style={{ fontWeight: 'bold', fontSize: '20px', color: '#856404' }}>
                        {result.memberScores[0]?.member.name}
                      </div>
                      <div style={{ color: '#856404', fontSize: '14px' }}>
                        Rang moyen: {result.memberScores[0]?.averageRank.toFixed(2)}
                      </div>
                    </div>

                    {/* 3ème place */}
                    <div style={{ 
                      textAlign: 'center',
                      background: '#f8f9fa',
                      padding: '20px',
                      borderRadius: '8px',
                      minWidth: '120px'
                    }}>
                      <div style={{ fontSize: '40px' }}>🥉</div>
                      <div style={{ fontWeight: 'bold', fontSize: '18px' }}>
                        {result.memberScores[2]?.member.name}
                      </div>
                      <div style={{ color: '#666', fontSize: '14px' }}>
                        Rang moyen: {result.memberScores[2]?.averageRank.toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tableau complet des résultats */}
                <table style={{ marginTop: '20px' }}>
                  <thead>
                    <tr>
                      <th>Rang</th>
                      <th>Participant</th>
                      <th>Rang moyen</th>
                      <th>Nombre de votes</th>
                      <th>Points totaux</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.memberScores.map((memberScore, idx) => (
                      <tr key={memberScore.member.id} style={{
                        background: idx < 3 ? getRankColor(idx + 1, result.memberScores.length) : 'transparent'
                      }}>
                        <td style={{ 
                          textAlign: 'center',
                          fontWeight: 'bold',
                          fontSize: '18px'
                        }}>
                          #{idx + 1}
                        </td>
                        <td style={{ fontWeight: 'bold' }}>
                          {memberScore.member.name}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {memberScore.averageRank.toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {memberScore.voteCount}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {memberScore.totalPoints}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}