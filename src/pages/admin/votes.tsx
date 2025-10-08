import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { clientCache } from '../../lib/client-cache';
import { perf } from '../../lib/perf';
import { checkIsAdmin } from "../../lib/admin-utils";
import AdminNav from "../../components/AdminNav";
import { useSuperAdmin } from "../../hooks/useSuperAdmin";

export default function VotesPage() {
  const [editions, setEditions] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [selectedEditionId, setSelectedEditionId] = useState<number | "">("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const { isSuperAdmin } = useSuperAdmin();

  // Vérifier l'accès (utiliser la même logique que les autres pages admin)
  useEffect(() => {
    async function checkAccess() {
      try {
        const hasAccess = await checkIsAdmin();
        setIsAuthorized(hasAccess);
      } catch (error) {
        console.error('❌ Erreur lors de la vérification admin:', error);
        setIsAuthorized(false);
      } finally {
        setLoading(false);
      }
    }
    checkAccess();
  }, []);

  // Charger éditions (pour tous les membres autorisés)
  useEffect(() => {
    if (isAuthorized) {
      const cacheKey = 'admin:editions:all';
      const cached = clientCache.get<any[]>(cacheKey);
      if (cached) {
        setEditions(cached);
      } else {
        perf.start('admin:fetchEditions');
        supabase.from("editions").select("id, title, group_id").order("id").then(({ data }) => {
          perf.end('admin:fetchEditions');
          setEditions(data || []);
          if (data) clientCache.set(cacheKey, data, 2 * 60 * 1000);
        });
      }
    }
  }, [isAuthorized]);

  // Charger questions, membres, votes selon édition sélectionnée
  useEffect(() => {
    if (!selectedEditionId || !isAuthorized) {
      setQuestions([]);
      setMembers([]);
      setVotes([]);
      return;
    }
    const fetchAll = async () => {
      try {
        const qs = new URLSearchParams({ editionId: String(selectedEditionId) })
        const aggRes = await fetch(`/api/edition-aggregate?${qs.toString()}`)
        const aggPayload = await aggRes.json()
        const agg = aggPayload?.data || {}
        setMembers(agg.members || [])
        setVotes(agg.votes || [])
        setQuestions(agg.questions || [])
      } catch (err) {
        console.error('Erreur fetch aggregate votes page', err)
        setMembers([])
        setVotes([])
        setQuestions([])
      }
    };
    fetchAll();
  }, [selectedEditionId, editions, isAuthorized]);

  // Helpers
  // Pré-indexer les votes pour rendu efficace
  const votesByQuestion = votes.reduce((acc: Record<number, any[]>, v: any) => {
    if (!acc[v.question_id]) acc[v.question_id] = [];
    acc[v.question_id].push(v);
    return acc;
  }, {} as Record<number, any[]>);

  const votesByVoter = votes.reduce((acc: Record<number, any[]>, v: any) => {
    if (!acc[v.voter_id]) acc[v.voter_id] = [];
    acc[v.voter_id].push(v);
    return acc;
  }, {} as Record<number, any[]>);

  const getMemberName = (id: number) => members.find((m) => m.id === id)?.name || `Membre ${id}`;

  // Suppression (réservée aux super-admins)
  const handleDelete = async (id: number) => {
    if (!isSuperAdmin) {
      alert("Seuls les super-administrateurs peuvent supprimer des votes.");
      return;
    }
    
    if (window.confirm("Supprimer ce vote ?")) {
      const { error } = await supabase.from("votes").delete().eq("id", id);
      if (!error) {
        setVotes((votes) => votes.filter((v) => v.id !== id));
      } else {
        alert("Erreur lors de la suppression du vote.");
      }
    }
  };

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

  if (!isAuthorized) {
    return (
      <div className="container">
        <div className="page-container">
          <div className="error">
            Accès refusé. Vous devez être membre pour accéder à cette page.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <AdminNav isAdmin={isSuperAdmin} />
      
      <div className="page-container">
        <h1>📊 Consultation des Votes</h1>
        
        {!isSuperAdmin && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '8px',
            marginBottom: '20px',
            color: '#1e40af'
          }}>
            ℹ️ Vous consultez les votes en mode lecture seule. Seuls les super-administrateurs peuvent supprimer des votes.
          </div>
        )}
        
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

        {questions.map(q => {
          const questionVotes = votes.filter(v => v.question_id === q.id);
          
          return (
            <div key={q.id} style={{ marginBottom: '40px' }}>
              <h2>{q.text}</h2>
              
              {questionVotes.length === 0 ? (
                <div className="warning">Aucun vote pour cette question</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Votant</th>
                      {members.map(m => (
                        <th key={m.id}>{m.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {members.map(votant => {
                      const votantVotes = questionVotes.filter(v => v.voter_id === votant.id);
                      
                      return (
                        <tr key={votant.id}>
                          <td style={{ fontWeight: "bold" }}>{votant.name}</td>
                          {members.map(membre => {
                            const vote = votantVotes.find(v => v.member_id === membre.id);
                            
                            return (
                              <td key={membre.id} style={{ textAlign: "center" }}>
                                {vote ? (
                                  <div>
                                    <span style={{ 
                                      fontWeight: "bold", 
                                      fontSize: '18px',
                                      color: '#0070f3',
                                      background: '#f0f8ff',
                                      padding: '4px 8px',
                                      borderRadius: '50%',
                                      display: 'inline-block',
                                      minWidth: '24px'
                                    }}>
                                      {vote.ranking}
                                    </span>
                                    <br />
                                    {isSuperAdmin && (
                                      <button
                                        className="danger small"
                                        style={{ marginTop: '4px' }}
                                        onClick={() => handleDelete(vote.id)}
                                        title="Supprimer ce vote (Super Admin uniquement)"
                                      >
                                        ✕
                                      </button>
                                    )}
                                  </div>
                                ) : votant.id === membre.id ? (
                                  <span style={{ color: "#aaa" }}>-</span>
                                ) : (
                                  ""
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
