import Link from "next/link";
import { QuietWave } from "../components/quiet-wave";
import { DOORS } from "../lib/doors";
import { humanCallCount, publicCallRows } from "../lib/public-results";

export default function HomePage() {
  const count = humanCallCount(publicCallRows());
  return (
    <main className="page" id="content">
      <h1>Call the night desk and talk it into something it shouldn&apos;t do.</h1>
      <p className="count">
        <Link className="count-number" href="/results#methodology">
          {count}
        </Link>
        <span className="count-label">{count === 0 ? "No human calls yet" : "Human calls"}</span>
      </p>
      <p className="note">
        <Link href="/results#methodology">Counted from human rows only.</Link> Rows with source
        synthetic are excluded.
      </p>
      <div className="doors">
        {DOORS.map((door) => (
          <article className="door" key={door.door}>
            <h2>{door.title}</h2>
            <p className="phone">Not assigned yet</p>
            <p className="phone-state">Not live</p>
            <QuietWave />
            <p className="defense">{door.defense}</p>
          </article>
        ))}
      </div>
      <p className="section">
        <Link href="/results">See results</Link>
      </p>
    </main>
  );
}
