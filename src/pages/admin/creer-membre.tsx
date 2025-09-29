import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function CreerMembre() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nom, setNom] = useState("");
  const [groupeId, setGroupeId] = useState(""); // à remplacer par un <select> si tu veux afficher les groupes
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    // 1. Créer l'utilisateur via l'API route sécurisée
    const res = await fetch("/api/admin-create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const result = await res.json();

    if (!res.ok) {
      setError("Erreur création utilisateur Supabase Auth : " + result.error);
      setLoading(false);
      return;
    }

    const userId = result.user.id;

    // 2. Créer le membre dans la table "members" avec le user_id
    const { error: membreError } = await supabase.from("members").insert({
      name: nom,
      group_id: groupeId,
      user_id: userId,
    });

    if (membreError) {
      setError("Utilisateur créé mais erreur lors de la création du membre : " + membreError.message);
      setLoading(false);
      return;
    }

    setMessage("Membre créé avec succès !");
    setEmail("");
    setPassword("");
    setNom("");
    setGroupeId("");
    setLoading(false);
  };

  return (
    <div style={{ padding: 32, maxWidth: 500, margin: "auto" }}>
      <h1>Créer un nouveau membre + utilisateur</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email (identifiant) :</label>
          <input
            type="email"
            value={email}
            required
            onChange={e => setEmail(e.target.value)}
            style={{ width: "100%", marginBottom: 10 }}
          />
        </div>
        <div>
          <label>Mot de passe :</label>
          <input
            type="password"
            value={password}
            required
            onChange={e => setPassword(e.target.value)}
            style={{ width: "100%", marginBottom: 10 }}
          />
        </div>
        <div>
          <label>Nom affiché :</label>
          <input
            type="text"
            value={nom}
            required
            onChange={e => setNom(e.target.value)}
            style={{ width: "100%", marginBottom: 10 }}
          />
        </div>
        <div>
          <label>Groupe (ID) :</label>
          <input
            type="number"
            value={groupeId}
            required
            onChange={e => setGroupeId(e.target.value)}
            style={{ width: "100%", marginBottom: 10 }}
          />
          {/* Pour une vraie UX, tu peux mettre ici un <select> avec la liste des groupes */}
        </div>
        <button type="submit" style={{ marginTop: 16 }} disabled={loading}>
          {loading ? "Création..." : "Créer le membre"}
        </button>
        {error && <div style={{ color: "red", marginTop: 10 }}>{error}</div>}
        {message && <div style={{ color: "green", marginTop: 10 }}>{message}</div>}
      </form>
    </div>
  );
}
