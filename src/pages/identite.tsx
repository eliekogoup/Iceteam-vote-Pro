import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

type Edition = { id: number; title: string; group_id: number };
type Member = { id: number; name: string; group_id: number };

export default function IdentitePage() {
  const router = useRouter();
  const [editions, setEditions] = useState<Edition[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedEditionId, setSelectedEditionId] = useState<number | "">("");
  const [selectedMemberId, setSelectedMemberId] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEditions = async () => {
      const { data } = await supabase.from("editions").select("id, title, group_id").order("id");
      if (data) setEditions(data);
    };
    fetchEditions();
  }, []);

  useEffect(() => {
    if (!selectedEditionId) return;
    const edition = editions.find(e => e.id === selectedEditionId);
    if (!edition) return;
    const fetchMembers = async () => {
      const { data } = await supabase
        .from("members")
        .select("id, name, group_id")
        .eq("group_id", edition.group_id)
        .order("name");
      setMembers(data || []);
    };
    fetchMembers();
  }, [selectedEditionId, editions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!selectedEditionId || !selectedMemberId) {
      setError("Merci de sélectionner une édition et votre identité.");
      return;
    }
    // Enregistrement dans sessionStorage
    sessionStorage.setItem("editionId", String(selectedEditionId));
    sessionStorage.setItem("memberId", String(selectedMemberId));
    router.push("/vote");
  };

  return (
    <div style={{ padding: 32, maxWidth: 500, margin: "auto" }}>
      <h1>Identification</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Édition :</label>
          <select
            value={selectedEditionId}
            onChange={(e) => {
              setSelectedEditionId(Number(e.target.value));
              setSelectedMemberId("");
            }}
            required
          >
            <option value="">-- Choisir une édition --</option>
            {editions.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>
        </div>
        {selectedEditionId && (
          <div>
            <label>Je suis :</label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(Number(e.target.value))}
              required
            >
              <option value="">-- Choisir votre nom --</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <button type="submit" style={{ marginTop: 20 }}>Accéder au vote</button>
        {error && (
          <div style={{ color: "red", marginTop: 10 }}>
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
