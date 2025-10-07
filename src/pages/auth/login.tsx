import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuth } from '../../hooks/useAuth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  
  const { signIn, user, isLoading: authLoading } = useAuth()
  const router = useRouter()

  // Rediriger si déjà connecté
  useEffect(() => {
    if (user && !authLoading) {
      router.push('/')
    }
  }, [user, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setMessage('')

    if (!email || !password) {
      setError('Veuillez remplir tous les champs')
      setIsLoading(false)
      return
    }

    const { error: signInError } = await signIn(email, password)

    if (signInError) {
      if (signInError.includes('Invalid login credentials')) {
        setError('Email ou mot de passe incorrect')
      } else if (signInError.includes('Email not confirmed')) {
        setError('Veuillez confirmer votre email avant de vous connecter')
      } else {
        setError(signInError)
      }
    } else {
      setMessage('Connexion réussie !')
      // La redirection se fera automatiquement via useEffect
    }

    setIsLoading(false)
  }

  if (authLoading) {
    return (
      <div className="container">
        <div className="page-container">
          <div className="loading">Chargement...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="page-container">
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-header">
              <h1>🗳️ Iceteam Vote Pro</h1>
              <h2>Connexion</h2>
              <p>Connectez-vous pour accéder au système de vote</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              {message && (
                <div className="success-message">
                  {message}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="email">Adresse email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Mot de passe</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Votre mot de passe"
                  required
                  className="form-control"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary full-width"
              >
                {isLoading ? 'Connexion...' : 'Se connecter'}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Pas encore de compte ?{' '}
                <Link href="/register" className="auth-link">
                  Contactez un administrateur
                </Link>
              </p>
              <p>
                <Link href="/forgot-password" className="auth-link">
                  Mot de passe oublié ?
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}