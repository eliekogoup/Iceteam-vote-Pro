// Import React hooks nécessaires
import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
export async function checkIsAdmin(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return false;
    }

    // 1. Vérifier d'abord si c'est un super-admin (via table super_admins)
    const { data: superAdmin, error: superAdminError } = await supabase
      .from("super_admins")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();
    
    if (!superAdminError && superAdmin) {
      console.log('🔑 Super-admin détecté via table super_admins:', user.email);
      return true;
    }

    // 2. Sinon, vérifier via la table members (comportement normal)
    const { data: member } = await supabase
      .from("members")
      .select("is_admin")
      .eq("user_id", user.id)
      .single();
    
    const isMemberAdmin = !!member?.is_admin;
    console.log('🔍 Vérification admin membre:', { 
      found: !!member, 
      is_admin: member?.is_admin,
      result: isMemberAdmin 
    });
    
    return isMemberAdmin;
  } catch (error) {
    console.error('Erreur lors de la vérification des droits admin:', error);
    return false;
  }
}

/**
 * Hook personnalisé pour vérifier les droits admin
 * Retourne { isAdmin, loading }
 */
export function useAdminCheck() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function check() {
      try {
        const result = await checkIsAdmin();
        setIsAdmin(result);
      } catch (error) {
        console.error('Erreur lors de la vérification admin:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }
    
    check();
  }, []);

  return { isAdmin, loading };
}