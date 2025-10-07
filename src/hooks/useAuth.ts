import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { checkIsAdmin } from '../lib/admin-utils'

interface AuthUser {
  id: string
  email: string
  user_metadata?: {
    full_name?: string
    avatar_url?: string
  }
}

interface Group {
  id: number
  name: string
  created_at?: string
}

interface Member {
  id: number
  name: string
  nom?: string
  prenom?: string
  email?: string
  group_id?: number  // Maintenu pour compatibilité
  user_id?: string
  is_admin: boolean
  created_at?: string
  groups?: Group[]   // Nouveau : groupes multiples
}

interface UseAuthReturn {
  user: AuthUser | null
  member: Member | null
  isLoading: boolean
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [member, setMember] = useState<Member | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  // Récupérer les informations du membre depuis la base de données
  const fetchMemberData = async (authUserId: string, email: string) => {
    try {
      console.log('🔍 Recherche membre avec authUserId:', authUserId, 'email:', email)
      
      // Rechercher par user_id avec groupes associés
      let { data, error } = await supabase
        .from('members')
        .select(`
          *,
          member_groups(
            groups(*)
          )
        `)
        .eq('user_id', authUserId)
        .single()

      console.log('📊 Résultat recherche par user_id:', { data, error })

      // Si pas trouvé par user_id, essayer par email
      if (error || !data) {
        console.log('🔍 Recherche par email...')
        const { data: emailData, error: emailError } = await supabase
          .from('members')
          .select(`
            *,
            member_groups(
              groups(*)
            )
          `)
          .eq('email', email)
          .single()
        
        console.log('📊 Résultat recherche par email:', { emailData, emailError })
        
        if (emailData && !emailError) {
          // Mettre à jour le user_id pour la prochaine fois
          await supabase
            .from('members')
            .update({ user_id: authUserId })
            .eq('id', emailData.id)
          
          data = emailData
          error = emailError
        }
      }

      if (error || !data) {
        console.log('❌ Membre non trouvé:', error?.message)
        return null
      }

      console.log('✅ Données membre brutes:', data)
      
      // Transformer les données pour inclure les groupes
      const memberWithGroups: Member = {
        ...data,
        groups: data.member_groups?.map((mg: any) => mg.groups) || []
      }
      
      console.log('✅ Membre avec groupes:', memberWithGroups)
      return memberWithGroups
    } catch (error) {
      console.error('Erreur lors de la récupération du membre:', error)
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

        // Récupérer les données du membre
        const memberData = await fetchMemberData(authUser.id, authUser.email!)
        setMember(prevMember => {
          if (prevMember?.user_id === memberData?.user_id) {
            return prevMember; // Pas de changement
          }
          return memberData;
        });
        
        console.log('👥 Member state mis à jour:', memberData)
      } else {
        console.log('❌ Aucun utilisateur authentifié')
        setUser(null)
        setMember(null)
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error)
      setUser(null)
      setMember(null)
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

      await refreshUser()
      return {}
    } catch (error) {
      return { error: 'Erreur lors de la connexion' }
    }
  }

  // Inscription
  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setIsLoading(true)
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) {
        return { error: error.message }
      }

      return {}
    } catch (error) {
      return { error: 'Erreur lors de l\'inscription' }
    }
  }

  // Déconnexion
  const signOut = async () => {
    setIsLoading(true)
    await supabase.auth.signOut()
    setUser(null)
    setMember(null)
    setIsLoading(false)
  }

  // Écouter les changements d'authentification
  useEffect(() => {
    refreshUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await refreshUser()
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setMember(null)
          setIsLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Mettre à jour le statut admin quand l'utilisateur change
  useEffect(() => {
    async function updateAdminStatus() {
      if (user?.id) {
        const adminStatus = await checkIsAdmin()
        setIsAdmin(adminStatus)
        console.log('🔑 État admin mis à jour:', { user: user.email, isAdmin: adminStatus })
      } else {
        setIsAdmin(false)
      }
    }
    updateAdminStatus()
  }, [user?.id]); // Utiliser user?.id au lieu de user complet

  return {
    user,
    member,
    isLoading,
    isAdmin,
    signIn,
    signUp,
    signOut,
    refreshUser,
  }
}