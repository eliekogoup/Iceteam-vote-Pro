import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

type Groupe = { id: number; nom: string };
type Membre = { id: number; nom: string; groupe_id: number };

export default function MembresAdmin() {
  const [membres, setMembres] = useState<Membre[]>([]);
  const [groupes, setGroupes] = useState<Groupe[]>([]);
  const [loading, setLoading] = useState(true);
  const [nom, setNom] = useState("");
  const [groupeId, setGroupeId] = useState<number | "">("");
  const [editId, setEditId] = useState<number | null>(null);

  useEffect(() => {
    fetchGroupes();
    fetchMembres();
  }, []);

  async function fetchGroupes() {
    const { data } = await supabase.from("groupes").select("*").order("id");
    if (data) setGroupes(data);
  }

  async function fetchMembres() {
    setLoading(true);
    const { data, error } = await supabase.from("membres").select("*").order("id");
    if (!error && data) setMembres(data);
    setLoading(false);
  }

  async function handleAddOrEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!groupeId) return;
    if (editId) {
      await supabase.from("membres").update({ nom, groupe_id: groupeId }).eq("id", editId);
    } else {
      await supabase.from("membres").insert({ nom, groupe_id: groupeId });
    }
    setNom("");
    setGroupeId("");
    setEditId(null);
    fetchMembres();
  }

  function handleEdit(membre: Membre) {
    setEditId(membre.id);
    setNom(membre.nom);
    setGroupeId(membre.groupe_id);
  }

  async function handleDelete(id: number) {
    if (confirm("Supprimer ce membre ?")) {
      await supabase.from("membres").delete().eq("id", id);
      fetchMembres();
    }
  }

  return (
    <div style={{ padding: 32 }}>
      <h2>Gestion des Membres</h2>
      <form onSubmit={handleAddOrEdit} style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Nom du membre"
          value={nom}
          onChange={e => setNom(e.target.value)}
          required
        />
        <select
          value={groupeId}
          onChange={e => setGroupeId(Number(e.target.value))}
          required
        >
          <option value="">-- Choisir un groupe --</option>
          {groupes.map(groupe => (
            <option key={groupe.id} value={groupe.id}>
              {groupe.nom}
            </option>
          ))}
        </select>
        <button type="submit">{editId ? "Modifier" : "Ajouter"}</button>
        {editId && <button onClick={() => { setEditId(null); setNom(""); setGroupeId(""); }}>Annuler</button>}
      </form>
      {loading ? (
        <p>Chargement...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom</th>
              <th>Groupe</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {membres.map(membre => (
              <tr key={membre.id}>
                <td>{membre.id}</td>
                <td>{membre.nom}</td>
                <td>
                  {groupes.find(g => g.id === membre.groupe_id)?.nom || "?"}
                </td>
                <td>
                  <button onClick={() => handleEdit(membre)}>Editer</button>
                  <button onClick={() => handleDelete(membre.id)} style={{ color: "red" }}>Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
