import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { checkIsAdmin } from "../../lib/admin-utils";
import GlobalNav from "../../components/GlobalNav";
import AdminNav from "../../components/AdminNav";

type SuperAdmin = {
  id: number;
  user_id: string;
  email: string;
  created_at: string;
};

type AuthUser = {
  id: string;
  email: string;
  created_at: string;
};

export default function SuperAdminsAdmin() {
  const [superAdmins, setSuperAdmins] = useState<SuperAdmin[]>([]);
  const [availableUsers, setAvailableUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedUserEmail, setSelectedUserEmail] = useState("");

  // Vérifier les droits admin
  useEffect(() => {
    async function checkAdminAccess() {
      try {
        const hasAdminAccess = await checkIsAdmin();
        setIsAdmin(hasAdminAccess);
      } catch (error) {
        console.error('❌ Erreur vérification admin:', error);
        setIsAdmin(false);
      } finally {
        setAuthLoading(false);
      }
    }
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAdmin && !authLoading) {
      loadData();
    }
  }, [isAdmin, authLoading]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadSuperAdmins(),
      loadAvailableUsers()
    ]);
    setLoading(false);
  };

  const loadSuperAdmins = async () => {
    const { data, error } = await supabase
      .from("super_admins")
      .select("*")
      .order("created_at");

    if (error) {
      console.error("Erreur lors du chargement des super-admins:", error);
    } else {
      setSuperAdmins(data || []);
    }
  };

  const loadAvailableUsers = async () => {
    const { data, error } = await supabase
      .from("auth.users")
      .select("id, email, created_at")
      .order("created_at");

    if (error) {
      console.error("Erreur lors du chargement des utilisateurs:", error);
    } else {
      setAvailableUsers(data || []);
    }
  };

  const handleAddSuperAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUserEmail) {
      alert("Veuillez sélectionner un utilisateur");
      return;
    }

    try {
      const selectedUser = availableUsers.find(u => u.email === selectedUserEmail);
      if (!selectedUser) {
        alert("Utilisateur non trouvé");
        return;
      }

      const { error } = await supabase
        .from("super_admins")
        .insert([{
          user_id: selectedUser.id,
          email: selectedUser.email
        }]);

      if (error) {
        alert("Erreur lors de l'ajout: " + error.message);
      } else {
        setSelectedUserEmail("");
        await loadSuperAdmins();
        alert("Super-admin ajouté avec succès !");
      }
    } catch (error: any) {
      alert("Erreur: " + error.message);
    }
  };

  const handleRemoveSuperAdmin = async (id: number, email: string) => {
    if (confirm(`Êtes-vous sûr de vouloir retirer les droits super-admin à ${email} ?`)) {
      const { error } = await supabase
        .from("super_admins")
        .delete()
        .eq("id", id);

      if (error) {
        alert("Erreur lors de la suppression: " + error.message);
      } else {
        await loadSuperAdmins();
        alert("Super-admin retiré avec succès !");
      }
    }
  };

  if (authLoading) {
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

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <GlobalNav />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 60px)' }}>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <div className="text-red-800 text-center">
              <h2 className="text-lg font-semibold mb-2">Accès refusé</h2>
              <p>Vous devez être administrateur pour accéder à cette page.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <AdminNav isAdmin={isAdmin} />
      
      <div className="page-container">
        <h1>🔑 Gestion des Super-Admins</h1>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="text-yellow-800 font-semibold mb-2">⚠️ Attention</h3>
          <p className="text-yellow-700">
            Les super-admins ont un accès total à l'administration même sans être dans la table membres. 
            Utilisez cette fonctionnalité avec précaution.
          </p>
        </div>

        <form onSubmit={handleAddSuperAdmin} style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h3>Ajouter un Super-Admin</h3>
          
          <div style={{ marginBottom: '16px' }}>
            <label>Utilisateur :</label>
            <select
              value={selectedUserEmail}
              onChange={e => setSelectedUserEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', marginTop: '4px' }}
            >
              <option value="">-- Choisir un utilisateur --</option>
              {availableUsers
                .filter(user => !superAdmins.some(sa => sa.user_id === user.id))
                .map(user => (
                  <option key={user.id} value={user.email}>
                    {user.email} (créé le {new Date(user.created_at).toLocaleDateString()})
                  </option>
                ))
              }
            </select>
          </div>
          
          <button type="submit" className="btn-primary">
            🔑 Ajouter Super-Admin
          </button>
        </form>

        {loading ? (
          <div className="warning">Chargement...</div>
        ) : (
          <>
            {superAdmins.length === 0 ? (
              <div className="warning">
                Aucun super-admin configuré.
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Email</th>
                    <th>Créé le</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {superAdmins.map(superAdmin => (
                    <tr key={superAdmin.id}>
                      <td>{superAdmin.id}</td>
                      <td>
                        <span style={{ color: '#22c55e', fontWeight: 'bold' }}>
                          🔑 {superAdmin.email}
                        </span>
                      </td>
                      <td>{new Date(superAdmin.created_at).toLocaleString()}</td>
                      <td>
                        <button 
                          onClick={() => handleRemoveSuperAdmin(superAdmin.id, superAdmin.email)}
                          className="btn-danger small"
                        >
                          🗑️ Retirer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </div>
  );
}