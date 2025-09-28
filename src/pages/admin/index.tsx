import { useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";

export default function AdminDashboard() {
  const router = useRouter();

  useEffect(() => {
    // Vérifier la session Supabase (user connecté)
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/login");
      }
      // Ici, on pourrait aussi vérifier le rôle (admin) si besoin
    };
    checkSession();
  }, [router]);

  // Gestion de la déconnexion
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div style={{ padding: 32 }}>
      <h1>Administration IceTeam Vote</h1>
      <ul>
        <li>
          <a href="/admin/editions">Gérer les éditions</a>
        </li>
        <li>
          <a href="/admin/editions-questions">Lier questions & éditions</a>
        </li>
        <li>
          <a href="/admin/groupes">Gérer les groupes</a>
        </li>
        <li>
          <a href="/admin/membres">Gérer les membres</a>
        </li>
        <li>
          <a href="/admin/questions">Gérer les questions</a>
        </li>
        <li>
          <a href="/admin/votes">Voir les votes</a>
        </li>
      </ul>
      <button onClick={handleLogout}>Déconnexion</button>
    </div>
  );
}
