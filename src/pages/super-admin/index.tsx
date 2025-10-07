import { useEffect, useState } from "react";
import { useSuperAdmin } from "../../hooks/useSuperAdmin";
import { supabase } from "../../lib/supabaseClient";
import AdminNav from "../../components/AdminNav";
import GlobalNav from "../../components/GlobalNav";
import Link from "next/link";

export default function SuperAdminDashboard() {
  const { user, isSuperAdmin, isLoading } = useSuperAdmin();
  const [stats, setStats] = useState({
    editions: 0,
    questions: 0,
    members: 0,
    votes: 0
  });

  useEffect(() => {
    if (isSuperAdmin) {
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
  }, [isSuperAdmin]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Vérification des droits d'accès...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Connexion requise</h1>
          <p className="text-gray-600 mb-6">Vous devez être connecté pour accéder à cette page.</p>
          <Link 
            href="/auth/login" 
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <GlobalNav />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 60px)' }}>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Accès refusé</h1>
            <p className="text-gray-600 mb-6">Vous devez être super administrateur pour accéder à cette page.</p>
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
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">🛡️ Super Administration</h1>
                <p className="mt-2 text-sm text-gray-600">Panneau de contrôle avancé pour la gestion complète du système</p>
              </div>
              <div className="text-sm text-green-600 bg-green-100 px-4 py-2 rounded-full font-medium">
                ✓ Super Admin
              </div>
            </div>
          </div>

          {/* Statistiques améliorées */}
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

          {/* Actions spécifiques Super Admin */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">🔧 Outils Super Admin</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link href="/admin/import-export" className="block">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="text-3xl text-white">📦</div>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-white">Import/Export</h3>
                        <p className="text-sm text-purple-100">Gérer les données en masse</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>

              <div className="bg-gradient-to-r from-red-500 to-red-600 overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="text-3xl text-white">🛠️</div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-white">Maintenance</h3>
                      <p className="text-sm text-red-100">Outils de diagnostic</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="text-3xl text-white">⚙️</div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-white">Configuration</h3>
                      <p className="text-sm text-yellow-100">Paramètres système</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions administratives standard */}
          <h2 className="text-xl font-semibold text-gray-900 mb-6">📋 Administration générale</h2>
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
                      <p className="text-sm text-gray-500">Créer et organiser les groupes</p>
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
                      <p className="text-sm text-gray-500">Ajouter et modifier les membres</p>
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
                      <p className="text-sm text-gray-500">Créer et modifier les éditions</p>
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
                      <p className="text-sm text-gray-500">Créer et modifier les questions</p>
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
                      <p className="text-sm text-gray-500">Consulter les votes détaillés</p>
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
                      <p className="text-sm text-gray-500">Consulter les résultats</p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}