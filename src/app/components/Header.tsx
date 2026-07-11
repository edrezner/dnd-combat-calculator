import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b">
      <nav className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
        <Link className="hover:underline" href="/">
          D&D Combat Calculator
        </Link>
        <Link href="/" className="hover:underline ml-auto">
          Home
        </Link>
        <Link className="hover:underline" href="/calc">
          Calculator
        </Link>
      </nav>
    </header>
  );
}
