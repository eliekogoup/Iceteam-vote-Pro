import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client pour le côté navigateur (Pages Router)
export const createClient = () => {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Types pour l'authentification
export interface AuthUser {
  id: string
  email: string
  user_metadata?: {
    full_name?: string
    avatar_url?: string
  }
}

export interface Member {
  id: number
  nom: string
  prenom: string
  email: string
  groupe_id?: number
  user_id?: string // Lien vers l'utilisateur authentifié
  is_admin: boolean
  created_at?: string
}