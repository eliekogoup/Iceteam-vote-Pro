import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuth } from '../hooks/useAuth'

interface GlobalNavProps {
  className?: string
}

export default function GlobalNav({ className = '' }: GlobalNavProps) {
  const router = useRouter()
  const { user, member, isAdmin, signOut } = useAuth()

  if (!user) return null

  return (
    <nav className={`global-nav ${className}`}>
      <div className="nav-container">
        <div className="nav-left">
          <Link href="/" className={`nav-button ${router.pathname === '/' ? 'active' : ''}`}>
            🏠 Accueil
          </Link>
          
          <Link href="/vote" className={`nav-button ${router.pathname === '/vote' ? 'active' : ''}`}>
            🗳️ Voter
          </Link>
          
          {isAdmin && (
            <Link href="/admin" className={`nav-button ${router.pathname.startsWith('/admin') ? 'active' : ''}`}>
              ⚙️ Administration
            </Link>
          )}
        </div>
        
        <div className="nav-right">
          <span className="user-info">
            {member?.name || user.email}
            {isAdmin && <span className="admin-indicator">👑</span>}
          </span>
          
          <button onClick={signOut} className="nav-button logout">
            🚪 Déconnexion
          </button>
        </div>
      </div>
    </nav>
  )
}