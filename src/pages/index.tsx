import Link from "next/link";

export default function Home() {
  return (
    <div style={{ padding: 32 }}>
      <h1>Bienvenue sur IceTeam Vote</h1>
      <ul>
        <li>
          <Link href="/identite">Voter</Link>
        </li>
        <li>
          <Link href="/resultats">Voir les résultats</Link>
        </li>
        <li>
          <Link href="/admin">Administration</Link>
        </li>
      </ul>
    </div>
  );
}
