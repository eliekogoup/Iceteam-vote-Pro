import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../hooks/useAuth";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import AdminNav from "../components/AdminNav";

type Edition = { id: number; title: string; group_id: number; no_self_vote: boolean };
type Member = { id: number; name: string; group_id: number };
type Question = { id: number; text: string };

export default function VotePage() {
  const router = useRouter();
  const { edition: editionIdParam } = router.query;
  const { user, member, isAdmin, isLoading } = useAuth();
  
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
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Initialisation avec l'utilisateur authentifié
  useEffect(() => {
    if (!user || !member) return;
    
    // Utiliser l'édition passée en paramètre ou récupérer depuis sessionStorage
    if (editionIdParam) {
      setSelectedEditionId(Number(editionIdParam));
    } else {
      const storedEditionId = sessionStorage.getItem("editionId");
      if (storedEditionId) {
        setSelectedEditionId(Number(storedEditionId));
      }
    }
    
    // Utiliser automatiquement l'ID du membre connecté
    setSelectedMemberId(member.id);
  }, [user, member, editionIdParam]);

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
        .select("id, nom, prenom, group_id")
        .eq("group_id", edition.group_id);
      if (data) {
        console.debug('fetchMembers raw:', data);
        const convertedMembers = data.map(m => ({ id: m.id, name: `${m.prenom} ${m.nom}`, group_id: m.group_id }));
        console.debug('fetchMembers converted:', convertedMembers);
        setMembers(convertedMembers);
        
        // Filtrer les membres selon les règles no_self_vote
        const filtered = edition.no_self_vote 
          ? convertedMembers.filter(m => m.id !== selectedMemberId)
          : convertedMembers;
        setMembersToRank(filtered);
      }
    };
    fetchMembers();
  }, [editions, selectedEditionId, selectedMemberId]);

  // Charger questions de l'édition
  useEffect(() => {
    if (!selectedEditionId) return;
    const fetchQuestions = async () => {
      const { data } = await supabase
        .from("editions_questions")
        .select("question_id, questions(id, text)")
        .eq("edition_id", selectedEditionId);
      if (data) {
        console.debug('fetchQuestions raw:', data);
        const questionsList = data.map(item => item.questions).filter(Boolean).flat() as Question[];
        console.debug('fetchQuestions list:', questionsList);
        setQuestions(questionsList);
      }
    };
    fetchQuestions();
  }, [selectedEditionId]);

  // Initialiser rankings quand questions et members changent
  useEffect(() => {
    if (questions.length > 0 && membersToRank.length > 0) {
      setRankings(prev => {
        const newRankings: { [questionId: number]: Member[] } = {};
        questions.forEach(q => {
          // Garder le ranking existant ou initialiser avec les membres
          newRankings[q.id] = prev[q.id] && prev[q.id].length === membersToRank.length 
            ? prev[q.id] 
            : [...membersToRank];
        });
        return newRankings;
      });
    }
  }, [questions, membersToRank]);

  // Vérifier si l'utilisateur a déjà voté
  useEffect(() => {
    if (!selectedEditionId || !selectedMemberId) return;
    const checkVote = async () => {
      const { data } = await supabase
        .from("votes")
        .select("id")
        .eq("edition_id", selectedEditionId)
        .eq("voter_id", selectedMemberId);
      if (data && data.length > 0) {
        setHasAlreadyVoted(true);
      }
    };
    checkVote();
  }, [selectedEditionId, selectedMemberId]);

  const handleDragEnd = (questionId: number) => (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(rankings[questionId] || membersToRank);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setRankings(prev => ({ ...prev, [questionId]: items }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedEditionId || !selectedMemberId) {
      setError("Données manquantes pour valider le vote.");
      return;
    }

    // Vérifier que tous les classements sont faits
    for (const q of questions) {
      if (!rankings[q.id] || rankings[q.id].length !== membersToRank.length) {
        setError("Merci de classer tous les membres pour chaque question.");
        return;
      }
    }

    // Afficher la modale de confirmation
    setShowConfirmation(true);
  };

  const confirmAndSubmitVote = async () => {
    setShowConfirmation(false);

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
          member_id: member.id,
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
  const memberName = member ? `${member.prenom} ${member.nom}` : "";
  const editionTitle = editions.find(e => e.id === selectedEditionId)?.title || "";

  if (isLoading) {
    return (
      <div className="container">
        <div className="page-container">
          <div className="loading">Chargement...</div>
        </div>
      </div>
    );
  }

  if (!user || !member) {
    return (
      <div className="container">
        <div className="page-container">
          <div className="auth-required">
            <h2>🔐 Connexion requise</h2>
            <p>Vous devez être connecté pour voter.</p>
            <Link href="/auth/login" className="btn-primary">
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (hasAlreadyVoted) {
    return (
      <div className="container">
        <AdminNav isAdmin={isAdmin} />
        <div className="page-container">
          <div className="vote-complete">
            <h1>✅ Vote déjà enregistré</h1>
            <p>Vous avez déjà voté pour cette édition.</p>
            <p>Il n'est pas possible de voter une seconde fois.</p>
            
            <div className="post-vote-actions">
              <Link href="/" className="btn-primary">
                🏠 Retour à l'accueil
              </Link>
              <Link href={`/results/${selectedEditionId}`} className="btn-secondary">
                📊 Voir les résultats
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="container">
        <AdminNav isAdmin={isAdmin} />
        <div className="page-container">
          <div className="vote-success">
            <h1>🎉 Vote enregistré avec succès !</h1>
            <p>Merci d'avoir participé au vote !</p>
            <p>Votre classement a été enregistré pour l'édition : <strong>{editionTitle}</strong></p>
            
            <div className="vote-summary">
              <h3>📋 Récapitulatif de votre participation</h3>
              <p><strong>Votant :</strong> {memberName}</p>
              <p><strong>Édition :</strong> {editionTitle}</p>
              <p><strong>Questions traitées :</strong> {questions.length}</p>
              <p><strong>Membres classés :</strong> {membersToRank.length}</p>
            </div>
            
            <div className="post-vote-navigation">
              <h3>🧭 Que souhaitez-vous faire maintenant ?</h3>
              <div className="navigation-options">
                <Link href="/" className="nav-option home">
                  <span className="option-icon">🏠</span>
                  <span className="option-title">Retour à l'accueil</span>
                  <span className="option-desc">Voir d'autres éditions de vote</span>
                </Link>
                
                <Link href={`/results/${selectedEditionId}`} className="nav-option results">
                  <span className="option-icon">📊</span>
                  <span className="option-title">Voir les résultats</span>
                  <span className="option-desc">Consulter le classement (si disponible)</span>
                </Link>
                
                {isAdmin && (
                  <Link href="/admin" className="nav-option admin">
                    <span className="option-icon">⚙️</span>
                    <span className="option-title">Administration</span>
                    <span className="option-desc">Gérer les votes et éditions</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Attente de chargement de l'identité
  if (selectedEditionId == null || selectedMemberId == null) {
    return (
      <div className="container">
        <AdminNav isAdmin={isAdmin} />
        <div className="page-container">
          <div className="loading">Chargement des informations de vote...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <AdminNav isAdmin={isAdmin} />
      <div className="page-container">
        <div className="vote-header">
          <h1>🗳️ Classement des membres</h1>
          <div className="vote-info">
            <p><strong>Édition :</strong> {editionTitle}</p>
            <p><strong>Votant :</strong> {memberName}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="vote-form">
          {questions.length > 0 && membersToRank.length === 0 && (
            <div className="info-message" style={{ marginBottom: 16 }}>
              <strong>Aucun membre à classer.</strong> Vérifiez que l'édition contient des membres dans le même groupe ou que l'option "no_self_vote" n'a pas exclu tous les participants.
            </div>
          )}
          {questions.map(q => (
            <div key={q.id} className="question-section">
              <h3 className="question-title">{q.text}</h3>
              <p className="question-instruction">
                Glissez-déposez les membres pour les classer (1er = meilleur)
              </p>
              
              <DragDropContext onDragEnd={handleDragEnd(q.id)}>
                <Droppable droppableId={`membersList-${q.id}`}>
                  {(provided) => (
                    <ul
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="members-list"
                    >
                      {((rankings[q.id] && rankings[q.id].length > 0) ? rankings[q.id] : membersToRank).map((m, idx) => (
                        <Draggable key={m.id} draggableId={m.id.toString() + "-" + q.id} index={idx}>
                          {(prov, snapshot) => (
                            <li
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              {...prov.dragHandleProps}
                              className={`member-item ${snapshot.isDragging ? 'dragging' : ''}`}
                            >
                              <span className="member-rank">#{idx + 1}</span>
                              <span className="member-name">{m.name}</span>
                              <span className="drag-indicator">⋮⋮</span>
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

          <div className="vote-actions">
            <button type="submit" className="btn-primary large">
              ✅ Valider mon classement
            </button>
            
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Modal de confirmation */}
      {showConfirmation && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirmation de vote</h3>
            <p>Êtes-vous sûr de vouloir valider vos classements ?</p>
            
            <div className="vote-summary">
              <h4>Résumé de vos classements :</h4>
              {questions.map(q => (
                <div key={q.id} className="question-summary">
                  <strong>{q.text}</strong>
                  <ol>
                    {rankings[q.id] && rankings[q.id].map((member, idx) => (
                      <li key={member.id}>
                        {member.name}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>

            <div className="modal-actions">
              <button 
                className="btn-secondary" 
                onClick={() => setShowConfirmation(false)}
              >
                Annuler
              </button>
              <button 
                className="btn-primary" 
                onClick={confirmAndSubmitVote}
              >
                Confirmer le vote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}