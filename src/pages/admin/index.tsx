import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { checkIsAdmin } from "../../lib/admin-utils";
import AdminNav from "../../components/AdminNav";
import Link from "next/link";

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    editions: 0,
    questions: 0,
    members: 0,
    votes: 0
  });

  useEffect(() => {
    async function checkAdminAccess() {
      console.log('🔍 Vérification admin dans la page dashboard...')
      try {
        const hasAdminAccess = await checkIsAdmin();
        console.log('� Résultat vérification admin:', hasAdminAccess)
        setIsAdmin(hasAdminAccess);
      } catch (error) {
        console.error('❌ Erreur lors de la vérification admin:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      async function fetchStats() {
        const [editions, questions, members, votes] = await Promise.all([
          supabase.from("editions").select("id", { count: "exact" }),
          supabase.from("questions").select("id", { count: "exact" }),
          supabase.from("members").select("id", { count: "exact" }),
          supabase.from("votes").select("id", { count: "exact" })
        ]);
        
        setStats({
          editions: editions.count || 0,
          questions: questions.count || 0,
          members: members.count || 0,
          votes: votes.count || 0
        });
      }
      fetchStats();
    }
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="container">
        <div className="page-container">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div className="loading"></div>
            <p>Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container">
        <div className="page-container">
          <div className="error">
            Accès refusé. Vous devez être administrateur pour accéder à cette page.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <AdminNav isAdmin={isAdmin} />
      
      <div className="page-container">
        <h1>⚙️ Administration</h1>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <div style={{ background: '#e3f2fd', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>{stats.editions}</div>
            <div style={{ color: '#666' }}>Éditions</div>
          </div>
          <div style={{ background: '#f3e5f5', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#7b1fa2' }}>{stats.questions}</div>
            <div style={{ color: '#666' }}>Questions</div>
          </div>
          <div style={{ background: '#e8f5e8', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#388e3c' }}>{stats.members}</div>
            <div style={{ color: '#666' }}>Membres</div>
          </div>
          <div style={{ background: '#fff3e0', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f57c00' }}>{stats.votes}</div>
            <div style={{ color: '#666' }}>Votes</div>
          </div>
        </div>

        {/* Section Gestion des Éditions */}
        <div className="admin-section">
          <h2 className="admin-section-title">
            <span className="admin-section-icon">🗳️</span>
            Gestion des Éditions
          </h2>
          <div className="admin-dashboard">
            <div className="admin-card">
              <Link href="/admin/editions">
                <span style={{ fontSize: '48px', display: 'block', marginBottom: '10px' }}>�</span>
                Gestion des éditions
              </Link>
              <p style={{ color: '#666', fontSize: '14px', marginTop: '10px' }}>
                Créer et modifier les éditions de vote
              </p>
            </div>
            
            <div className="admin-card">
              <Link href="/admin/questions">
                <span style={{ fontSize: '48px', display: 'block', marginBottom: '10px' }}>❓</span>
                Gestion des questions
              </Link>
              <p style={{ color: '#666', fontSize: '14px', marginTop: '10px' }}>
                Créer et modifier les questions de vote
              </p>
            </div>
            
            <div className="admin-card">
              <Link href="/admin/editions-questions">
                <span style={{ fontSize: '48px', display: 'block', marginBottom: '10px' }}>�</span>
                Éditions/Questions
              </Link>
              <p style={{ color: '#666', fontSize: '14px', marginTop: '10px' }}>
                Associer les questions aux éditions
              </p>
            </div>
            
            <div className="admin-card">
              <Link href="/admin/resultats">
                <span style={{ fontSize: '48px', display: 'block', marginBottom: '10px' }}>🏆</span>
                Résultats et classements
              </Link>
              <p style={{ color: '#666', fontSize: '14px', marginTop: '10px' }}>
                Voir les résultats avec podiums
              </p>
            </div>
          </div>
        </div>

        {/* Section Gestion des Membres */}
        <div className="admin-section">
          <h2 className="admin-section-title">
            <span className="admin-section-icon">👥</span>
            Gestion des Membres
          </h2>
          <div className="admin-dashboard">
            <div className="admin-card">
              <Link href="/admin/membres">
                <span style={{ fontSize: '48px', display: 'block', marginBottom: '10px' }}>�</span>
                Gestion des membres
              </Link>
              <p style={{ color: '#666', fontSize: '14px', marginTop: '10px' }}>
                Ajouter et gérer les participants
              </p>
            </div>
            
            <div className="admin-card">
              <Link href="/admin/groupes">
                <span style={{ fontSize: '48px', display: 'block', marginBottom: '10px' }}>�</span>
                Gestion des groupes
              </Link>
              <p style={{ color: '#666', fontSize: '14px', marginTop: '10px' }}>
                Organiser les participants en groupes
              </p>
            </div>
            
            <div className="admin-card">
              <Link href="/admin/import-export">
                <span style={{ fontSize: '48px', display: 'block', marginBottom: '10px' }}>📥�</span>
                Import/Export CSV
              </Link>
              <p style={{ color: '#666', fontSize: '14px', marginTop: '10px' }}>
                Importer et exporter des données en CSV
              </p>
            </div>
          </div>
        </div>

        {/* Section Surveillance */}
        <div className="admin-section">
          <h2 className="admin-section-title">
            <span className="admin-section-icon">📊</span>
            Surveillance et Analyse
          </h2>
          <div className="admin-dashboard">
            <div className="admin-card">
              <Link href="/admin/votes">
                <span style={{ fontSize: '48px', display: 'block', marginBottom: '10px' }}>�</span>
                Consultation des votes
              </Link>
              <p style={{ color: '#666', fontSize: '14px', marginTop: '10px' }}>
                Visualiser et gérer tous les votes
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
