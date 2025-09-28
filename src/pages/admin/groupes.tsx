import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";

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
      await supabase.from("groups").update({ name }).eq("id", editId);
    } else {
      // Ajout
      await supabase.from("groups").insert({ name });
    }
    setName("");
    setEditId(null);
    fetchGroups();
  }

  function handleEdit(group: Group) {
    setEditId(group.id);
    setName(group.name);
  }

  async function handleDelete(id: number) {
    if (confirm("Supprimer ce groupe ?")) {
      await supabase.from("groups").delete().eq("id", id);
      fetchGroups();
    }
  }

  return (
    <div style={{ padding: 32 }}>
      <button onClick={() => router.push("/admin")}>← Retour à l'administration</button>
      <h2>Gestion des Groupes</h2>
      <form onSubmit={handleAddOrEdit} style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Nom du groupe"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <button type="submit">{editId ? "Modifier" : "Ajouter"}</button>
        {editId && <button type="button" onClick={() => { setEditId(null); setName(""); }}>Annuler</button>}
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
                <td>{group.name}</td>
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
