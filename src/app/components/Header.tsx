import Link from "next/link";

export default function Header() {
  return (
    <header>
      <nav className="flex items-center gap-4">
        <Link href="/">D&D Combat Calculator</Link>
        <Link href="/" className="ml-auto">
          Home
        </Link>
        <Link href="/calc">Calculator</Link>
      </nav>
    </header>
  );
}
