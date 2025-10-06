import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";
import { deleteQuestionSafely } from '../../lib/secure-deletion';

type Question = { id: number; text: string };

export default function QuestionsAdmin() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [editId, setEditId] = useState<number | null>(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  async function fetchQuestions() {
    setLoading(true);
    const { data, error } = await supabase.from("questions").select("*").order("id");
    if (!error && data) setQuestions(data);
    setLoading(false);
  }

  async function handleAddOrEdit(e: React.FormEvent) {
    e.preventDefault();
    if (editId) {
      await supabase.from("questions").update({ text }).eq("id", editId);
    } else {
      await supabase.from("questions").insert({ text });
    }
    setText("");
    setEditId(null);
    fetchQuestions();
  }

  function handleEdit(question: Question) {
    setEditId(question.id);
    setText(question.text);
  }

  async function handleDelete(id: number) {
    const question = questions.find(q => q.id === id);
    if (!question) {
      alert('Question introuvable');
      return;
    }

    if (confirm(`Supprimer la question "${question.text.substring(0, 50)}..." ?`)) {
      const result = await deleteQuestionSafely(id);
      
      if (result.success) {
        alert(`✅ ${result.message}`);
        fetchQuestions();
      } else {
        alert(`❌ ${result.message}`);
      }
    }
  }

  return (
    <div style={{ padding: 32 }}>
      <button onClick={() => router.push("/admin")}>← Retour à l'administration</button>
      <h2>Gestion des Questions</h2>
      <form onSubmit={handleAddOrEdit} style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Texte de la question"
          value={text}
          onChange={e => setText(e.target.value)}
          required
        />
        <button type="submit">{editId ? "Modifier" : "Ajouter"}</button>
        {editId && (
          <button
            type="button"
            onClick={() => {
              setEditId(null);
              setText("");
            }}
          >
            Annuler
          </button>
        )}
      </form>
      {loading ? (
        <p>Chargement...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Texte</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {questions.map(question => (
              <tr key={question.id}>
                <td>{question.id}</td>
                <td>{question.text}</td>
                <td>
                  <button onClick={() => handleEdit(question)}>Editer</button>
                  <button
                    onClick={() => handleDelete(question.id)}
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
