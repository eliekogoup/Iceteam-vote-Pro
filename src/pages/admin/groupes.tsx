import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

type Groupe = {
  id: number;
  nom: string;
};

export default function GroupesAdmin() {
  const [groupes, setGroupes] = useState<Groupe[]>([]);
  const [loading, setLoading] = useState(true);
  const [nom, setNom] = useState("");
  const [editId, setEditId] = useState<number | null>(null);

  useEffect(() => {
    fetchGroupes();
  }, []);

  async function fetchGroupes() {
    setLoading(true);
    const { data, error } = await supabase.from("groupes").select("*").order("id");
    if (!error && data) setGroupes(data);
    setLoading(false);
  }

  async function handleAddOrEdit(e: React.FormEvent) {
    e.preventDefault();
    if (editId) {
      // Mise à jour
      await supabase.from("groupes").update({ nom }).eq("id", editId);
    } else {
      // Ajout
      await supabase.from("groupes").insert({ nom });
    }
    setNom("");
    setEditId(null);
    fetchGroupes();
  }

  function handleEdit(groupe: Groupe) {
    setEditId(groupe.id);
    setNom(groupe.nom);
  }

  async function handleDelete(id: number) {
    if (confirm("Supprimer ce groupe ?")) {
      await supabase.from("groupes").delete().eq("id", id);
      fetchGroupes();
    }
  }

  return (
    <div style={{ padding: 32 }}>
      <h2>Gestion des Groupes</h2>
      <form onSubmit={handleAddOrEdit} style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Nom du groupe"
          value={nom}
          onChange={e => setNom(e.target.value)}
          required
        />
        <button type="submit">{editId ? "Modifier" : "Ajouter"}</button>
        {editId && <button onClick={() => { setEditId(null); setNom(""); }}>Annuler</button>}
      </form>
      {loading ? (
        <p>Chargement...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {groupes.map(groupe => (
              <tr key={groupe.id}>
                <td>{groupe.id}</td>
                <td>{groupe.nom}</td>
                <td>
                  <button onClick={() => handleEdit(groupe)}>Editer</button>
                  <button onClick={() => handleDelete(groupe.id)} style={{ color: "red" }}>Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
