import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '../lib/supabaseClient'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isValidSession, setIsValidSession] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Vérifier si nous avons une session valide pour la réinitialisation
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        setIsValidSession(true)
      } else {
        setError('Lien de réinitialisation invalide ou expiré. Veuillez demander un nouveau lien.')
      }
    }

    checkSession()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Validation du mot de passe
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      setSuccess('Mot de passe mis à jour avec succès ! Vous allez être redirigé vers la page de connexion.')
      
      // Redirection après 3 secondes
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (error: any) {
      setError('Erreur lors de la mise à jour : ' + error.message)
    }

    setIsLoading(false)
  }

  if (!isValidSession && !error) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="loading-spinner">Vérification du lien...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>🔒 Nouveau mot de passe</h1>
          <p>Choisissez un nouveau mot de passe sécurisé</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <span>⚠️ {error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <span>✅ {success}</span>
          </div>
        )}

        {isValidSession && !success && (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="password">Nouveau mot de passe</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isLoading}
                minLength={6}
              />
              <small>Au moins 6 caractères</small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isLoading}
                minLength={6}
              />
              <small>Ressaisissez le même mot de passe</small>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-full"
              disabled={isLoading}
            >
              {isLoading ? '🔄 Mise à jour...' : '💾 Mettre à jour le mot de passe'}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <div className="auth-links">
            <Link href="/login" className="link-secondary">
              ← Retour à la connexion
            </Link>
            <Link href="/forgot-password" className="link-secondary">
              Demander un nouveau lien
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}