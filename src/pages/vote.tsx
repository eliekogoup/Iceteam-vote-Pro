import { useEffect, useState, useCallback, useMemo } from "react";
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
  const { editionId } = router.query;
  const { user, member, isAdmin, isLoading } = useAuth();

  const [editions, setEditions] = useState<Edition[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [rankings, setRankings] = useState<{ [questionId: number]: Member[] }>({});
  const [selectedEditionId, setSelectedEditionId] = useState<number | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAlreadyVoted, setHasAlreadyVoted] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialisation avec l'utilisateur authentifié
  useEffect(() => {
    if (!user || !member) return;

    // Utiliser l'édition passée en paramètre ou récupérer depuis sessionStorage
    if (editionId) {
      setSelectedEditionId(Number(editionId));
    } else {
      const storedEditionId = sessionStorage.getItem("editionId");
      if (storedEditionId) {
        setSelectedEditionId(Number(storedEditionId));
      }
    }

    // Utiliser automatiquement l'ID du membre connecté
    setSelectedMemberId(member.id);
  }, [user, member, editionId]);

  // ✅ OPTIMISATION: Charger toutes les données en une seule fois
  const loadAllVoteData = useCallback(async () => {
    if (!selectedEditionId || !selectedMemberId) return;
    
    setLoading(true);
    setError(null);

    try {
      // 🚀 Requêtes en parallèle au lieu de séquentielles
      const [editionsResult, questionsResult, votesResult] = await Promise.all([
        // 1. Charger les éditions
        supabase.from("editions").select("id, title, group_id, no_self_vote").order("id"),
        
        // 2. Charger questions ET membres en une seule requête optimisée
        supabase
          .from("editions_questions")
          .select(`
            question_id,
            questions(id, text),
            editions!inner(group_id, no_self_vote)
          `)
          .eq("edition_id", selectedEditionId),
        
        // 3. Vérifier si déjà voté
        supabase
          .from("votes")
          .select("id")
          .eq("edition_id", selectedEditionId)
          .eq("voter_id", selectedMemberId)
          .limit(1)
      ]);

      // Traiter les éditions
      if (editionsResult.data) {
        setEditions(editionsResult.data);
      }

      // Traiter les questions
      if (questionsResult.data && questionsResult.data.length > 0) {
        const questionsList = questionsResult.data
          .map(item => item.questions)
          .filter(Boolean)
          .flat() as Question[];
        
        setQuestions(questionsList);

        // Récupérer l'info du groupe depuis la première question
        const edition = questionsResult.data[0]?.editions;
        if (edition) {
          // 🚀 Charger les membres du groupe en parallèle
          const membersResult = await supabase
            .from("members")
            .select("id, nom, prenom, group_id")
            .eq("group_id", edition.group_id)
            .eq("is_active", true); // ✅ Optimisation: filtrer directement en DB

          if (membersResult.data) {
            const convertedMembers = membersResult.data.map(m => ({
              id: m.id,
              name: `${m.prenom} ${m.nom}`,
              group_id: m.group_id
            }));

            // Filtrer selon no_self_vote
            const membersToRank = edition.no_self_vote 
              ? convertedMembers.filter(m => m.id !== selectedMemberId)
              : convertedMembers;

            setMembers(membersToRank);

            // ✅ Initialiser rankings en une fois
            const initialRankings: { [questionId: number]: Member[] } = {};
            questionsList.forEach(q => {
              initialRankings[q.id] = [...membersToRank];
            });
            setRankings(initialRankings);
          }
        }
      }

      // Vérifier si déjà voté
      if (votesResult.data && votesResult.data.length > 0) {
        setHasAlreadyVoted(true);
      }

    } catch (err) {
      console.error('Erreur lors du chargement des données de vote:', err);
      setError('Erreur lors du chargement des données. Veuillez rafraîchir la page.');
    } finally {
      setLoading(false);
    }
  }, [selectedEditionId, selectedMemberId]);

  // ✅ Déclencher le chargement une seule fois
  useEffect(() => {
    if (selectedEditionId && selectedMemberId) {
      loadAllVoteData();
    }
  }, [selectedEditionId, selectedMemberId, loadAllVoteData]);

  // ✅ Optimisation: Mémoriser les membres filtrés
  const membersToRank = useMemo(() => {
    const edition = editions.find(e => e.id === selectedEditionId);
    if (!edition || !members.length) return members;
    
    return edition.no_self_vote 
      ? members.filter(m => m.id !== selectedMemberId)
      : members;
  }, [members, selectedEditionId, selectedMemberId, editions]);

  // ✅ Fonction drag and drop optimisée
  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;

    const questionId = parseInt(result.droppableId.replace('question-', ''));
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    setRankings(prev => {
      const newRankings = { ...prev };
      const questionRanking = [...newRankings[questionId]];
      const [removed] = questionRanking.splice(sourceIndex, 1);
      questionRanking.splice(destinationIndex, 0, removed);
      newRankings[questionId] = questionRanking;
      return newRankings;
    });
  }, []);

  // ✅ Affichage de chargement optimisé
  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Chargement des questions de vote...</p>
          <p className="text-sm text-gray-500 mt-2">Optimisation en cours...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <div className="flex items-center mb-4">
            <div className="bg-red-100 rounded-full p-2 mr-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-800">Erreur de chargement</h3>
          </div>
          <p className="text-red-700 mb-4">{error}</p>
          <button 
            onClick={() => loadAllVoteData()}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Le reste du composant reste identique...
  // [Code du rendu principal inchangé]

  return (
    <div className="min-h-screen bg-gray-50">
      {isAdmin && <AdminNav isAdmin={isAdmin} />}
      
      <div className="container mx-auto px-4 py-8">
        {hasAlreadyVoted ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-2xl mx-auto text-center">
            <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">Vote déjà enregistré</h2>
            <p className="text-green-700 mb-6">Vous avez déjà voté pour cette édition.</p>
            <Link 
              href="/" 
              className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Retour à l'accueil
            </Link>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
              Interface de vote - {questions.length} questions
            </h1>
            
            {questions.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <p className="text-yellow-800">Aucune question disponible pour cette édition.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {questions.map((question, index) => (
                  <div key={question.id} className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                      Question {index + 1}: {question.text}
                    </h3>
                    
                    <DragDropContext onDragEnd={handleDragEnd}>
                      <Droppable droppableId={`question-${question.id}`}>
                        {(provided) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="space-y-2"
                          >
                            {rankings[question.id]?.map((member, memberIndex) => (
                              <Draggable
                                key={member.id}
                                draggableId={`member-${member.id}-question-${question.id}`}
                                index={memberIndex}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-move transition-all ${
                                      snapshot.isDragging ? 'shadow-lg bg-blue-50 border-blue-300' : 'hover:bg-gray-100'
                                    }`}
                                  >
                                    <div className="flex items-center">
                                      <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                                        {memberIndex + 1}
                                      </span>
                                      <span className="text-gray-800 font-medium">{member.name}</span>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}