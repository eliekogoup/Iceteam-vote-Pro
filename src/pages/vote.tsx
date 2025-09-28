import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Edition = { id: number; title: string };
type Member = { id: number; name: string };
type Question = { id: number; text: string };
type EditionQuestion = { edition_id: number; question_id: number };

export default function VotePage() {
  const [editions, setEditions] = useState<Edition[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editionQuestions, setEditionQuestions] = useState<EditionQuestion[]>([]);

  const [selectedEditionId, setSelectedEditionId] = useState<number | "">("");
  const [selectedMemberId, setSelectedMemberId] = useState<number | "">("");
  const [rankings, setRankings] = useState<{ [questionId: number]: number }>({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger éditions
  useEffect(() => {
    const fetchEditions = async () => {
      const { data } = await supabase.from("editions").select("id, title").order("id");
      if (data) setEditions(data);
    };
    fetchEditions();
  }, []);

  // Charger les membres de l'édition
  useEffect(() => {
    if (!selectedEditionId) return;
    const fetchMembers = async () => {
      const { data } = await supabase
        .from("members")
        .select("id, name, group_id")
        .order("name");
      // Optionnel : filtrer par groupe de l’édition
      setMembers(data || []);
    };
    fetchMembers();
  }, [selectedEditionId]);

  // Charger questions liées à l'édition
  useEffect(() => {
    if (!selectedEditionId) return;
    const fetchEditionQuestions = async () => {
      const { data: eq } = await supabase
        .from("editions_questions")
        .select("question_id")
        .eq("edition_id", selectedEditionId);
      setEditionQuestions(eq || []);
      if (eq && eq.length > 0) {
        const questionIds = eq.map((e: any) => e.question_id);
        const { data: qs } = await supabase
          .from("questions")
          .select("id, text")
          .in("id", questionIds);
        setQuestions(qs || []);
      } else {
        setQuestions([]);
      }
    };
    fetchEditionQuestions();
  }, [selectedEditionId]);

  // Gestion des classements
  const handleRankingChange = (questionId: number, value: number) => {
    setRankings((prev) => ({ ...prev, [questionId]: value }));
  };

  // Soumission du vote
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!selectedEditionId || !selectedMemberId) {
      setError("Merci de sélectionner une édition et un membre.");
      return;
    }
    // Vérifier que tous les classements sont saisis
    if (questions.some((q) => !rankings[q.id])) {
      setError("Merci de classer toutes les questions.");
      return;
    }
    // Enregistrer chaque réponse dans la table votes
    const inserts = questions.map((q) => ({
      edition_id: selectedEditionId,
      question_id: q.id,
      voter_id: selectedMemberId,
      ranking: rankings[q.id],
    }));
    const { error: insertError } = await supabase.from("votes").insert(inserts);
    if (insertError) {
      setError("Erreur lors de l'enregistrement du vote.");
    } else {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div style={{ padding: 32 }}>
        <h2>Merci, votre vote a été enregistré !</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: 32, maxWidth: 600, margin: "auto" }}>
      <h1>Voter pour une édition</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Édition :</label>
          <select
            value={selectedEditionId}
            onChange={(e) => {
              setSelectedEditionId(Number(e.target.value));
              setSelectedMemberId("");
              setQuestions([]);
              setRankings({});
              setSubmitted(false);
            }}
            required
          >
            <option value="">-- Choisir une édition --</option>
            {editions.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>
        </div>
        {selectedEditionId && (
          <div>
            <label>Membre :</label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(Number(e.target.value))}
              required
            >
              <option value="">-- Choisir votre nom --</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {selectedEditionId && selectedMemberId && questions.length > 0 && (
          <div>
            <h3>Classez chaque question (1 = meilleure note, etc.)</h3>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {questions.map((q) => (
                <li key={q.id} style={{ marginBottom: 12 }}>
                  <label>
                    {q.text}
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={rankings[q.id] || ""}
                      onChange={(e) =>
                        handleRankingChange(q.id, Number(e.target.value))
                      }
                      required
                      style={{ marginLeft: 10, width: 60 }}
                    />
                  </label>
                </li>
              ))}
            </ul>
            <button type="submit">Valider mon vote</button>
          </div>
        )}
        {error && (
          <div style={{ color: "red", marginTop: 10 }}>
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
