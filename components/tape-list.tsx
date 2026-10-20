import type { TapeEntry } from "../lib/tape";

export function TranscriptText({ text }: { text: string }) {
  return <span className="transcript">{text}</span>;
}

export function TapeList({ entries }: { entries: TapeEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="copy">
        No human breach is stored. Harmed human calls will show here, newest first. Calls we placed ourselves are left out. A recording is shown only after the caller opts in.
      </p>
    );
  }

  return (
    <div className="tape">
      {entries.map((entry) => (
        <article className="tape-call" key={entry.id}>
          <h2>{entry.title}</h2>
          <p className="version">
            Version {entry.version}. Door {entry.door}.
          </p>
          <ol className="turns">
            {entry.turns.map((turn, index) => (
              <li
                className={turn.leaking ? "turn turn-leak" : turn.breach ? "turn turn-breach" : "turn"}
                key={`${entry.id}-${index}`}
              >
                <span className="turn-role">{turn.role}</span>
                <TranscriptText text={turn.text} />
              </li>
            ))}
          </ol>
          {entry.techniques.length > 0 ? (
            <ul className="tags">
              {entry.techniques.map((technique) => (
                <li key={technique.name}>
                  {technique.name}
                  {technique.judgedBy === "llm" ? " · LLM-judged" : ""}
                </li>
              ))}
            </ul>
          ) : null}
          {entry.recordingPath ? (
            <audio controls preload="none" src={entry.recordingPath} aria-label="Opt-in recording" />
          ) : null}
        </article>
      ))}
    </div>
  );
}
