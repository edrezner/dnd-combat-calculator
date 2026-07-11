import Link from "next/link";
import Header from "./components/Header";

export default function Home() {
  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-6 py-12">
        <section className="text-center space-y-4 mb-16">
          <h1 className="text-4xl font-bold">D&D Combat Calculator</h1>

          <p className="text-lg text-gray-600">
            Calculate hit chance, crit chance, expected damage, and compare
            builds using D&D 2024 rules.
          </p>
          <Link
            href="/calc"
            className="inline-block rounded-lg px-4 py-2 bg-black text-white transition hover:bg-gray-800"
          >
            Open Calculator
          </Link>
        </section>

        <section className="space-y-4 mb-12">
          <h2 className="text-2xl font-semibold">Features</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <article className="border rounded-lg p-4 transition hover:shadow-sm">
              <h3 className="text-lg font-semibold">Quick Calculator</h3>
              <p>Fast DPR calculations.</p>
            </article>

            <article className="border rounded-lg p-4 transition hover:shadow-sm">
              <h3 className="text-lg font-semibold">Attack Profiles</h3>
              <p>Model attacks and damage with dice components.</p>
            </article>

            <article className="border rounded-lg p-4 transition hover:shadow-sm">
              <h3 className="text-lg font-semibold">Build From Kit</h3>
              <p>Load predefined character kits.</p>
            </article>

            <article className="border rounded-lg p-4 transition hover:shadow-sm">
              <h3 className="text-lg font-semibold">Charts & Simulation</h3>
              <p>Compare performance across AC values.</p>
            </article>
          </div>
        </section>

        <section className="space-y-4 mb-12">
          <h2 className="text-2xl font-semibold">Rules Assumptions</h2>
          <p>Calculations are based on D&D 2024 combat rules.</p>
        </section>

        <section className="space-y-4 mb-12">
          <Link
            href="/calc"
            className="inline-block rounded-lg px-4 py-2 border"
          >
            Launch Calculator
          </Link>
        </section>
      </main>
    </>
  );
}
