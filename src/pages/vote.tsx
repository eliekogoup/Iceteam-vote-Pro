import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";

type Edition = { id: number; title: string; group_id: number; no_self_vote: boolean };
type Member = { id: number; name: string; group_id: number };

export default function VotePage() {
  const router = useRouter();
  const [editions, setEditions] = useState<Edition[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedEditionId, setSelectedEditionId] = useState<number | "">(null);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [membersToRank, setMembersToRank] = useState<Member[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questionId, setQuestionId] = useState<number | null>(null);

  // Récupération de l'identité depuis sessionStorage au mount
  useEffect(() => {
    const editionIdStr = sessionStorage.getItem("editionId");
    const memberIdStr = sessionStorage.getItem("memberId");
    if (!editionIdStr || !memberIdStr) {
      router.replace("/identite");
      return;
    }
    setSelectedEditionId(Number(editionIdStr));
    setSelectedMemberId(Number(memberIdStr));
  }, [router]);

  // Charger éditions
  useEffect(() => {
    const fetchEditions = async () => {
      const { data } = await supabase.from("editions").select("id, title, group_id, no_self_vote").order("id");
      if (data) setEditions(data);
    };
    fetchEditions();
  }, []);

  // Charger membres de l'édition
  useEffect(() => {
    if (!selectedEditionId) return;
    const edition = editions.find(e => e.id === selectedEditionId);
    if (!edition) return;
    const fetchMembers = async () => {
      const { data } = await supabase
        .from("members")
        .select("id, name, group_id")
        .eq("group_id", edition.group_id)
        .order("name");
      setMembers(data || []);
    };
    fetchMembers();
  }, [selectedEditionId, editions]);

  // Charger la question liée à l'édition (si une seule question par édition)
  useEffect(() => {
    if (!selectedEditionId) return;
    const fetchQuestion = async () => {
      const { data: eq } = await supabase
        .from("editions_questions")
        .select("question_id")
        .eq("edition_id", selectedEditionId);
      if (eq && eq.length > 0) {
        setQuestionId(eq[0].question_id);
      } else {
        setQuestionId(null);
      }
    };
    fetchQuestion();
  }, [selectedEditionId]);

  // Préparer la liste des membres à classer (après récup de membres)
  useEffect(() => {
    if (selectedMemberId == null) return;
    const edition = editions.find(e => e.id === selectedEditionId);
    if (!edition) return;
    let filtered = members;
    if (edition.no_self_vote) {
      filtered = members.filter(m => m.id !== selectedMemberId);
    }
    setMembersToRank(filtered);
  }, [selectedMemberId, members, editions, selectedEditionId]);

  // Drag & drop handlers
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const reordered = Array.from(membersToRank);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setMembersToRank(reordered);
  };

  // Soumission du classement
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!selectedEditionId || !selectedMemberId) {
      setError("Identité manquante. Merci de vous identifier.");
      return;
    }
    if (!questionId) {
      setError("Aucune question liée à cette édition.");
      return;
    }
    // Création des votes avec ranking = position
    const inserts = membersToRank.map((m, idx) => ({
      edition_id: selectedEditionId,
      question_id: questionId,
      voter_id: selectedMemberId,
      ranking: idx + 1,
    }));
    const { error: insertError } = await supabase.from("votes").insert(inserts);
    if (insertError) {
      setError("Erreur lors de l'enregistrement du vote : " + insertError.message);
    } else {
      setSubmitted(true);
    }
  };

  // Affichage du nom du votant pour confirmation
  const memberName = members.find(m => m.id === selectedMemberId)?.name || "";

  if (submitted) {
    return (
      <div style={{ padding: 32 }}>
        <h2>Merci, votre vote a été enregistré !</h2>
      </div>
    );
  }

  // Attente de chargement de l'identité
  if (selectedEditionId == null || selectedMemberId == null) {
    return <div style={{ padding: 32 }}>Chargement...</div>;
  }

  // Infos édition
  const editionTitle = editions.find(e => e.id === selectedEditionId)?.title || "";

  return (
    <div style={{ padding: 32, maxWidth: 600, margin: "auto" }}>
      <h1>Classement des membres</h1>
      <p><b>Édition :</b> {editionTitle}</p>
      <p><b>Je suis :</b> {memberName}</p>
      <form onSubmit={handleSubmit}>
        <h3>Classez les membres par ordre de préférence (1er en haut)</h3>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="membersList">
            {(provided) => (
              <ul
                {...provided.droppableProps}
                ref={provided.innerRef}
                style={{ listStyle: "none", padding: 0 }}
              >
                {membersToRank.map((m, idx) => (
                  <Draggable key={m.id} draggableId={m.id.toString()} index={idx}>
                    {(prov) => (
                      <li
                        ref={prov.innerRef}
                        {...prov.draggableProps}
                        {...prov.dragHandleProps}
                        style={{
                          background: "#f8f8ff",
                          marginBottom: 8,
                          padding: 12,
                          borderRadius: 5,
                          border: "1px solid #ddd",
                          ...prov.draggableProps.style,
                        }}
                      >
                        <span style={{ marginRight: 12, fontWeight: "bold" }}>{idx + 1}</span>
                        {m.name}
                      </li>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>
        <button type="submit" style={{ marginTop: 18 }}>
          Valider mon classement
        </button>
        {error && (
          <div style={{ color: "red", marginTop: 10 }}>
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
