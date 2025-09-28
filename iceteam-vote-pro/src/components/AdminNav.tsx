import Link from "next/link";

export default function AdminNav() {
  return (
    <nav style={{marginBottom:30}}>
      <Link href="/admin">Dashboard</Link> |{" "}
      <Link href="/admin/editions">Éditions</Link> |{" "}
      <Link href="/admin/questions">Questions</Link> |{" "}
      <Link href="/admin/votes">Votes</Link>
    </nav>
  );
}