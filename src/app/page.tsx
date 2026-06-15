import Link from "next/link";

export default function Home() {
  return (
    <main>
      <section>
        <h1>D&D Combat Calculator</h1>

        <p>
          Calculate hit chance, crit chance, expected damage, and compare builds
          using D&D 2024 rules.
        </p>
        <Link href="/calc">Open Calculator</Link>
      </section>

      <section>
        <h2>Features</h2>

        <div>
          <article>
            <h3>Quick Calculator</h3>
            <p>Fast DPR calculations.</p>
          </article>

          <article>
            <h3>Attack Profiles</h3>
            <p>Model attacks and damage with dice components.</p>
          </article>

          <article>
            <h3>Build From Kit</h3>
            <p>Load predefined character kits.</p>
          </article>

          <article>
            <h3>Charts & Simulation</h3>
            <p>Compare performance across AC values.</p>
          </article>
        </div>
      </section>

      <section>
        <h2>Rules Assumptions</h2>
        <p>Calculations are based on D&D 2024 combat rules.</p>
      </section>

      <section>
        <Link href="/calc">Launch Calculator</Link>
      </section>
    </main>
  );
}
