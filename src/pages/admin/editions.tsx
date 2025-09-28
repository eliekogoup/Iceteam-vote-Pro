import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";

type Group = { id: number; name: string };
type Edition = { id: number; title: string; group_id: number; no_self_vote: boolean };

export default function EditionsAdmin() {
  const router = useRouter();
  const [editions, setEditions] = useState<Edition[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [groupId, setGroupId] = useState<number | "">("");
  const [noSelfVote, setNoSelfVote] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  useEffect(() => {
    fetchGroups();
    fetchEditions();
  }, []);

  async function fetchGroups() {
    const { data } = await supabase.from("groups").select("*").order("id");
    if (data) setGroups(data);
  }

  async function fetchEditions() {
    setLoading(true);
    const { data, error } = await supabase.from("editions").select("*").order("id");
    if (!error && data) setEditions(data);
    setLoading(false);
  }

  async function handleAddOrEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!groupId) return;
    if (editId) {
      await supabase
        .from("editions")
        .update({ title, group_id: groupId, no_self_vote: noSelfVote })
        .eq("id", editId);
    } else {
      await supabase
        .from("editions")
        .insert({ title, group_id: groupId, no_self_vote: noSelfVote });
    }
    setTitle("");
    setGroupId("");
    setNoSelfVote(false);
    setEditId(null);
    fetchEditions();
  }

  function handleEdit(edition: Edition) {
    setEditId(edition.id);
    setTitle(edition.title);
    setGroupId(edition.group_id);
    setNoSelfVote(!!edition.no_self_vote);
  }

  async function handleDelete(id: number) {
    if (confirm("Supprimer cette édition ?")) {
      await supabase.from("editions").delete().eq("id", id);
      fetchEditions();
    }
  }

  return (
    <div style={{ padding: 32 }}>
      <button onClick={() => router.push("/admin")}>← Retour à l'administration</button>
      <h2>Gestion des Éditions</h2>
      <form onSubmit={handleAddOrEdit} style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Titre de l'édition"
          value={title}
          onChange={e => setTitle(e.target.value)}
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
              {group.name}
            </option>
          ))}
        </select>
        <label style={{ marginLeft: 10 }}>
          <input
            type="checkbox"
            checked={noSelfVote}
            onChange={e => setNoSelfVote(e.target.checked)}
          />{" "}
          Interdire l'auto-vote
        </label>
        <button type="submit" style={{ marginLeft: 10 }}>
          {editId ? "Modifier" : "Ajouter"}
        </button>
        {editId && (
          <button
            type="button"
            onClick={() => {
              setEditId(null);
              setTitle("");
              setGroupId("");
              setNoSelfVote(false);
            }}
          >
            Annuler
          </button>
        )}
      </form>
      {loading ? (
        <p>Chargement...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Titre</th>
              <th>Groupe</th>
              <th>Auto-vote interdit</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {editions.map(edition => (
              <tr key={edition.id}>
                <td>{edition.id}</td>
                <td>{edition.title}</td>
                <td>{groups.find(g => g.id === edition.group_id)?.name || "?"}</td>
                <td>{edition.no_self_vote ? "Oui" : "Non"}</td>
                <td>
                  <button onClick={() => handleEdit(edition)}>Editer</button>
                  <button
                    onClick={() => handleDelete(edition.id)}
                    style={{ color: "red" }}
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
