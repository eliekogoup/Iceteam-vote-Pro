import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";

type Vote = {
  id: number;
  edition_id: number;
  question_id: number;
  voter_id: number;
  ranking: number;
};

type Edition = { id: number; title: string };
type Question = { id: number; text: string };
type Member = { id: number; name: string };

export default function VotesAdmin() {
  const router = useRouter();
  const [votes, setVotes] = useState<Vote[]>([]);
  const [editions, setEditions] = useState<Edition[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    const [{ data: v }, { data: e }, { data: q }, { data: m }] = await Promise.all([
      supabase.from("votes").select("*").order("id"),
      supabase.from("editions").select("id, title"),
      supabase.from("questions").select("id, text"),
      supabase.from("members").select("id, name"),
    ]);
    if (v) setVotes(v);
    if (e) setEditions(e);
    if (q) setQuestions(q);
    if (m) setMembers(m);
    setLoading(false);
  }

  async function handleDelete(id: number) {
    if (confirm("Supprimer ce vote ?")) {
      await supabase.from("votes").delete().eq("id", id);
      fetchAll();
    }
  }

  return (
    <div style={{ padding: 32 }}>
      <button onClick={() => router.push("/admin")}>← Retour à l'administration</button>
      <h2>Consultation des Votes</h2>
      {loading ? (
        <p>Chargement...</p>
      ) : (
        <table>
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
            {votes.map(vote => (
              <tr key={vote.id}>
                <td>{vote.id}</td>
                <td>{editions.find(e => e.id === vote.edition_id)?.title || "?"}</td>
                <td>{questions.find(q => q.id === vote.question_id)?.text || "?"}</td>
                <td>{members.find(m => m.id === vote.voter_id)?.name || "?"}</td>
                <td>{vote.ranking}</td>
                <td>
                  <button
                    onClick={() => handleDelete(vote.id)}
                    style={{ color: "red" }}
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
