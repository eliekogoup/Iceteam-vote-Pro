import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

interface AuthUser {
  id: string
  email: string
  user_metadata?: {
    full_name?: string
    avatar_url?: string
  }
}

interface SuperAdmin {
  id: number
  user_id: string
  email: string
  created_at: string
}

interface UseSuperAdminReturn {
  user: AuthUser | null
  superAdmin: SuperAdmin | null
  isLoading: boolean
  isSuperAdmin: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

export const useSuperAdmin = (): UseSuperAdminReturn => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [superAdmin, setSuperAdmin] = useState<SuperAdmin | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Récupérer les informations du super admin
  const fetchSuperAdminData = async (authUserId: string, email: string) => {
    try {
      console.log('🔍 Recherche super admin avec authUserId:', authUserId, 'email:', email)
      
      const { data, error } = await supabase
        .from('super_admins')
        .select('*')
        .eq('user_id', authUserId)
        .single()

      console.log('📊 Résultat recherche super admin:', { data, error })

      if (error || !data) {
        console.log('❌ Super admin non trouvé:', error?.message)
        return null
      }

      console.log('✅ Super admin trouvé:', data)
      return data as SuperAdmin
    } catch (error) {
      console.error('Erreur lors de la récupération du super admin:', error)
      return null
    }
  }

  // Récupérer l'utilisateur actuel avec stabilisation
  const refreshUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      console.log('🔐 Auth user récupéré:', authUser)
      
      if (authUser) {
        const userData: AuthUser = {
          id: authUser.id,
          email: authUser.email!,
          user_metadata: authUser.user_metadata
        }
        
        // Éviter les re-renders inutiles
        setUser(prevUser => {
          if (prevUser?.id === userData.id) {
            return prevUser; // Pas de changement
          }
          return userData;
        });
        
        console.log('👤 User state mis à jour:', userData)

        // Récupérer les données du super admin
        const superAdminData = await fetchSuperAdminData(authUser.id, authUser.email!)
        setSuperAdmin(prevSuperAdmin => {
          if (prevSuperAdmin?.user_id === superAdminData?.user_id) {
            return prevSuperAdmin; // Pas de changement
          }
          return superAdminData;
        });
        
        console.log('👑 Super admin state mis à jour:', superAdminData)
      } else {
        console.log('❌ Aucun utilisateur authentifié')
        setUser(null)
        setSuperAdmin(null)
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error)
      setUser(null)
      setSuperAdmin(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Connexion
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error: error.message }
      }

      return {}
    } catch (error: any) {
      return { error: error.message || 'Une erreur est survenue' }
    } finally {
      setIsLoading(false)
    }
  }

  // Déconnexion
  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSuperAdmin(null)
  }

  // Écouter les changements d'authentification
  useEffect(() => {
    refreshUser()

    const subscription = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await refreshUser()
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setSuperAdmin(null)
          setIsLoading(false)
        }
      }
    )

    return () => subscription.data.subscription.unsubscribe()
  }, [])

  const isSuperAdmin = !!superAdmin
  console.log('👑 État super admin calculé:', { superAdmin, isSuperAdmin })

  return {
    user,
    superAdmin,
    isLoading,
    isSuperAdmin,
    signIn,
    signOut,
    refreshUser,
  }
}