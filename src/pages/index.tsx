import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: 40, textAlign: "center" }}>
      <h1>Bienvenue sur IceTeam Vote</h1>
      <p>
        <Link href="/admin">Accéder à l’administration</Link>
      </p>
      <p>
        <Link href="/vote/1">Voter sur une édition</Link>
      </p>
      <p>
        <Link href="/results/1">Voir les résultats</Link>
      </p>
    </main>
  );
}