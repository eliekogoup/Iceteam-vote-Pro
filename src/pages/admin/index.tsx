import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { checkIsAdmin } from "../../lib/admin-utils";
import GlobalNav from "../../components/GlobalNav";
import AdminNav from "../../components/AdminNav";
import { useSuperAdmin } from "../../hooks/useSuperAdmin";
import Link from "next/link";

export default function AdminDashboard() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    editions: 0,
    questions: 0,
    members: 0,
    votes: 0
  });
  const { isSuperAdmin } = useSuperAdmin();

  useEffect(() => {
    async function checkAccess() {
      console.log('🔍 Vérification admin dans la page dashboard...')
      try {
        const hasAdminAccess = await checkIsAdmin();
        console.log('✅ Résultat vérification admin:', hasAdminAccess)
        setIsAuthorized(hasAdminAccess);
        
        // Si autorisé, charger les statistiques
        if (hasAdminAccess) {
          await fetchStats();
        }
      } catch (error) {
        console.error('❌ Erreur lors de la vérification admin:', error);
        setIsAuthorized(false);
      } finally {
        setLoading(false);
      }
    }
    checkAccess();
  }, []);

  async function fetchStats() {
    try {
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
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <GlobalNav />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 60px)' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50">
        <GlobalNav />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 60px)' }}>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Accès refusé</h1>
            <p className="text-gray-600 mb-6">Vous devez être administrateur pour accéder à cette page.</p>
            <Link 
              href="/" 
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <GlobalNav />
      <AdminNav isAdmin={true} />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Tableau de bord administrateur</h1>
            <p className="mt-2 text-sm text-gray-600">Gérez votre système de vote et suivez les statistiques en temps réel.</p>
          </div>
          
          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">📝</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Éditions</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.editions}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">❓</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Questions</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.questions}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">👥</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Membres</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.members}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">🗳️</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Votes</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.votes}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mb-6">Actions rapides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/admin/groupes" className="block">
              <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="text-3xl">🏢</div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">Gérer les groupes</h3>
                      <p className="text-sm text-gray-500">Créer et organiser les groupes de membres</p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/admin/editions" className="block">
              <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="text-3xl">📝</div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">Gérer les éditions</h3>
                      <p className="text-sm text-gray-500">Créer et modifier les éditions de vote</p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/admin/editions-questions" className="block">
              <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="text-3xl">🔗</div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">Éditions-Questions</h3>
                      <p className="text-sm text-gray-500">Associer questions aux éditions</p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
            
            <Link href="/admin/questions" className="block">
              <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="text-3xl">❓</div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">Gérer les questions</h3>
                      <p className="text-sm text-gray-500">Créer et modifier les questions de vote</p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
            
            <Link href="/admin/membres" className="block">
              <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="text-3xl">👥</div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">Gérer les membres</h3>
                      <p className="text-sm text-gray-500">Ajouter et gérer les membres du groupe</p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/admin/import-export" className="block">
              <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="text-3xl">📤</div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">Import/Export</h3>
                      <p className="text-sm text-gray-500">Importer ou exporter des données</p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
            
            <Link href="/admin/resultats" className="block">
              <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="text-3xl">📊</div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">Voir les résultats</h3>
                      <p className="text-sm text-gray-500">Consulter les résultats des votes</p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
            
            <Link href="/admin/votes" className="block">
              <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="text-3xl">🗳️</div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">Détails des votes</h3>
                      <p className="text-sm text-gray-500">Voir les détails de tous les votes</p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
            
            {isSuperAdmin && (
              <Link href="/super-admin" className="block">
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="text-3xl">👑</div>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-white">Super Admin</h3>
                        <p className="text-sm text-yellow-100">Gestion avancée du système</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
