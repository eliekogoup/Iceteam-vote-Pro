import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";
import AdminNav from "../components/AdminNav";
import { useAuth } from "../hooks/useAuth";

type Edition = { id: number; title: string; group_id: number };
type Member = { id: number; name: string; nom?: string; prenom?: string; group_id: number };

export default function IdentitePage() {
  const router = useRouter();
  const { user, member, isAdmin, isLoading } = useAuth();
  const [editions, setEditions] = useState<Edition[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedEditionId, setSelectedEditionId] = useState<number | "">("");
  const [selectedMemberId, setSelectedMemberId] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);

  // Auto-sélectionner le membre connecté
  useEffect(() => {
    if (member) {
      setSelectedMemberId(member.id);
      console.log('✅ Membre auto-détecté:', member);
    }
  }, [member]);

  useEffect(() => {
    const fetchEditions = async () => {
      if (!member) return;
      
      // Filtrer les éditions selon le groupe du membre connecté
      const { data } = await supabase
        .from("editions")
        .select("id, title, group_id")
        .eq("group_id", member.group_id)  // Filtrer par groupe
        .order("id");
      
      if (data) {
        setEditions(data);
        console.log('📊 Éditions filtrées pour le groupe', member.group_id, ':', data);
      }
    };
    fetchEditions();
  }, [member]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Utiliser le membre connecté ou le membre sélectionné manuellement
    const finalMemberId = member ? member.id : selectedMemberId;
    
    if (!selectedEditionId || !finalMemberId) {
      setError("Merci de sélectionner une édition et votre identité.");
      return;
    }
    
    console.log('🗳️ Accès au vote:', { editionId: selectedEditionId, memberId: finalMemberId });
    
    // Enregistrement dans sessionStorage
    sessionStorage.setItem("editionId", String(selectedEditionId));
    sessionStorage.setItem("memberId", String(finalMemberId));
    router.push("/vote");
  };

  return (
    <div className="container">
      {!isLoading && <AdminNav isAdmin={isAdmin} />}
      
      <div className="page-container">
        <h1>🆔 Identification pour voter</h1>
        
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div className="loading"></div>
            <p>Chargement...</p>
          </div>
        ) : !user ? (
          <div className="auth-required">
            <p>Vous devez être connecté pour voter.</p>
            <Link href="/auth/login" className="btn-primary">Se connecter</Link>
          </div>
        ) : editions.length === 0 ? (
          <div className="warning">
            <p>Aucune édition de vote disponible pour votre groupe.</p>
            <p>Contactez un administrateur si vous pensez que c'est une erreur.</p>
          </div>
        ) : (
          <>
        <div style={{ 
          background: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '8px', 
          marginBottom: '30px',
          border: '1px solid #dee2e6'
        }}>
          {member ? (
            <p style={{ margin: 0, color: '#495057' }}>
              <strong>✅ Connecté en tant que :</strong> {member.name}
              <br />
              <strong>ℹ️ Information :</strong> Sélectionnez l'édition de vote à laquelle vous souhaitez participer.
            </p>
          ) : (
            <p style={{ margin: 0, color: '#495057' }}>
              <strong>ℹ️ Information :</strong> Sélectionnez l'édition de vote à laquelle vous souhaitez participer, 
              puis choisissez votre nom dans la liste des participants.
            </p>
          )}
        </div>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label>📋 Édition de vote :</label>
            <select
              value={selectedEditionId}
              onChange={(e) => {
                setSelectedEditionId(Number(e.target.value));
                if (!member) setSelectedMemberId(""); // Reset seulement si pas de membre auto-détecté
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
          
          {selectedEditionId && !member && (
            <div style={{ marginBottom: '30px' }}>
              <label>👤 Mon identité :</label>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(Number(e.target.value))}
                required
              >
                <option value="">-- Choisir votre nom --</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name || `${m.prenom} ${m.nom}`}
                  </option>
                ))}
              </select>
              
              {members.length === 0 && (
                <div className="warning" style={{ marginTop: '10px' }}>
                  Aucun participant trouvé pour cette édition.
                </div>
              )}
            </div>
          )}

          {/* Affichage pour membre connecté */}
          {selectedEditionId && member && (
            <div style={{ 
              marginBottom: '30px',
              background: '#d4edda',
              padding: '15px',
              borderRadius: '8px',
              border: '1px solid #c3e6cb'
            }}>
              <p style={{ margin: 0, color: '#155724' }}>
                <strong>👤 Vous votez en tant que :</strong> {member.name}
              </p>
            </div>
          )}
          
          <button 
            type="submit" 
            style={{ 
              fontSize: '18px', 
              padding: '16px 32px',
              background: '#007bff',
              color: 'white'
            }}
            disabled={!selectedEditionId || (!member && !selectedMemberId)}
          >
            🗳️ Accéder au vote
          </button>
          
          {error && (
            <div className="error" style={{ marginTop: '20px' }}>
              {error}
            </div>
          )}
        </form>

        {/* Informations supplémentaires */}
        {selectedEditionId && members.length > 0 && (
          <div style={{ 
            marginTop: '30px',
            background: '#e3f2fd',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #bbdefb'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>
              📊 Informations sur cette édition
            </h3>
            <p style={{ margin: '5px 0', color: '#495057' }}>
              <strong>Participants :</strong> {members.length} personne(s)
            </p>
            <div style={{ marginTop: '15px' }}>
              <strong>Liste des participants :</strong>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '8px', 
                marginTop: '8px' 
              }}>
                {members.map(member => (
                  <span 
                    key={member.id}
                    style={{ 
                      background: 'white',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '14px',
                      border: '1px solid #ddd'
                    }}
                  >
                    {member.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
}
