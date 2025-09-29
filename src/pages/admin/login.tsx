import { useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    // Authentification Supabase Auth
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError || !authData.user) {
      setError("Identifiants incorrects.");
      return;
    }
    // Vérification admin dans "members"
    const { data: membre, error: membreError } = await supabase
      .from("members")
      .select("is_admin")
      .eq("user_id", authData.user.id)
      .single();

    if (membreError || !membre?.is_admin) {
      setError("Vous n'êtes pas administrateur.");
      return;
    }
    // Auth OK => session admin
    sessionStorage.setItem("isAdmin", "1");
    sessionStorage.setItem("adminEmail", email);
    router.push("/admin");
  };

  return (
    <div style={{ padding: 32, maxWidth: 400, margin: "auto" }}>
      <h1>Connexion Administration</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email administrateur"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{ fontSize: 18, padding: 10, width: "100%", marginBottom: 12 }}
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{ fontSize: 18, padding: 10, width: "100%" }}
        />
        <button type="submit" style={{ marginTop: 16, width: "100%" }}>Connexion</button>
        {error && <div style={{ color: "red", marginTop: 10 }}>{error}</div>}
      </form>
    </div>
  );
}
