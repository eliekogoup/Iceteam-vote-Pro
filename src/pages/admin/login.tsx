import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    setLoading(false);
    if (!error) {
      router.push("/admin");
    } else {
      alert(error.message);
    }
  }

  return (
    <main style={{padding:40, maxWidth:400, margin:"auto"}}>
      <h1>Connexion Admin</h1>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          required
          onChange={e=>setEmail(e.target.value)}
          style={{width:"100%",marginBottom:10,padding:8}}
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={pass}
          required
          onChange={e=>setPass(e.target.value)}
          style={{width:"100%",marginBottom:10,padding:8}}
        />
        <button type="submit" style={{width:"100%",padding:10}} disabled={loading}>
          {loading ? "Connexion..." : "Connexion"}
        </button>
      </form>
    </main>
  );
}
