import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import AdminNav from "../../components/AdminNav";

export default function AdminPage() {
  const [editions, setEditions] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [selectedEditionId, setSelectedEditionId] = useState<number | "">("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Vérifier les droits admin
  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      const { data: member } = await supabase
        .from("members")
        .select("is_admin")
        .eq("user_id", user.id)
        .single();
      setIsAdmin(!!member?.is_admin);
      setLoading(false);
    }
    checkAdmin();
  }, []);

  // Charger éditions
  useEffect(() => {
    if (isAdmin) {
      supabase.from("editions").select("id, title, group_id").order("id").then(({ data }) => setEditions(data || []));
    }
  }, [isAdmin]);

  // Charger questions, membres, votes selon édition sélectionnée
  useEffect(() => {
    if (!selectedEditionId || !isAdmin) {
      setQuestions([]);
      setMembers([]);
      setVotes([]);
      return;
    }
    const fetchAll = async () => {
      // Questions pour l'édition
      const { data: edq } = await supabase.from("editions_questions").select("question_id").eq("edition_id", selectedEditionId);
      const qids = edq?.map((e: any) => e.question_id) || [];
      const { data: qs } = await supabase.from("questions").select("id, text").in("id", qids);
      setQuestions(qs || []);
      // Membres pour l'édition
      const edition = editions.find(e => e.id === selectedEditionId);
      let ms: any[] = [];
      if (edition) {
        const { data } = await supabase.from("members").select("id, name, group_id").eq("group_id", edition.group_id).order("name");
        ms = data || [];
      }
      setMembers(ms);
      // Votes
      const { data: vs } = await supabase.from("votes").select("id, edition_id, question_id, voter_id, member_id, ranking").eq("edition_id", selectedEditionId);
      setVotes(vs || []);
    };
    fetchAll();
  }, [selectedEditionId, editions, isAdmin]);

  // Helpers
  const getMemberName = (id: number) => members.find((m) => m.id === id)?.name || `Membre ${id}`;

  // Suppression
  const handleDelete = async (id: number) => {
    if (window.confirm("Supprimer ce vote ?")) {
      const { error } = await supabase.from("votes").delete().eq("id", id);
      if (!error) {
        setVotes((votes) => votes.filter((v) => v.id !== id));
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

  if (!isAdmin) {
    return (
      <div className="container">
        <div className="page-container">
          <div className="error">
            Accès refusé. Vous devez être administrateur pour accéder à cette page.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <AdminNav isAdmin={isAdmin} />
      
      <div className="page-container">
        <h1>📊 Consultation des Votes</h1>
        
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
                                    <button
                                      className="danger small"
                                      style={{ marginTop: '4px' }}
                                      onClick={() => handleDelete(vote.id)}
                                      title="Supprimer ce vote"
                                    >
                                      ✕
                                    </button>
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
