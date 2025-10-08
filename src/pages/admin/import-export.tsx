import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import AdminNav from "../../components/AdminNav";

export default function ImportExportPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [members, setMembers] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);

  // Vérifier les droits admin
  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      const { data: member } = await supabase
        .from("members")
        .select("is_admin")
        .eq("user_id", user.id)
        .single();
      setIsAdmin(!!member?.is_admin);
      setLoading(false);
    }
    checkAdmin();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  async function fetchData() {
    try {
      const [membersRes, groupsRes] = await Promise.all([
        supabase.from("members").select("id, name, group_id, is_admin").order("id"),
        supabase.from("groups").select("id, name").order("id")
      ]);
      
      if (membersRes.data) setMembers(membersRes.data);
      if (groupsRes.data) setGroups(groupsRes.data);
    } catch (err: any) {
      setError("Erreur lors du chargement des données");
    }
  }

  // Export des membres en CSV
  const exportMembers = () => {
    try {
      // En-têtes CSV
      const headers = ["ID", "Nom", "Groupe ID", "Nom du Groupe", "Admin"];
      
      // Données
      const csvData = members.map(member => {
        const group = groups.find(g => g.id === member.group_id);
        return [
          member.id,
          `"${member.name}"`, // Guillements pour les noms avec virgules
          member.group_id,
          `"${group?.name || ''}"`,
          member.is_admin ? "Oui" : "Non"
        ];
      });

      // Création du contenu CSV
      const csvContent = [
        headers.join(","),
        ...csvData.map(row => row.join(","))
      ].join("\n");

      // Téléchargement
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `membres_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSuccess("Export réussi !");
    } catch (err) {
      setError("Erreur lors de l'export");
    }
  };

  // Import des membres depuis CSV
  const handleImportMembers = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setSuccess("");

    try {
      const text = await file.text();
      const lines = text.split("\n").filter(line => line.trim());
      
      if (lines.length < 2) {
        setError("Le fichier CSV doit contenir au moins une ligne d'en-têtes et une ligne de données");
        return;
      }

      // Ignorer la première ligne (en-têtes)
      const dataLines = lines.slice(1);
      const newMembers = [];

      for (let i = 0; i < dataLines.length; i++) {
        const line = dataLines[i].trim();
        if (!line) continue;

        // Parse simple CSV (attention aux guillemets dans les noms)
        const columns = line.split(",").map(col => col.replace(/^"|"$/g, "").trim());
        
        if (columns.length < 3) {
          setError(`Ligne ${i + 2} : format invalide. Attendu: Nom, Groupe ID, Admin (optionnel)`);
          return;
        }

        const [name, groupIdStr, isAdminStr] = columns;
        const groupId = parseInt(groupIdStr);
        const isAdmin = isAdminStr?.toLowerCase() === "oui" || isAdminStr?.toLowerCase() === "true";

        if (isNaN(groupId)) {
          setError(`Ligne ${i + 2} : Groupe ID invalide`);
          return;
        }

        // Vérifier que le groupe existe
        const groupExists = groups.find(g => g.id === groupId);
        if (!groupExists) {
          setError(`Ligne ${i + 2} : Groupe ID ${groupId} n'existe pas`);
          return;
        }

        newMembers.push({
          name: name.trim(),
          group_id: groupId,
          is_admin: isAdmin
        });
      }

      if (newMembers.length === 0) {
        setError("Aucun membre valide trouvé dans le fichier");
        return;
      }

      // Confirmation
      if (!confirm(`Importer ${newMembers.length} membre(s) ? Cette action ajoutera de nouveaux membres sans supprimer les existants.`)) {
        return;
      }

      // Insertion en base
      const { error: insertError } = await supabase
        .from("members")
        .insert(newMembers);

      if (insertError) {
        setError("Erreur lors de l'insertion : " + insertError.message);
        return;
      }

      setSuccess(`${newMembers.length} membre(s) importé(s) avec succès !`);
      fetchData(); // Recharger les données
      
      // Reset l'input file
      event.target.value = "";
      
    } catch (err: any) {
      setError("Erreur lors de la lecture du fichier : " + err.message);
    }
  };

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
        <h1>📥📤 Import/Export CSV</h1>
        
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', marginTop: '30px' }}>
          
          {/* Section Export */}
          <div style={{ 
            background: '#f8f9fa', 
            padding: '30px', 
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            <h2>📤 Export des membres</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              Télécharger la liste de tous les membres au format CSV.
            </p>
            
            <div style={{ marginBottom: '20px' }}>
              <strong>Données exportées :</strong>
              <ul style={{ marginTop: '10px', color: '#666' }}>
                <li>ID du membre</li>
                <li>Nom</li>
                <li>ID et nom du groupe</li>
                <li>Statut administrateur</li>
              </ul>
            </div>

            <button 
              onClick={exportMembers}
              style={{ 
                background: '#28a745',
                color: 'white',
                fontSize: '16px'
              }}
            >
              📥 Télécharger CSV ({members.length} membres)
            </button>
          </div>

          {/* Section Import */}
          <div style={{ 
            background: '#f8f9fa', 
            padding: '30px', 
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            <h2>📥 Import des membres</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              Importer une liste de membres depuis un fichier CSV.
            </p>
            
            <div style={{ marginBottom: '20px' }}>
              <strong>Format attendu :</strong>
              <div style={{ 
                background: '#e9ecef', 
                padding: '10px', 
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '14px',
                marginTop: '10px'
              }}>
                Nom, Groupe ID, Admin<br />
                "Jean Dupont", 1, Non<br />
                "Marie Martin", 2, Oui
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <strong>Groupes disponibles :</strong>
              <ul style={{ marginTop: '10px', color: '#666' }}>
                {groups.map(group => (
                  <li key={group.id}>ID {group.id}: {group.name}</li>
                ))}
              </ul>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '10px' }}>
                Sélectionner un fichier CSV :
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleImportMembers}
                style={{ 
                  width: '100%',
                  padding: '12px',
                  border: '2px dashed #dee2e6',
                  borderRadius: '6px',
                  background: 'white'
                }}
              />
            </div>
          </div>
        </div>

        {/* Aperçu des données actuelles */}
        <div style={{ marginTop: '40px' }}>
          <h2>📊 Données actuelles</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            <div style={{ background: '#e3f2fd', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>{groups.length}</div>
              <div style={{ color: '#666' }}>Groupes</div>
            </div>
            <div style={{ background: '#e8f5e8', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#388e3c' }}>{members.length}</div>
              <div style={{ color: '#666' }}>Membres</div>
            </div>
            <div style={{ background: '#fff3e0', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f57c00' }}>
                {members.filter(m => m.is_admin).length}
              </div>
              <div style={{ color: '#666' }}>Admins</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}