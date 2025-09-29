import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function AdminPage() {
  const [editions, setEditions] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [selectedEditionId, setSelectedEditionId] = useState<number | "">("");

  // Charger éditions
  useEffect(() => {
    supabase.from("editions").select("id, title, group_id").order("id").then(({ data }) => setEditions(data || []));
  }, []);

  // Charger questions, membres, votes selon édition sélectionnée
  useEffect(() => {
    if (!selectedEditionId) {
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
  }, [selectedEditionId, editions]);

  // Helpers
  const getMemberName = (id: number) => members.find((m) => m.id === id)?.name || id;

  // Suppression
  const handleDelete = async (id: number) => {
    if (window.confirm("Supprimer ce vote ?")) {
      await supabase.from("votes").delete().eq("id", id);
      setVotes((votes) => votes.filter((v) => v.id !== id));
    }
  };

  // Tableau croisé pour chaque question
  return (
    <div style={{ padding: 32 }}>
      <h1>Consultation des Votes</h1>
      <div style={{ marginBottom: 20 }}>
        <label>Choisir une édition : </label>
        <select
          value={selectedEditionId}
          onChange={e => setSelectedEditionId(Number(e.target.value))}
        >
          <option value="">-- Sélectionner --</option>
          {editions.map(e =>
            <option key={e.id} value={e.id}>{e.title}</option>
          )}
        </select>
      </div>

      {questions.map(q => {
        // Lignes: votants, Colonnes: membres classés
        // Cellule = rang attribué par votant à ce membre (pour cette question)
        return (
          <div key={q.id} style={{ marginBottom: 36 }}>
            <h2>{q.text}</h2>
            <table border={1} cellPadding={6} cellSpacing={0}>
              <thead>
                <tr>
                  <th>Votant \ Voté</th>
                  {members.map(m => (
                    <th key={m.id}>{m.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map(votant => (
                  <tr key={votant.id}>
                    <td style={{ fontWeight: "bold" }}>{votant.name}</td>
                    {members.map(membre => {
                      // Cherche le vote pour ce triplet
                      const v = votes.find(
                        (vote) =>
                          vote.question_id === q.id &&
                          vote.voter_id === votant.id &&
                          vote.member_id === membre.id
                      );
                      return (
                        <td key={membre.id} style={{ textAlign: "center" }}>
                          {v ? (
                            <>
                              <span style={{ fontWeight: "bold", fontSize: 18 }}>{v.ranking}</span>
                              <br />
                              <button
                                style={{
                                  background: "#f77",
                                  color: "#fff",
                                  border: "1px solid #c44",
                                  borderRadius: 4,
                                  padding: "2px 10px",
                                  marginTop: 2
                                }}
                                onClick={() => handleDelete(v.id)}
                              >
                                Suppr.
                              </button>
                            </>
                          ) : votant.id === membre.id ? (
                            <span style={{ color: "#aaa" }}>-</span>
                          ) : (
                            ""
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
