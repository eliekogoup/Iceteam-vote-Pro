import Link from "next/link";

export default function AdminNav({ isAdmin }: { isAdmin: boolean }) {
  return (
    <nav>
      <ul style={{display: "flex", gap: 20, listStyle: "none", padding: 0}}>
        <li>
          <Link href="/">Accueil</Link>
        </li>
        {isAdmin && (
          <li>
            <Link href="/admin">Administration</Link>
          </li>
        )}
        <li>
          <Link href="/vote">Voter</Link>
        </li>
        {/* Ajoute d'autres liens ici */}
      </ul>
    </nav>
  );
}
