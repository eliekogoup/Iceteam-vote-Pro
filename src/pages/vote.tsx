import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";

type Edition = { id: number; title: string; group_id: number; no_self_vote: boolean };
type Member = { id: number; name: string; group_id: number };
type Question = { id: number; text: string };

export default function VotePage() {
  const router = useRouter();
  const [editions, setEditions] = useState<Edition[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [membersToRank, setMembersToRank] = useState<Member[]>([]);
  const [rankings, setRankings] = useState<{ [questionId: number]: Member[] }>({});
  const [selectedEditionId, setSelectedEditionId] = useState<number | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAlreadyVoted, setHasAlreadyVoted] = useState(false);

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

  // Charger toutes les questions liées à l'édition
  useEffect(() => {
    if (!selectedEditionId) return;
    const fetchQuestions = async () => {
      const { data: editionQuestions } = await supabase
        .from("editions_questions")
        .select("question_id")
        .eq("edition_id", selectedEditionId);

      if (editionQuestions && editionQuestions.length > 0) {
        const questionIds = editionQuestions.map((e: any) => e.question_id);
        const { data: qs } = await supabase
          .from("questions")
          .select("id, text")
          .in("id", questionIds);
        setQuestions(qs || []);
      } else {
        setQuestions([]);
      }
    };
    fetchQuestions();
  }, [selectedEditionId]);

  // Préparer la liste des membres à classer (hors soi-même si no_self_vote)
  useEffect(() => {
    if (selectedMemberId == null || questions.length === 0) return;
    const edition = editions.find(e => e.id === selectedEditionId);
    if (!edition) return;
    let filtered = members;
    if (edition.no_self_vote) {
      filtered = members.filter(m => m.id !== selectedMemberId);
    }
    setMembersToRank(filtered);

    // Initialiser rankings pour chaque question avec la liste des membres
    setRankings(() => {
      const newRankings: { [questionId: number]: Member[] } = {};
      questions.forEach(q => {
        newRankings[q.id] = filtered.slice();
      });
      return newRankings;
    });
    // eslint-disable-next-line
  }, [selectedMemberId, members, editions, selectedEditionId, questions.length]);

  // Vérifier si la personne a déjà voté pour cette édition
  useEffect(() => {
    if (selectedEditionId && selectedMemberId) {
      supabase
        .from("votes")
        .select("id")
        .eq("edition_id", selectedEditionId)
        .eq("voter_id", selectedMemberId)
        .then(({ data }) => {
          if (data && data.length > 0) {
            setHasAlreadyVoted(true);
          } else {
            setHasAlreadyVoted(false);
          }
        });
    }
  }, [selectedEditionId, selectedMemberId]);

  // Drag & drop handlers
  const handleDragEnd = (questionId: number) => (result: DropResult) => {
    if (!result.destination) return;
    setRankings(prev => {
      const reordered = Array.from(prev[questionId]);
      const [removed] = reordered.splice(result.source.index, 1);
      reordered.splice(result.destination.index, 0, removed);
      return { ...prev, [questionId]: reordered };
    });
  };

  // Soumission du classement
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Confirmation
    if (!window.confirm("Êtes-vous sûr de votre classement ? Vous ne pourrez plus modifier vos votes après validation.")) {
      return;
    }

    if (!selectedEditionId || !selectedMemberId) {
      setError("Identité manquante. Merci de vous identifier.");
      return;
    }
    if (questions.length === 0) {
      setError("Aucune question liée à cette édition.");
      return;
    }

    // Vérifier que tous les classements sont faits
    for (const q of questions) {
      if (!rankings[q.id] || rankings[q.id].length !== membersToRank.length) {
        setError("Merci de classer tous les membres pour chaque question.");
        return;
      }
    }

    // Double check : empêche double vote même si la vérif useEffect a échoué
    const { data: already, error: alreadyError } = await supabase
      .from("votes")
      .select("id")
      .eq("edition_id", selectedEditionId)
      .eq("voter_id", selectedMemberId);

    if (already && already.length > 0) {
      setHasAlreadyVoted(true);
      setError("Vous avez déjà voté pour cette édition.");
      return;
    }

    // Construire le tableau d'inserts
    let inserts: any[] = [];
    questions.forEach(q => {
      if (!Array.isArray(rankings[q.id])) return;
      rankings[q.id].forEach((member, idx) => {
        inserts.push({
          edition_id: selectedEditionId,
          question_id: q.id,
          voter_id: selectedMemberId,
          ranking: idx + 1
        });
      });
    });

    if (!Array.isArray(inserts) || inserts.length === 0) {
      setError("Aucun vote à enregistrer (bug d'initialisation du classement ?)");
      return;
    }

    const { error: insertError } = await supabase.from("votes").insert(inserts);

    if (insertError) {
      setError("Erreur lors de l'enregistrement du vote : " + insertError.message);
    } else {
      setSubmitted(true);
    }
  };

  // Affichage du nom du votant pour confirmation
  const memberName = members.find(m => m.id === selectedMemberId)?.name || "";

  if (hasAlreadyVoted) {
    return (
      <div style={{ padding: 32 }}>
        <h2>Vous avez déjà voté pour cette édition.<br />Il n'est pas possible de voter une seconde fois.</h2>
      </div>
    );
  }

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
    <div style={{ padding: 32, maxWidth: 700, margin: "auto" }}>
      <h1>Classement des membres</h1>
      <p><b>Édition :</b> {editionTitle}</p>
      <p><b>Je suis :</b> {memberName}</p>
      <form onSubmit={handleSubmit}>
        {questions.map(q => (
          <div key={q.id} style={{ marginBottom: 40 }}>
            <h3>{q.text}</h3>
            <DragDropContext onDragEnd={handleDragEnd(q.id)}>
              <Droppable droppableId={`membersList-${q.id}`}>
                {(provided) => (
                  <ul
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    style={{ listStyle: "none", padding: 0 }}
                  >
                    {(rankings[q.id] || membersToRank).map((m, idx) => (
                      <Draggable key={m.id} draggableId={m.id.toString() + "-" + q.id} index={idx}>
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
          </div>
        ))}
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
