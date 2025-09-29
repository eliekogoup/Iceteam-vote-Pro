import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import Link from "next/link";
import AdminNav from "../components/AdminNav";

export default function HomePage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      const { data: member } = await supabase
        .from("members")
        .select("is_admin")
        .eq("user_id", user.id)
        .single();
      setIsAdmin(!!member?.is_admin);
      setLoading(false);
    }
    checkAdmin();
  }, []);

  return (
    <div>
      <h1>Accueil</h1>
      {!loading && <AdminNav isAdmin={isAdmin} />}
      <p>Bienvenue sur le portail de vote !</p>
    </div>
  );
}
