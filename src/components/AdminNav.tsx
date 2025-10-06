import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "../hooks/useAuth";
import { useSuperAdmin } from "../hooks/useSuperAdmin";

export default function AdminNav({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter();
  const { user, member, signOut } = useAuth();
  const { isSuperAdmin } = useSuperAdmin();
  
  // Un utilisateur a accès à l'admin s'il est admin normal OU super admin
  const hasAdminAccess = isAdmin || isSuperAdmin;
  
  return (
    <nav>
      <ul>
        <li>
          <Link href="/" className={router.pathname === "/" ? "active" : ""}>
            🏠 Accueil
          </Link>
        </li>
        <li>
          <Link href="/identite" className={router.pathname === "/identite" ? "active" : ""}>
            🗳️ Voter
          </Link>
        </li>
        {hasAdminAccess && (
          <li>
            <Link href="/admin" className={router.pathname.startsWith("/admin") ? "active" : ""}>
              ⚙️ Administration
            </Link>
          </li>
        )}
        
        {/* Section utilisateur */}
        {user && (
          <li className="nav-user-section">
            <div className="nav-user-info">
              <span className="nav-user-name">
                {member ? `${member.prenom} ${member.nom}` : user.email}
              </span>
              {hasAdminAccess && (
                <span className="nav-admin-badge">
                  {isSuperAdmin ? "Super Admin" : "Admin"}
                </span>
              )}
            </div>
            <button onClick={signOut} className="nav-logout-btn">
              Déconnexion
            </button>
          </li>
        )}
        
        {!user && (
          <li>
            <Link href="/auth/login" className={router.pathname === "/auth/login" ? "active" : ""}>
              🔐 Connexion
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}
