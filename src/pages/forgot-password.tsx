import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '../lib/supabaseClient'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    // Vérifier si l'email correspond à un membre enregistré
    const { data: member } = await supabase
      .from('members')
      .select('email, nom, prenom')
      .eq('email', email.toLowerCase())
      .single()

    if (!member) {
      setError('Cette adresse email n\'est pas associée à un membre enregistré.')
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      setSuccess(
        `Un email de réinitialisation a été envoyé à ${email}. ` +
        'Vérifiez votre boîte de réception et cliquez sur le lien pour réinitialiser votre mot de passe.'
      )
    } catch (error: any) {
      setError('Erreur lors de l\'envoi de l\'email : ' + error.message)
    }

    setIsLoading(false)
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>🔑 Mot de passe oublié</h1>
          <p>Saisissez votre adresse email pour recevoir un lien de réinitialisation</p>
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

        {!success && (
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

            <button 
              type="submit" 
              className="btn btn-primary btn-full"
              disabled={isLoading}
            >
              {isLoading ? '📧 Envoi en cours...' : '📧 Envoyer le lien'}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <div className="auth-links">
            <Link href="/login" className="link-secondary">
              ← Retour à la connexion
            </Link>
            <Link href="/" className="link-secondary">
              Accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}