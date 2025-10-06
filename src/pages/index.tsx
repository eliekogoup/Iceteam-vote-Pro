import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import Link from "next/link";
import AdminNav from "../components/AdminNav";
import { getEditionsWithStatus } from "../lib/voting-utils";
import { useSuperAdmin } from "../hooks/useSuperAdmin";

interface EditionWithStatus {
  id: number;
  title: string;
  description: string | null;
  group_id: number;
  no_self_vote: boolean;
  isComplete: boolean;
  totalMembers: number;
  totalVoters: number;
  progress: number;
  userHasVoted: boolean;
  canViewResults: boolean;
}

interface VoteStats {
  pending: number;
  completed: number;
  finished: number;
  total: number;
}

export default function HomePage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [editions, setEditions] = useState<EditionWithStatus[]>([]);
  const [editionsLoading, setEditionsLoading] = useState(false);
  const [stats, setStats] = useState<VoteStats>({ pending: 0, completed: 0, finished: 0, total: 0 });
  const { isSuperAdmin } = useSuperAdmin();

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      
      // Vérifier si c'est un super admin
      if (isSuperAdmin) {
        setIsAdmin(true);
        setLoading(false);
        return;
      }
      
      // Récupérer les informations du membre (nom, prénom, etc.)
      const { data: member } = await supabase
        .from("members")
        .select("is_admin, nom, prenom, email")
        .eq("user_id", user.id)
        .single();
      
      setUserProfile(member);
      setIsAdmin(!!member?.is_admin);
      setLoading(false);
    }
    checkAdmin();
  }, [isSuperAdmin]);

  useEffect(() => {
    async function loadEditions() {
      if (!user?.email) return;
      
      setEditionsLoading(true);
      try {
        console.log('🔄 Chargement des éditions pour:', user.email);
        const editionsData = await getEditionsWithStatus(user.email);
        console.log('📊 Éditions reçues:', editionsData);
        setEditions(editionsData);
        
        // Calculer les statistiques - logique corrigée
        // Un vote est "en attente" si l'utilisateur n'a pas voté ET l'édition n'est pas terminée
        const pending = editionsData.filter(e => !e.userHasVoted && !e.isComplete).length;
        // Un vote est "effectué" si l'utilisateur a voté ET l'édition n'est pas terminée
        const completed = editionsData.filter(e => e.userHasVoted && !e.isComplete).length;
        // Un vote est "terminé" si l'édition est complète
        const finished = editionsData.filter(e => e.isComplete).length;
        const total = editionsData.length;
        
        console.log('📊 Statistiques calculées:', { pending, completed, finished, total });
        console.log('📊 Détail des éditions:', editionsData.map(e => ({
          title: e.title,
          userHasVoted: e.userHasVoted,
          canViewResults: e.canViewResults,
          isComplete: e.isComplete
        })));
        
        setStats({ pending, completed, finished, total });
      } catch (error) {
        console.error('❌ Erreur lors du chargement des éditions:', error);
        setEditions([]);
        setStats({ pending: 0, completed: 0, finished: 0, total: 0 });
      } finally {
        setEditionsLoading(false);
      }
    }

    if (user?.email) {
      loadEditions();
    }
  }, [user?.email]);

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {!loading && <AdminNav isAdmin={isAdmin} />}
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '40px',
          marginTop: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '40px'
          }}>
            <h1 style={{
              fontSize: '3rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontWeight: '800',
              margin: '0 0 16px 0'
            }}>
              🗳️ Iceteam Elipsos
            </h1>
            <p style={{ 
              fontSize: '18px', 
              color: '#6b7280',
              margin: 0
            }}>
              Bienvenue sur Ice team Awards !
            </p>
          </div>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{
                width: '50px',
                height: '50px',
                border: '4px solid #f3f4f6',
                borderTop: '4px solid #667eea',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 20px'
              }}></div>
              <p style={{ color: '#6b7280', fontSize: '16px' }}>Chargement...</p>
            </div>
          ) : (
            <>
              {user && userProfile && (
                <div style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  padding: '20px 30px',
                  borderRadius: '16px',
                  marginBottom: '40px',
                  boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.3)'
                }}>
                  <div style={{ fontSize: '18px', fontWeight: '600' }}>
                    👋 Salut <strong>{userProfile.prenom || userProfile.nom || user.email.split('@')[0]}</strong> !
                  </div>
                </div>
              )}

              {/* Statistiques de vote modernes */}
              {user && (
                <div style={{ marginBottom: '50px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '30px'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px'
                    }}>
                      📊
                    </div>
                    <h2 style={{
                      margin: 0,
                      fontSize: '24px',
                      fontWeight: '700',
                      color: '#111827'
                    }}>
                      Votre activité de vote
                    </h2>
                  </div>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: '16px'
                  }}>
                    <div style={{
                      background: 'white',
                      padding: '32px 24px',
                      borderRadius: '20px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                      textAlign: 'center',
                      border: '1px solid #f3f4f6',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      cursor: 'default'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 20px 35px -5px rgba(0, 0, 0, 0.15), 0 10px 15px -6px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)';
                    }}>
                      <div style={{ 
                        fontSize: '48px', 
                        fontWeight: '800',
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        marginBottom: '12px'
                      }}>
                        {stats.pending}
                      </div>
                      <div style={{ 
                        color: '#6b7280', 
                        fontSize: '14px',
                        fontWeight: '500',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Votes en attente
                      </div>
                    </div>
                    
                    <div style={{
                      background: 'white',
                      padding: '32px 24px',
                      borderRadius: '20px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                      textAlign: 'center',
                      border: '1px solid #f3f4f6',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      cursor: 'default'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 20px 35px -5px rgba(0, 0, 0, 0.15), 0 10px 15px -6px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)';
                    }}>
                      <div style={{ 
                        fontSize: '48px', 
                        fontWeight: '800',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        marginBottom: '12px'
                      }}>
                        {stats.completed}
                      </div>
                      <div style={{ 
                        color: '#6b7280', 
                        fontSize: '14px',
                        fontWeight: '500',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Votes effectués
                      </div>
                    </div>
                    
                    <div style={{
                      background: 'white',
                      padding: '32px 24px',
                      borderRadius: '20px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                      textAlign: 'center',
                      border: '1px solid #f3f4f6',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      cursor: 'default'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 20px 35px -5px rgba(0, 0, 0, 0.15), 0 10px 15px -6px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)';
                    }}>
                      <div style={{ 
                        fontSize: '48px', 
                        fontWeight: '800',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        marginBottom: '12px'
                      }}>
                        {stats.finished}
                      </div>
                      <div style={{ 
                        color: '#6b7280', 
                        fontSize: '14px',
                        fontWeight: '500',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Votes terminés
                      </div>
                    </div>
                    
                    <div style={{
                      background: 'white',
                      padding: '32px 24px',
                      borderRadius: '20px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                      textAlign: 'center',
                      border: '1px solid #f3f4f6',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      cursor: 'default'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 20px 35px -5px rgba(0, 0, 0, 0.15), 0 10px 15px -6px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)';
                    }}>
                      <div style={{ 
                        fontSize: '48px', 
                        fontWeight: '800',
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        marginBottom: '12px'
                      }}>
                        {stats.total}
                      </div>
                      <div style={{ 
                        color: '#6b7280', 
                        fontSize: '14px',
                        fontWeight: '500',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Total éditions
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Éditions de vote modernes */}
              {user && (
                <div style={{ marginTop: '50px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '30px'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px'
                    }}>
                      📊
                    </div>
                    <h2 style={{
                      margin: 0,
                      fontSize: '24px',
                      fontWeight: '700',
                      color: '#111827'
                    }}>
                      Éditions de vote disponibles
                    </h2>
                  </div>
                  
                  {editionsLoading ? (
                    <div style={{ textAlign: 'center', padding: '60px' }}>
                      <div style={{
                        width: '50px',
                        height: '50px',
                        border: '4px solid #f3f4f6',
                        borderTop: '4px solid #8b5cf6',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 20px'
                      }}></div>
                      <p style={{ color: '#6b7280', fontSize: '16px' }}>Chargement des éditions...</p>
                    </div>
                  ) : editions.length > 0 ? (
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 400px))', 
                      gap: '20px',
                      justifyContent: 'center'
                    }}>
                      {editions.map((edition) => {
                        const canVote = !edition.userHasVoted && !edition.isComplete;
                        
                        return (
                          <div key={edition.id} style={{
                            background: 'white',
                            padding: '24px',
                            borderRadius: '20px',
                            border: canVote ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                            transition: 'all 0.3s ease',
                            position: 'relative',
                            overflow: 'hidden'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-5px)';
                            e.currentTarget.style.boxShadow = '0 20px 35px -5px rgba(0, 0, 0, 0.15), 0 10px 15px -6px rgba(0, 0, 0, 0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)';
                          }}>
                            
                            {/* Effet de fond pour les votes disponibles */}
                            {canVote && (
                              <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '4px',
                                background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #3b82f6)',
                                backgroundSize: '200% 100%',
                                animation: 'gradient 3s ease infinite'
                              }}></div>
                            )}
                            
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              marginBottom: '20px'
                            }}>
                              <h3 style={{ 
                                margin: 0, 
                                fontSize: '20px', 
                                fontWeight: '700',
                                color: '#111827',
                                lineHeight: '1.3'
                              }}>
                                {edition.title}
                              </h3>
                              <div style={{
                                background: edition.isComplete ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 
                                          edition.userHasVoted ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : 
                                          canVote ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 
                                          'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                                color: 'white',
                                padding: '6px 14px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                              }}>
                                {edition.isComplete ? '✅ Terminé' : 
                                 edition.userHasVoted ? '✓ Voté' : 
                                 canVote ? '🗳️ En cours' : '❌ Non disponible'}
                              </div>
                            </div>
                            
                            <div style={{ marginBottom: '24px' }}>
                              <div style={{ 
                                color: '#6b7280', 
                                fontSize: '14px', 
                                fontWeight: '500',
                                marginBottom: '8px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                              }}>
                                Édition de vote
                              </div>
                              <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px',
                                color: '#374151',
                                fontSize: '15px',
                                marginBottom: '20px',
                                fontWeight: '500'
                              }}>
                                <span style={{ fontSize: '16px' }}>💎</span>
                                {edition.description ? (
                                  edition.description
                                ) : (
                                  `Édition #${edition.id} • ${edition.no_self_vote ? 'Sans auto-vote' : `Groupe ${edition.group_id}`}`
                                )}
                              </div>
                              
                              <div style={{ marginBottom: '12px' }}>
                                <div style={{ 
                                  color: '#6b7280', 
                                  fontSize: '12px', 
                                  fontWeight: '500',
                                  marginBottom: '8px',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px'
                                }}>
                                  Participation
                                </div>
                                <div style={{ 
                                  fontSize: '16px', 
                                  fontWeight: '600',
                                  color: '#111827',
                                  marginBottom: '8px'
                                }}>
                                  {edition.totalVoters} / {edition.totalMembers} votes ({edition.progress.toFixed(0)}%)
                                </div>
                              </div>
                              
                              <div style={{
                                width: '100%',
                                height: '8px',
                                backgroundColor: '#f3f4f6',
                                borderRadius: '20px',
                                overflow: 'hidden',
                                position: 'relative'
                              }}>
                                <div style={{
                                  width: `${edition.progress}%`,
                                  height: '100%',
                                  background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                                  borderRadius: '20px',
                                  transition: 'width 0.5s ease',
                                  position: 'relative'
                                }}>
                                  <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                                    animation: edition.progress > 0 ? 'shimmer 2s infinite' : 'none'
                                  }}></div>
                                </div>
                              </div>
                            </div>
                            
                            
                            {/* Boutons d'actions selon l'état */}
                            <div style={{ 
                              display: 'flex', 
                              gap: '12px', 
                              marginTop: '20px',
                              flexWrap: 'wrap'
                            }}>
                              {canVote && (
                                <Link 
                                  href={`/vote?edition=${edition.id}`}
                                  style={{ 
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '10px 16px',
                                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                    color: 'white',
                                    textDecoration: 'none',
                                    borderRadius: '10px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    boxShadow: '0 3px 6px -1px rgba(0, 0, 0, 0.1)',
                                    transition: 'all 0.2s ease',
                                    flex: '1',
                                    justifyContent: 'center'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 6px 10px -1px rgba(0, 0, 0, 0.15)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 3px 6px -1px rgba(0, 0, 0, 0.1)';
                                  }}
                                >
                                  🗳️ Voter
                                </Link>
                              )}
                              
                              {(edition.userHasVoted || edition.isComplete) && (
                                <Link 
                                  href={`/results/${edition.id}`}
                                  style={{ 
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '10px 16px',
                                    background: edition.isComplete ? 
                                      'linear-gradient(135deg, #10b981 0%, #059669 100%)' :
                                      'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                    color: 'white',
                                    textDecoration: 'none',
                                    borderRadius: '10px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    boxShadow: '0 3px 6px -1px rgba(0, 0, 0, 0.1)',
                                    transition: 'all 0.2s ease',
                                    flex: '1',
                                    justifyContent: 'center'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 6px 10px -1px rgba(0, 0, 0, 0.15)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 3px 6px -1px rgba(0, 0, 0, 0.1)';
                                  }}
                                >
                                  📊 Résultats
                                </Link>
                              )}
                              
                              {!canVote && !edition.userHasVoted && !edition.isComplete && (
                                <div style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  padding: '10px 16px',
                                  background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                                  color: 'white',
                                  borderRadius: '10px',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  flex: '1',
                                  justifyContent: 'center'
                                }}>
                                  ⏸️ Non disponible
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '60px 40px',
                      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                      borderRadius: '20px',
                      border: '2px dashed #cbd5e1'
                    }}>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                      <p style={{ 
                        color: '#64748b', 
                        fontSize: '18px',
                        fontWeight: '500',
                        margin: 0
                      }}>
                        Aucune édition de vote disponible pour le moment.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {!user && (
                <div style={{
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                  color: 'white',
                  padding: '20px 30px',
                  borderRadius: '16px',
                  textAlign: 'center',
                  boxShadow: '0 10px 25px -5px rgba(251, 191, 36, 0.3)'
                }}>
                  <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                    ⚠️ Connexion requise
                  </div>
                  <div style={{ fontSize: '14px', opacity: '0.9' }}>
                    Vous n'êtes pas connecté. <Link href="/login" style={{ color: 'white', textDecoration: 'underline' }}>Se connecter</Link>
                  </div>
                </div>
              )}

              {/* Actions principales modernes (si pas connecté ou actions secondaires) */}
              {(!user || isAdmin) && (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '24px', 
                  marginTop: '50px' 
                }}>
                  {!user && (
                    <>
                      <div style={{
                        background: 'white',
                        padding: '32px 24px',
                        borderRadius: '20px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                        textAlign: 'center',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-8px)';
                        e.currentTarget.style.boxShadow = '0 20px 35px -5px rgba(0, 0, 0, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1)';
                      }}>
                        <Link href="/identite" style={{ textDecoration: 'none', color: 'inherit' }}>
                          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗳️</div>
                          <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                            Commencer à voter
                          </div>
                          <p style={{ 
                            color: '#6b7280', 
                            fontSize: '14px', 
                            margin: 0,
                            lineHeight: '1.4'
                          }}>
                            Participer aux votes en cours
                          </p>
                        </Link>
                      </div>
                      
                      <div style={{
                        background: 'white',
                        padding: '32px 24px',
                        borderRadius: '20px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                        textAlign: 'center',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-8px)';
                        e.currentTarget.style.boxShadow = '0 20px 35px -5px rgba(0, 0, 0, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1)';
                      }}>
                        <Link href="/login" style={{ textDecoration: 'none', color: 'inherit' }}>
                          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
                          <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                            Connexion
                          </div>
                          <p style={{ 
                            color: '#6b7280', 
                            fontSize: '14px', 
                            margin: 0,
                            lineHeight: '1.4'
                          }}>
                            Se connecter ou se déconnecter
                          </p>
                        </Link>
                      </div>
                    </>
                  )}
                  
                  {isAdmin && (
                    <div style={{
                      background: 'white',
                      padding: '32px 24px',
                      borderRadius: '20px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                      textAlign: 'center',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-8px)';
                      e.currentTarget.style.boxShadow = '0 20px 35px -5px rgba(0, 0, 0, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1)';
                    }}>
                      <Link href="/admin" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚙️</div>
                        <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                          Administration
                        </div>
                        <p style={{ 
                          color: '#6b7280', 
                          fontSize: '14px', 
                          margin: 0,
                          lineHeight: '1.4'
                        }}>
                          Gérer les votes et les participants
                        </p>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Styles d'animation globaux */}
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        * {
          box-sizing: border-box;
        }
        
        /* Styles responsive pour mobile et tablette */
        @media (max-width: 768px) {
          .container {
            padding: 10px !important;
          }
          
          /* Titres plus petits sur mobile */
          h1 {
            font-size: 2rem !important;
          }
          
          h2 {
            font-size: 1.5rem !important;
          }
          
          /* Cartes plus compactes sur mobile */
          .edition-card {
            padding: 20px !important;
            margin: 10px 0 !important;
          }
          
          /* Grilles responsive */
          [style*="gridTemplateColumns"] {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          
          /* Boutons adaptatifs */
          [style*="padding: '10px 16px'"] {
            padding: 8px 12px !important;
            font-size: 12px !important;
          }
          
          /* Statistiques sur mobile */
          [style*="padding: '32px 24px'"] {
            padding: 24px 16px !important;
          }
          
          /* Navigation responsive */
          .admin-nav {
            flex-wrap: wrap !important;
            gap: 8px !important;
          }
        }
        
        @media (max-width: 480px) {
          /* Très petits écrans */
          .container {
            padding: 8px !important;
          }
          
          h1 {
            font-size: 1.75rem !important;
          }
          
          /* Statistiques en colonne sur très petit écran */
          [style*="gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))'"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          
          /* Boutons pleine largeur sur petit écran */
          [style*="flex: '1'"] {
            min-width: 100% !important;
          }
        }
        
        @media (min-width: 769px) and (max-width: 1024px) {
          /* Tablettes */
          .container {
            padding: 16px !important;
          }
          
          /* Grilles optimisées pour tablette */
          [style*="gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 400px))'"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          
          [style*="gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))'"] {
            grid-template-columns: repeat(4, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
