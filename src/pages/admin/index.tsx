import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function AdminPage() {
  const [votes, setVotes] = useState<any[]>([]);
  const [editions, setEditions] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedEditionId, setSelectedEditionId] = useState<number | "">("");

  // Charger éditions
  useEffect(() => {
    supabase
      .from("editions")
      .select("id, title")
      .order("id")
      .then(({ data }) => setEditions(data || []));
  }, []);

  // Charger membres
  useEffect(() => {
    supabase
      .from("members")
      .select("id, name")
      .then(({ data }) => setMembers(data || []));
  }, []);

  // Charger questions
  useEffect(() => {
    supabase
      .from("questions")
      .select("id, text")
      .then(({ data }) => setQuestions(data || []));
  }, []);

  // Charger votes filtrés
  useEffect(() => {
    let query = supabase
      .from("votes")
      .select("id, edition_id, question_id, voter_id, ranking");
    if (selectedEditionId) {
      query = query.eq("edition_id", selectedEditionId as number);
    }
    query.then(({ data }) => setVotes(data || []));
  }, [selectedEditionId]);

  const getEditionTitle = (id: number) =>
    editions.find((e) => e.id === id)?.title || id;
  const getQuestionText = (id: number) =>
    questions.find((q) => q.id === id)?.text || id;
  const getMemberName = (id: number) =>
    members.find((m) => m.id === id)?.name || id;

  const handleDelete = async (id: number) => {
    if (window.confirm("Supprimer ce vote ?")) {
      await supabase.from("votes").delete().eq("id", id);
      setVotes((votes) => votes.filter((v) => v.id !== id));
    }
  };

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
      <table border={1} cellPadding={6} cellSpacing={0}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Édition</th>
            <th>Question</th>
            <th>Votant</th>
            <th>Classement</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {votes.map((v) => (
            <tr key={v.id}>
              <td>{v.id}</td>
              <td>{getEditionTitle(v.edition_id)}</td>
              <td>{getQuestionText(v.question_id)}</td>
              <td>{getMemberName(v.voter_id)}</td>
              <td>{v.ranking}</td>
              <td>
                <button
                  style={{
                    background: "#f77",
                    color: "#fff",
                    border: "1px solid #c44",
                    borderRadius: 4,
                    padding: "2px 10px"
                  }}
                  onClick={() => handleDelete(v.id)}
                >
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
          {votes.length === 0 && (
            <tr>
              <td colSpan={6}>Aucun vote pour cette édition.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
