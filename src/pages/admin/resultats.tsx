import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import AdminNav from "../../components/AdminNav";

export default function ResultatsPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editions, setEditions] = useState<any[]>([]);
  const [selectedEditionId, setSelectedEditionId] = useState<number | "">("");
  const [results, setResults] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  // Vérifier les droits admin
  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: member } = await supabase
          .from("members")
          .select("is_admin")
          .eq("user_id", user.id)
          .single();
        setIsAdmin(!!member?.is_admin);
      }
      setLoading(false);
    }
    checkAdmin();
  }, []);

  // Charger les éditions
  useEffect(() => {
    if (!loading) {
      supabase.from("editions").select("id, title, group_id").order("id").then(({ data }) => {
        if (data) setEditions(data);
      });
    }
  }, [loading]);

  // Charger les résultats pour l'édition sélectionnée
  useEffect(() => {
    if (!selectedEditionId) {
      setResults([]);
      setQuestions([]);
      setMembers([]);
      return;
    }

    async function fetchResults() {
      try {
        // Récupérer l'édition
        const edition = editions.find(e => e.id === selectedEditionId);
        if (!edition) return;

        // Exécuter toutes les requêtes en parallèle pour optimiser la performance
        const [editionQuestionsResult, membersResult, votesResult] = await Promise.all([
          supabase.from("editions_questions").select("question_id").eq("edition_id", selectedEditionId),
          supabase.from("members").select("id, name, group_id").eq("group_id", edition.group_id).order("name"),
          supabase.from("votes").select("id, question_id, voter_id, member_id, ranking").eq("edition_id", selectedEditionId)
        ]);

        if (!editionQuestionsResult.data || editionQuestionsResult.data.length === 0) {
          setQuestions([]);
          setMembers(membersResult.data || []);
          setResults([]);
          return;
        }

        // Récupérer les détails des questions
        const questionIds = editionQuestionsResult.data.map((eq: any) => eq.question_id);
        const { data: questionsData } = await supabase
          .from("questions")
          .select("id, text")
          .in("id", questionIds);

        setQuestions(questionsData || []);
        setMembers(membersResult.data || []);

        // Calculer les résultats
        if (questionsData && membersResult.data && votesResult.data) {
          const calculatedResults = calculateResults(questionsData, membersResult.data, votesResult.data);
          setResults(calculatedResults);
        }

      } catch (error) {
        console.error("Erreur lors du chargement des résultats:", error);
      }
    }

    fetchResults();
  }, [selectedEditionId, editions]);

  // Calculer les résultats avec classement
  function calculateResults(questions: any[], members: any[], votes: any[]) {
    return questions.map(question => {
      const questionVotes = votes.filter(v => v.question_id === question.id);
      
      // Calculer le score moyen pour chaque membre
      const memberScores = members.map(member => {
        const memberVotes = questionVotes.filter(v => v.member_id === member.id);
        
        if (memberVotes.length === 0) {
          return {
            member,
            averageRank: null,
            voteCount: 0,
            totalPoints: 0
          };
        }

        const totalRank = memberVotes.reduce((sum, vote) => sum + vote.ranking, 0);
        const averageRank = totalRank / memberVotes.length;
        
        // Calculer les points (rang inversé : meilleur rang = plus de points)
        const maxRank = Math.max(...questionVotes.map(v => v.ranking));
        const totalPoints = memberVotes.reduce((sum, vote) => sum + (maxRank + 1 - vote.ranking), 0);

        return {
          member,
          averageRank,
          voteCount: memberVotes.length,
          totalPoints,
          votes: memberVotes
        };
      });

      // Trier par rang moyen (plus petit = meilleur)
      const sortedMembers = memberScores
        .filter(ms => ms.averageRank !== null)
        .sort((a, b) => a.averageRank! - b.averageRank!);

      return {
        question,
        memberScores: sortedMembers,
        totalVotes: questionVotes.length
      };
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
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div className="loading"></div>
            <p>Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <AdminNav isAdmin={isAdmin} />
      
      <div className="page-container">
        <h1>🏆 Résultats des votes</h1>
        
        <div style={{ marginBottom: '30px' }}>
          <label>Choisir une édition :</label>
          <select
            value={selectedEditionId}
            onChange={e => setSelectedEditionId(Number(e.target.value))}
          >
            <option value="">-- Sélectionner une édition --</option>
            {editions.map(e =>
              <option key={e.id} value={e.id}>{e.title}</option>
            )}
          </select>
        </div>

        {selectedEditionId && questions.length === 0 && (
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