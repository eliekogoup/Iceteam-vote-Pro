import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

type Group = {
  id: number;
  nom: string;
};

export default function GroupesAdmin() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [nom, setNom] = useState("");
  const [editId, setEditId] = useState<number | null>(null);

  useEffect(() => {
    fetchGroups();
  }, []);

  async function fetchGroups() {
    setLoading(true);
    const { data, error } = await supabase.from("groups").select("*").order("id");
    if (!error && data) setGroups(data);
    setLoading(false);
  }

  async function handleAddOrEdit(e: React.FormEvent) {
    e.preventDefault();
    if (editId) {
      // Mise à jour
      await supabase.from("groups").update({ nom }).eq("id", editId);
    } else {
      // Ajout
      await supabase.from("groups").insert({ nom });
    }
    setNom("");
    setEditId(null);
    fetchGroups();
  }

  function handleEdit(group: Group) {
    setEditId(group.id);
    setNom(group.nom);
  }

  async function handleDelete(id: number) {
    if (confirm("Supprimer ce groupe ?")) {
      await supabase.from("groups").delete().eq("id", id);
      fetchGroups();
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
            {groups.map(group => (
              <tr key={group.id}>
                <td>{group.id}</td>
                <td>{group.nom}</td>
                <td>
                  <button onClick={() => handleEdit(group)}>Editer</button>
                  <button onClick={() => handleDelete(group.id)} style={{ color: "red" }}>Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
