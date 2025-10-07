import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { checkIsAdmin } from "../lib/admin-utils";
import { useAuth } from "../hooks/useAuth";
import GlobalNav from "../components/GlobalNav";

export default function AdminTest() {
  const [adminChecks, setAdminChecks] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const { user, member, isAdmin } = useAuth();

  useEffect(() => {
    async function runTests() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        console.log('🧪 Début des tests admin pour:', user.email);

        // Test 1: Fonction checkIsAdmin
        const checkIsAdminResult = await checkIsAdmin();
        console.log('📊 checkIsAdmin():', checkIsAdminResult);

        // Test 2: Vérification super-admin
        const { data: superAdmin } = await supabase
          .from("super_admins")
          .select("*")
          .eq("user_id", user.id)
          .single();
        console.log('📊 Super-admin check:', superAdmin);

        // Test 3: Vérification membre admin
        const { data: memberAdmin } = await supabase
          .from("members")
          .select("*")
          .eq("user_id", user.id)
          .single();
        console.log('📊 Member admin check:', memberAdmin);

        setAdminChecks({
          checkIsAdminResult,
          superAdmin,
          memberAdmin,
          hookIsAdmin: isAdmin,
          user,
          member
        });
      } catch (error) {
        console.error('❌ Erreur lors des tests:', error);
      } finally {
        setLoading(false);
      }
    }

    runTests();
  }, [user, isAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <GlobalNav />
        <div className="container mx-auto p-6">
          <h1 className="text-2xl font-bold mb-4">🧪 Test des Accès Admin</h1>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <GlobalNav />
        <div className="container mx-auto p-6">
          <h1 className="text-2xl font-bold mb-4">🧪 Test des Accès Admin</h1>
          <p className="text-red-600">❌ Vous devez être connecté pour voir cette page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <GlobalNav />
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">🧪 Test des Accès Admin</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">👤 Informations Utilisateur</h2>
          <div className="space-y-2">
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>User ID:</strong> {user.id}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">🔍 Résultats des Tests</h2>
          <div className="space-y-4">
            <div className="p-4 border rounded">
              <h3 className="font-semibold">1. Hook useAuth isAdmin</h3>
              <p className={`font-bold ${isAdmin ? 'text-green-600' : 'text-red-600'}`}>
                {isAdmin ? '✅ TRUE' : '❌ FALSE'}
              </p>
            </div>
            
            <div className="p-4 border rounded">
              <h3 className="font-semibold">2. Fonction checkIsAdmin()</h3>
              <p className={`font-bold ${adminChecks.checkIsAdminResult ? 'text-green-600' : 'text-red-600'}`}>
                {adminChecks.checkIsAdminResult ? '✅ TRUE' : '❌ FALSE'}
              </p>
            </div>
            
            <div className="p-4 border rounded">
              <h3 className="font-semibold">3. Table super_admins</h3>
              <p className={`font-bold ${adminChecks.superAdmin ? 'text-green-600' : 'text-red-600'}`}>
                {adminChecks.superAdmin ? '✅ TROUVÉ' : '❌ PAS TROUVÉ'}
              </p>
              {adminChecks.superAdmin && (
                <pre className="mt-2 text-sm bg-gray-100 p-2 rounded">
                  {JSON.stringify(adminChecks.superAdmin, null, 2)}
                </pre>
              )}
            </div>
            
            <div className="p-4 border rounded">
              <h3 className="font-semibold">4. Table members (admin)</h3>
              <p className={`font-bold ${adminChecks.memberAdmin?.is_admin ? 'text-green-600' : 'text-red-600'}`}>
                {adminChecks.memberAdmin?.is_admin ? '✅ ADMIN' : '❌ PAS ADMIN'}
              </p>
              {adminChecks.memberAdmin && (
                <pre className="mt-2 text-sm bg-gray-100 p-2 rounded">
                  {JSON.stringify(adminChecks.memberAdmin, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">🎯 Statut Final</h2>
          <div className={`p-4 rounded text-center ${isAdmin ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {isAdmin ? (
              <>
                <p className="text-2xl mb-2">🎉 ACCÈS ADMIN ACCORDÉ</p>
                <p>Vous devriez pouvoir accéder à toutes les pages d'administration</p>
              </>
            ) : (
              <>
                <p className="text-2xl mb-2">🚫 ACCÈS ADMIN REFUSÉ</p>
                <p>Vérifiez votre configuration super-admin ou membre admin</p>
              </>
            )}
          </div>
          
          {isAdmin && (
            <div className="mt-4 text-center">
              <a 
                href="/admin" 
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              >
                🚀 Aller à l'Administration
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}