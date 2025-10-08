import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";
import { checkIsAdmin } from '../../lib/admin-utils';
import { deleteMemberSafely, handleSecureDeletion } from '../../lib/secure-deletion';
import GlobalNav from "../../components/GlobalNav";
import AdminNav from "../../components/AdminNav";
import dynamic from 'next/dynamic'
import { clientCache } from '../../lib/client-cache';
import { perf } from '../../lib/perf';

type Group = { id: number; name: string };
type Member = {
  id: number;
  name?: string;
  nom?: string;
  prenom?: string;
  email?: string;
  group_id: number; // Gardé pour compatibilité
  groups?: Group[]; // Nouveau: pour les groupes multiples
  user_id?: string;
  is_admin: boolean;
  created_at?: string;
};

export default function MembresAdmin() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [page, setPage] = useState(0);
  const [limit] = useState(100);
  const MembersVirtualList = dynamic(() => import('../../components/MembersVirtualList'), { ssr: false })
  const [groups, setGroups] = useState<Group[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [newMember, setNewMember] = useState({
    nom: "",
    prenom: "",
    email: "",
    name: "",
    group_id: 0, // Sera mis à jour automatiquement avec le premier groupe disponible
    group_ids: [] as number[], // Nouveau: pour les groupes multiples
    is_admin: false
  });

  // Vérifier les droits admin avec la nouvelle logique
  useEffect(() => {
    async function checkAdminAccess() {
      try {
        const hasAdminAccess = await checkIsAdmin();
        console.log('🔑 Vérification admin membres:', hasAdminAccess);
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
    async function loadData() {
      if (isAdmin) {
        // Charger en parallèle pour optimiser la performance
        await Promise.all([loadMembers(), loadGroups()]);
      }
      setLoading(false);
    }
    if (!authLoading) {
      loadData();
    }
  }, [isAdmin, authLoading]);

  const loadMembers = async () => {
    const offset = page * limit
    perf.start('admin:loadMembers:page:' + page);
    try {
      const res = await fetch(`/api/admin/members?limit=${limit}&offset=${offset}`)
      const payload = await res.json()
      const data = payload?.data || []
      const membersWithGroups = data.map((member: any) => ({
        ...member,
        groups: member.member_groups?.map((mg: any) => mg.groups) || []
      }))
      // append page results
      setMembers(prev => page === 0 ? membersWithGroups : [...prev, ...membersWithGroups])
    } catch (error) {
      console.error('Erreur lors du chargement des membres paginés:', error)
    } finally {
      perf.end('admin:loadMembers:page:' + page);
    }
  };

  const loadGroups = async () => {
    const cacheKey = 'admin:groups:all';
    const cached = clientCache.get<any[]>(cacheKey);
    if (cached) {
      setGroups(cached);
      // update default newMember group if needed
      if (cached.length > 0) {
        setNewMember(prev => ({ ...prev, group_id: cached[0].id, group_ids: [cached[0].id] }));
      }
      return;
    }
    perf.start('admin:loadGroups');
    const { data, error } = await supabase
      .from("groups")
      .select("*")
      .order("id");
    perf.end('admin:loadGroups');

    if (error) {
      console.error("Erreur lors du chargement des groupes:", error);
      alert("Erreur lors du chargement des groupes. Assurez-vous qu'au moins un groupe existe.");
    } else {
  const groupsData = data || [];
  setGroups(groupsData);
  clientCache.set(cacheKey, groupsData, 10 * 60 * 1000); // 10min groups change rarely
      
      // Mettre à jour le groupe par défaut si des groupes existent
      if (groupsData.length > 0) {
        setNewMember(prev => ({
          ...prev,
          group_id: groupsData[0].id,
          group_ids: [groupsData[0].id]
        }));
      }
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validation: vérifier qu'il y a des groupes disponibles
      if (groups.length === 0) {
        alert("Aucun groupe disponible. Veuillez d'abord créer des groupes.");
        return;
      }

      // Validation des groupes sélectionnés
      if (newMember.group_ids.length === 0) {
        alert("Veuillez sélectionner au moins un groupe");
        return;
      }

      // Vérifier que le groupe sélectionné existe et choisir un fallback intelligent
      const selectedGroupId = newMember.group_ids[0];
      let groupExists = groups.find(g => g.id === selectedGroupId);
      
      // Si le groupe sélectionné n'existe plus, choisir automatiquement le premier disponible
      if (!groupExists && groups.length > 0) {
        const firstAvailableGroup = groups[0];
        console.log(`⚠️ Groupe ${selectedGroupId} n'existe plus, utilisation du groupe ${firstAvailableGroup.id} (${firstAvailableGroup.name})`);
        
        // Mettre à jour automatiquement la sélection
        setNewMember(prev => ({
          ...prev,
          group_id: firstAvailableGroup.id,
          group_ids: [firstAvailableGroup.id]
        }));
        
        groupExists = firstAvailableGroup;
      }
      
      if (!groupExists) {
        alert(`Aucun groupe valide disponible. Veuillez recharger la page et créer des groupes.`);
        return;
      }

      const memberData: any = {
        group_id: groupExists.id, // Utiliser le groupe validé/corrigé
        is_admin: newMember.is_admin
      };

      console.log('🔍 Groupe final utilisé:', groupExists.id, 'Nom:', groupExists.name);

      if (newMember.nom && newMember.prenom && newMember.email) {
        memberData.nom = newMember.nom;
        memberData.prenom = newMember.prenom;
        memberData.email = newMember.email;
        // Créer une valeur pour name pour éviter l'erreur de contrainte
        memberData.name = `${newMember.prenom} ${newMember.nom}`;

        // Créer automatiquement un compte utilisateur pour permettre la connexion
        try {
          const response = await fetch('/api/admin-create-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              email: newMember.email.toLowerCase(),
              password: 'temp123!' // Mot de passe temporaire
            })
          });

          const result = await response.json();
          
          if (response.ok && result.user) {
            // Associer le user_id au membre
            memberData.user_id = result.user.id;
            console.log('✅ Compte utilisateur créé:', result.user.email);
          } else {
            console.warn('⚠️ Impossible de créer le compte utilisateur:', result.error);
            // Ne pas inclure user_id si la création a échoué
            // Le membre sera créé sans compte utilisateur associé
          }
        } catch (userError) {
          console.warn('⚠️ Erreur lors de la création du compte utilisateur:', userError);
          // Ne pas inclure user_id en cas d'erreur
          // Le membre sera créé sans compte utilisateur associé
        }
      } else if (newMember.name) {
        memberData.name = newMember.name;
      } else {
        alert("Veuillez remplir soit Nom+Prénom+Email, soit le Nom complet");
        return;
      }

      // DEBUG: Afficher les données à insérer
      console.log('📝 Données membre à insérer:', memberData);
      console.log('🔍 Colonnes à insérer:', Object.keys(memberData));
      console.log('🎯 Valeurs à insérer:', Object.values(memberData));

      // Insérer le membre
      console.log('🚀 Tentative d\'insertion dans la table members...');
      const { data: insertedMember, error: memberError } = await supabase
        .from("members")
        .insert([memberData])
        .select()
        .single();

      if (memberError) {
        console.error('❌ Erreur détaillée insertion membre:', memberError);
        console.error('📊 Code erreur:', memberError.code);
        console.error('📋 Détails:', memberError.details);
        console.error('💡 Hint:', memberError.hint);
        console.error('🔍 Message complet:', JSON.stringify(memberError, null, 2));
        
        // Afficher aussi les données qui ont causé l'erreur
        console.error('📋 Données qui ont causé l\'erreur:', JSON.stringify(memberData, null, 2));
        
        alert("Erreur lors de l'ajout: " + memberError.message + " (Code: " + memberError.code + ")");
        return;
      }

      // Ajouter les associations avec les groupes
      const memberGroupsData = newMember.group_ids.map(groupId => ({
        member_id: insertedMember.id,
        group_id: groupId
      }));

      const { error: groupsError } = await supabase
        .from("member_groups")
        .insert(memberGroupsData);

      if (groupsError) {
        console.error("Erreur lors de l'ajout des groupes:", groupsError);
        // Le membre existe déjà, on peut continuer
      }

      resetForm();
      setShowAddForm(false);
      await loadMembers();
      
      if (newMember.email) {
        alert(`Membre ajouté avec succès !\n\n✅ Compte utilisateur créé pour ${newMember.email}\n💡 Mot de passe temporaire: temp123!\n🔄 L'utilisateur peut maintenant réinitialiser son mot de passe.`);
      } else {
        alert("Membre ajouté avec succès !");
      }
    } catch (error: any) {
      alert("Erreur: " + error.message);
    }
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingMember) return;
    
    try {
      // Validation des groupes sélectionnés
      if (newMember.group_ids.length === 0) {
        alert("Veuillez sélectionner au moins un groupe");
        return;
      }

      const memberData: any = {
        group_id: newMember.group_ids[0], // Garder le premier groupe pour compatibilité
        is_admin: newMember.is_admin
      };

      if (newMember.nom && newMember.prenom && newMember.email) {
        memberData.nom = newMember.nom;
        memberData.prenom = newMember.prenom;
        memberData.email = newMember.email;
        // Mettre à jour name aussi pour éviter les incohérences
        memberData.name = `${newMember.prenom} ${newMember.nom}`;
      } else if (newMember.name) {
        memberData.name = newMember.name;
      } else {
        alert("Veuillez remplir soit Nom+Prénom+Email, soit le Nom complet");
        return;
      }

      // Mettre à jour le membre
      const { error: memberError } = await supabase
        .from("members")
        .update(memberData)
        .eq("id", editingMember.id);

      if (memberError) {
        alert("Erreur lors de la modification: " + memberError.message);
        return;
      }

      // Supprimer les anciennes associations de groupes
      const { error: deleteError } = await supabase
        .from("member_groups")
        .delete()
        .eq("member_id", editingMember.id);

      if (deleteError) {
        console.error("Erreur lors de la suppression des groupes:", deleteError);
      }

      // Ajouter les nouvelles associations avec les groupes
      const memberGroupsData = newMember.group_ids.map(groupId => ({
        member_id: editingMember.id,
        group_id: groupId
      }));

      const { error: groupsError } = await supabase
        .from("member_groups")
        .insert(memberGroupsData);

      if (groupsError) {
        console.error("Erreur lors de l'ajout des groupes:", groupsError);
      }

      resetForm();
      setEditingMember(null);
      setShowAddForm(false);
      await loadMembers();
      alert("Membre modifié avec succès !");
    } catch (error: any) {
      alert("Erreur: " + error.message);
    }
  };

  const handleEditMember = (member: Member) => {
    setEditingMember(member);
    
    // Récupérer les IDs des groupes du membre
    const memberGroupIds = member.groups?.map(g => g.id) || (member.group_id ? [member.group_id] : []);
    
    setNewMember({
      nom: member.nom || "",
      prenom: member.prenom || "",
      email: member.email || "",
      name: member.name || "",
      group_id: member.group_id,
      group_ids: memberGroupIds,
      is_admin: member.is_admin
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setNewMember({
      nom: "",
      prenom: "",
      email: "",
      name: "",
      group_id: groups.length > 0 ? groups[0].id : 1,
      group_ids: [],
      is_admin: false
    });
  };

  const cancelEdit = () => {
    setEditingMember(null);
    resetForm();
    setShowAddForm(false);
  };

  const handleDelete = async (id: number) => {
    const memberToDelete = members.find(m => m.id === id);
    if (!memberToDelete) {
      alert('Membre introuvable');
      return;
    }

    await handleSecureDeletion(
      memberToDelete,
      'le membre',
      (member) => getDisplayName(member),
      (member) => member.id,
      deleteMemberSafely,
      () => loadMembers(), // Recharger la liste après suppression
      ['Cette action supprimera aussi tous les votes de ce membre', 'Toutes les associations de groupes seront supprimées']
    );
  };

  const getDisplayName = (member: Member) => {
    if (member.nom && member.prenom) {
      return `${member.prenom} ${member.nom}`;
    }
    return member.name || "Nom non défini";
  };

  if (authLoading || loading) {
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
        <h1>👥 Gestion des Membres</h1>
        
        {!showAddForm ? (
          <button 
            onClick={() => setShowAddForm(true)}
            className="btn-primary"
            style={{ marginBottom: '20px' }}
          >
            ➕ Ajouter un membre
          </button>
        ) : (
          <form onSubmit={editingMember ? handleUpdateMember : handleAddMember} style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h3>{editingMember ? '✏️ Modifier le membre' : 'Ajouter un nouveau membre'}</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label>Prénom :</label>
                <input
                  type="text"
                  placeholder="Prénom"
                  value={newMember.prenom}
                  onChange={e => setNewMember({...newMember, prenom: e.target.value})}
                  required
                />
              </div>
              <div>
                <label>Nom :</label>
                <input
                  type="text"
                  placeholder="Nom"
                  value={newMember.nom}
                  onChange={e => setNewMember({...newMember, nom: e.target.value})}
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label>Email :</label>
              <input
                type="email"
                placeholder="email@exemple.com"
                value={newMember.email}
                onChange={e => setNewMember({...newMember, email: e.target.value})}
                required
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label>Groupes :</label>
              <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '12px', maxHeight: '120px', overflowY: 'auto' }}>
                {groups.map(group => (
                  <div key={group.id} style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      id={`group-${group.id}`}
                      checked={newMember.group_ids.includes(group.id)}
                      onChange={e => {
                        if (e.target.checked) {
                          setNewMember({
                            ...newMember, 
                            group_ids: [...newMember.group_ids, group.id],
                            group_id: newMember.group_ids.length === 0 ? group.id : newMember.group_id // Pour compatibilité
                          });
                        } else {
                          const newGroupIds = newMember.group_ids.filter(id => id !== group.id);
                          setNewMember({
                            ...newMember, 
                            group_ids: newGroupIds,
                            group_id: newGroupIds.length > 0 ? newGroupIds[0] : group.id // Pour compatibilité
                          });
                        }
                      }}
                      style={{ marginRight: '8px' }}
                    />
                    <label htmlFor={`group-${group.id}`} style={{ margin: 0, cursor: 'pointer' }}>
                      {group.name}
                    </label>
                  </div>
                ))}
                {groups.length === 0 && (
                  <p style={{ margin: 0, color: '#666', fontStyle: 'italic' }}>Aucun groupe disponible</p>
                )}
              </div>
              {newMember.group_ids.length === 0 && (
                <p style={{ color: '#d32f2f', fontSize: '0.875rem', margin: '4px 0 0 0' }}>
                  ⚠️ Veuillez sélectionner au moins un groupe
                </p>
              )}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label>
                <input
                  type="checkbox"
                  checked={newMember.is_admin}
                  onChange={e => setNewMember({...newMember, is_admin: e.target.checked})}
                />
                {' '}Administrateur
              </label>
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn-primary">
                {editingMember ? '✏️ Modifier' : '➕ Ajouter'}
              </button>
              <button 
                type="button" 
                className="btn-secondary"
                onClick={cancelEdit}
              >
                ❌ Annuler
              </button>
            </div>
          </form>
        )}

        {members.length === 0 ? (
          <div className="warning">
            Aucun membre trouvé. Ajoutez votre premier membre ci-dessus.
          </div>
        ) : (
          // If large list, use virtualized list
          members.length > 200 ? (
            <div>
              <MembersVirtualList members={members} />
              <div style={{ marginTop: 12, textAlign: 'center' }}>
                <button onClick={() => { setPage(prev => prev + 1); loadMembers(); }} className="btn-secondary">Charger plus</button>
              </div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Groupes</th>
                  <th>Admin</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map(member => {
                  // Afficher les groupes multiples ou le groupe unique pour compatibilité
                  const memberGroups = member.groups && member.groups.length > 0 
                    ? member.groups 
                    : groups.filter(g => g.id === member.group_id);
                    
                  return (
                    <tr key={member.id}>
                      <td>{member.id}</td>
                      <td>{getDisplayName(member)}</td>
                      <td>
                        {member.email || (
                          <span style={{ color: '#999', fontStyle: 'italic' }}>
                            ⚠️ Pas d'email
                          </span>
                        )}
                      </td>
                      <td>
                        {memberGroups.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {memberGroups.map((group, index) => (
                              <span 
                                key={group.id} 
                                style={{ 
                                  backgroundColor: '#e3f2fd', 
                                  color: '#1565c0', 
                                  padding: '2px 8px', 
                                  borderRadius: '12px', 
                                  fontSize: '0.875rem',
                                  border: '1px solid #90caf9'
                                }}
                              >
                                {group.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: '#999', fontStyle: 'italic' }}>Aucun groupe</span>
                        )}
                      </td>
                      <td>
                        {member.is_admin ? (
                          <span style={{ color: '#22c55e', fontWeight: 'bold' }}>✅ Admin</span>
                        ) : (
                          <span style={{ color: '#6b7280' }}>👤 Membre</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            onClick={() => handleEditMember(member)}
                            className="btn-secondary small"
                          >
                            ✏️ Modifier
                          </button>
                          <button 
                            onClick={() => handleDelete(member.id)} 
                            className="btn-danger small"
                          >
                            🗑️ Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        )}
      </div>
    </div>
  );
}