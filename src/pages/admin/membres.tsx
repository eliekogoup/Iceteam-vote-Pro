import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

type Group = { id: number; nom: string };
type Member = { id: number; nom: string; group_id: number };

export default function MembresAdmin() {
  const [members, setMembers] = useState<Member[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [nom, setNom] = useState("");
  const [groupId, setGroupId] = useState<number | "">("");
  const [editId, setEditId] = useState<number | null>(null);

  useEffect(() => {
    fetchGroups();
    fetchMembers();
  }, []);

  async function fetchGroups() {
    const { data } = await supabase.from("groups").select("*").order("id");
    if (data) setGroups(data);
  }

  async function fetchMembers() {
    setLoading(true);
    const { data, error } = await supabase.from("members").select("*").order("id");
    if (!error && data) setMembers(data);
    setLoading(false);
  }

  async function handleAddOrEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!groupId) return;
    if (editId) {
      await supabase.from("members").update({ nom, group_id: groupId }).eq("id", editId);
    } else {
      await supabase.from("members").insert({ nom, group_id: groupId });
    }
    setNom("");
    setGroupId("");
    setEditId(null);
    fetchMembers();
  }

  function handleEdit(member: Member) {
    setEditId(member.id);
    setNom(member.nom);
    setGroupId(member.group_id);
  }

  async function handleDelete(id: number) {
    if (confirm("Supprimer ce membre ?")) {
      await supabase.from("members").delete().eq("id", id);
      fetchMembers();
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
          value={groupId}
          onChange={e => setGroupId(Number(e.target.value))}
          required
        >
          <option value="">-- Choisir un groupe --</option>
          {groups.map(group => (
            <option key={group.id} value={group.id}>
              {group.nom}
            </option>
          ))}
        </select>
        <button type="submit">{editId ? "Modifier" : "Ajouter"}</button>
        {editId && <button onClick={() => { setEditId(null); setNom(""); setGroupId(""); }}>Annuler</button>}
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
            {members.map(member => (
              <tr key={member.id}>
                <td>{member.id}</td>
                <td>{member.nom}</td>
                <td>
                  {groups.find(g => g.id === member.group_id)?.nom || "?"}
                </td>
                <td>
                  <button onClick={() => handleEdit(member)}>Editer</button>
                  <button onClick={() => handleDelete(member.id)} style={{ color: "red" }}>Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
