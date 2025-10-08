import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { signIn, user, member } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && member) {
      router.push('/admin')
    } else if (user && !member) {
      setError('Votre email n\'est pas associé à un membre enregistré. Contactez un administrateur.')
    }
  }, [user, member, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const { error: signInError } = await signIn(email, password)

    if (signInError) {
      if (signInError.includes('Invalid login credentials')) {
        setError('Email ou mot de passe incorrect')
      } else if (signInError.includes('Email not confirmed')) {
        setError('Veuillez confirmer votre adresse email avant de vous connecter')
      } else {
        setError(signInError)
      }
    }

    setIsLoading(false)
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>🗳️ Connexion</h1>
          <p>Connectez-vous avec votre adresse email de membre</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <span>⚠️ {error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Adresse email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
              disabled={isLoading}
            />
            <small>Utilisez l'email associé à votre compte membre</small>
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-full"
            disabled={isLoading}
          >
            {isLoading ? '🔄 Connexion...' : '🚀 Se connecter'}
          </button>
        </form>

        <div className="auth-center">
          <Link href="/forgot-password" className="link-primary">
            🔑 Mot de passe oublié ?
          </Link>
        </div>

        <div className="auth-footer">
          <p>
            <strong>⚠️ Accès limité aux membres enregistrés</strong>
          </p>
          <p>
            Seuls les membres avec une adresse email associée peuvent accéder à la plateforme.
            Contactez un administrateur si vous n'avez pas encore d'accès.
          </p>
          
          <div className="auth-links">
            <Link href="/" className="link-secondary">
              ← Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
