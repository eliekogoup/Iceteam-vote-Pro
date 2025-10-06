import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";

type Edition = { id: number; title: string };
type Question = { id: number; text: string };
type EditionQuestion = { edition_id: number; question_id: number };

export default function EditionsQuestionsAdmin() {
  const router = useRouter();
  const [editions, setEditions] = useState<Edition[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedEditionId, setSelectedEditionId] = useState<number | "">("");
  const [linkedQuestions, setLinkedQuestions] = useState<EditionQuestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEditions();
    fetchQuestions();
  }, []);

  useEffect(() => {
    if (selectedEditionId) {
      fetchLinkedQuestions(selectedEditionId as number);
    } else {
      setLinkedQuestions([]);
    }
  }, [selectedEditionId]);

  async function fetchEditions() {
    const { data } = await supabase.from("editions").select("id, title").order("id");
    if (data) setEditions(data);
  }

  async function fetchQuestions() {
    const { data } = await supabase.from("questions").select("id, text").order("id");
    if (data) setQuestions(data);
  }

  async function fetchLinkedQuestions(editionId: number) {
    setLoading(true);
    const { data } = await supabase
      .from("editions_questions")
      .select("edition_id, question_id")
      .eq("edition_id", editionId);
    if (data) setLinkedQuestions(data);
    setLoading(false);
  }

  async function handleAddQuestionToEdition(questionId: number) {
    if (!selectedEditionId) return;
    await supabase
      .from("editions_questions")
      .insert({ edition_id: selectedEditionId, question_id: questionId });
    fetchLinkedQuestions(selectedEditionId as number);
  }

  async function handleRemoveQuestionFromEdition(questionId: number) {
    if (!selectedEditionId) return;
    await supabase
      .from("editions_questions")
      .delete()
      .eq("edition_id", selectedEditionId)
      .eq("question_id", questionId);
    fetchLinkedQuestions(selectedEditionId as number);
  }

  const linkedIds = linkedQuestions.map(eq => eq.question_id);

  return (
    <div style={{ padding: 32 }}>
      <button onClick={() => router.push("/admin")}>← Retour à l'administration</button>
      <h2>Liaison Questions ↔ Édition</h2>
      <label>
        Choisir une édition :
        <select
          value={selectedEditionId}
          onChange={e => setSelectedEditionId(Number(e.target.value))}
          style={{ marginLeft: 10 }}
        >
          <option value="">-- Sélectionner --</option>
          {editions.map(edition => (
            <option key={edition.id} value={edition.id}>
              {edition.title}
            </option>
          ))}
        </select>
      </label>
      {selectedEditionId && (
        <>
          <h3>Questions associées à l'édition</h3>
          {loading ? (
            <p>Chargement...</p>
          ) : (
            <ul>
              {linkedQuestions.length === 0 && <li>Aucune question liée.</li>}
              {linkedQuestions.map(eq => {
                const question = questions.find(q => q.id === eq.question_id);
                return (
                  <li key={eq.question_id}>
                    {question?.text ?? "?"}
                    <button
                      style={{ marginLeft: 8, color: "red" }}
                      onClick={() => handleRemoveQuestionFromEdition(eq.question_id)}
                    >
                      Retirer
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <h4>Ajouter une question à cette édition</h4>
          <ul>
            {questions
              .filter(q => !linkedIds.includes(q.id))
              .map(q => (
                <li key={q.id}>
                  {q.text}
                  <button
                    style={{ marginLeft: 8 }}
                    onClick={() => handleAddQuestionToEdition(q.id)}
                  >
                    Ajouter
                  </button>
                </li>
              ))}
          </ul>
        </>
      )}
    </div>
  );
}
