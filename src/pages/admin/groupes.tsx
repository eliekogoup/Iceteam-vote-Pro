import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";
import { checkIsAdmin } from "../../lib/admin-utils";
import AdminNav from "../../components/AdminNav";

type Group = {
  id: number;
  name: string;
};

export default function GroupesAdmin() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Vérifier les droits admin avec la nouvelle logique
  useEffect(() => {
    async function checkAdminAccess() {
      try {
        const hasAdminAccess = await checkIsAdmin();
        console.log('🔑 Vérification admin groupes:', hasAdminAccess);
        setIsAdmin(hasAdminAccess);
      } catch (error) {
        console.error('❌ Erreur vérification admin:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchGroups();
    }
  }, [isAdmin]);

  async function fetchGroups() {
    setLoading(true);
    const { data, error } = await supabase.from("groups").select("*").order("id");
    if (!error && data) {
      setGroups(data);
    } else if (error) {
      setError("Erreur lors du chargement des groupes : " + error.message);
    }
    setLoading(false);
  }

  async function handleAddOrEdit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (!name.trim()) {
      setError("Le nom du groupe est requis");
      return;
    }

    try {
      if (editId) {
        // Mise à jour
        const { error } = await supabase.from("groups").update({ name: name.trim() }).eq("id", editId);
        if (error) throw error;
        setSuccess("Groupe modifié avec succès");
      } else {
        // Ajout
        const { error } = await supabase.from("groups").insert({ name: name.trim() });
        if (error) throw error;
        setSuccess("Groupe ajouté avec succès");
      }
      setName("");
      setEditId(null);
      fetchGroups();
    } catch (error: any) {
      setError("Erreur : " + error.message);
    }
  }

  function handleEdit(group: Group) {
    setEditId(group.id);
    setName(group.name);
    setError("");
    setSuccess("");
  }

  async function handleDelete(id: number) {
    const groupToDelete = groups.find(g => g.id === id);
    const groupName = groupToDelete?.name || `ID ${id}`;
    
    if (!confirm(`Supprimer le groupe "${groupName}" ?\n\n⚠️ Cette action supprimera aussi :\n- Tous les membres de ce groupe\n- Toutes les éditions de ce groupe\n- Tous les votes associés\n\nCette action est irréversible !`)) {
      return;
    }
    
    setError("");
    setSuccess("");
    
    try {
      console.log(`🗑️ Début suppression du groupe ${groupName} (ID: ${id})`);
      
      // 1. Supprimer d'abord tous les votes des éditions de ce groupe
      const { data: editions, error: editionsError } = await supabase
        .from("editions")
        .select("id")
        .eq("group_id", id);
      
      if (editionsError) {
        console.error("Erreur lors de la récupération des éditions:", editionsError);
      } else if (editions && editions.length > 0) {
        const editionIds = editions.map(e => e.id);
        console.log(`📊 Suppression des votes pour ${editionIds.length} éditions`);
        
        const { error: votesError } = await supabase
          .from("votes")
          .delete()
          .in("edition_id", editionIds);
          
        if (votesError) {
          console.error("Erreur lors de la suppression des votes:", votesError);
        }
      }
      
      // 2. Supprimer les associations membre-groupe (pour support multi-groupes)
      const { error: memberGroupsError } = await supabase
        .from("member_groups")
        .delete()
        .eq("group_id", id);
        
      if (memberGroupsError) {
        console.error("Erreur lors de la suppression des associations membre-groupe:", memberGroupsError);
        // Continuer même si erreur (compatibilité)
      }
      
      // 3. Supprimer les éditions du groupe
      const { error: deleteEditionsError } = await supabase
        .from("editions")
        .delete()
        .eq("group_id", id);
        
      if (deleteEditionsError) {
        console.error("Erreur lors de la suppression des éditions:", deleteEditionsError);
      }
      
      // 4. Mettre à jour les membres (retirer le group_id ou les supprimer)
      // Option A: Mettre group_id à NULL pour les membres de ce groupe
      const { error: updateMembersError } = await supabase
        .from("members")
        .update({ group_id: null })
        .eq("group_id", id);
        
      if (updateMembersError) {
        console.error("Erreur lors de la mise à jour des membres:", updateMembersError);
      }
      
      // 5. Enfin, supprimer le groupe
      const { error: deleteGroupError } = await supabase
        .from("groups")
        .delete()
        .eq("id", id);
        
      if (deleteGroupError) {
        throw deleteGroupError;
      }
      
      setSuccess(`Groupe "${groupName}" supprimé avec succès !`);
      fetchGroups();
      
    } catch (error: any) {
      setError("Erreur lors de la suppression : " + error.message);
      console.error("❌ Erreur complète:", error);
    }
  }

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
        <h1>👥 Gestion des Groupes</h1>
        
        <form onSubmit={handleAddOrEdit} style={{ marginBottom: '30px' }}>
          <div>
            <label>Nom du groupe :</label>
            <input
              type="text"
              placeholder="Nom du groupe"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button type="submit">
              {editId ? "✏️ Modifier" : "➕ Ajouter"}
            </button>
            {editId && (
              <button 
                type="button" 
                className="secondary"
                onClick={() => { setEditId(null); setName(""); setError(""); setSuccess(""); }}
              >
                ❌ Annuler
              </button>
            )}
          </div>
        </form>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        {groups.length === 0 ? (
          <div className="warning">
            Aucun groupe créé. Créez votre premier groupe ci-dessus.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nom du groupe</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {groups.map(group => (
                <tr key={group.id}>
                  <td>{group.id}</td>
                  <td style={{ fontWeight: editId === group.id ? 'bold' : 'normal' }}>
                    {group.name}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => handleEdit(group)}
                        className="secondary small"
                        disabled={editId === group.id}
                      >
                        ✏️ Modifier
                      </button>
                      <button 
                        onClick={() => handleDelete(group.id)} 
                        className="danger small"
                      >
                        🗑️ Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
