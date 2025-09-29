import Link from "next/link";

export default function AdminDashboard() {
  return (
    <div style={{ padding: 32, maxWidth: 600, margin: "auto" }}>
      <h1>Administration</h1>
      <ul style={{ fontSize: 18, lineHeight: 2 }}>
        <li>
          <Link href="/admin/votes"><b>Consultation des votes</b></Link>
        </li>
        <li>
          <Link href="/admin/editions"><b>Gestion des éditions</b></Link>
        </li>
        <li>
          <Link href="/admin/questions"><b>Gestion des questions</b></Link>
        </li>
        <li>
          <Link href="/admin/groupes"><b>Gestion des groupes</b></Link>
        </li>
        <li>
          <Link href="/admin/membres"><b>Gestion des membres</b></Link>
        </li>
        <li>
          <Link href="/admin/editions-questions"><b>Gestion des éditions/questions</b></Link>
        </li>
      </ul>
    </div>
  );
}
