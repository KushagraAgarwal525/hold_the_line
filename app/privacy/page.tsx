import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What Hold the Line stores about a call, how long it is kept, and how to ask for deletion.",
};

export default function PrivacyPage() {
  return (
    <main className="page" id="content">
      <h1>Privacy</h1>
      <p className="copy">
        No calls are stored in this build. The lines are not assigned, so there is no caller data
        to keep or delete yet.
      </p>
      <section className="section">
        <h2>What will be stored</h2>
        <p>
          When a call is stored, the caller number is kept only as HMAC(secret, caller number). The
          raw number is not written to the database or to app logs. The HMAC is not wired up yet.
        </p>
        <p>
          A stored call also keeps the door, the version, whether the caller was a person or a call
          we placed ourselves, the start time, the duration, a language guess, the cost, and the
          transcript. The transcript is shown as text. Canaries, phone numbers, and email addresses are
          blocked before it is shown. Blocking street addresses is part of the plan and is not
          written yet.
        </p>
        <p>
          Events record a leak, a tool attempt, an execution, a block, or a passphrase rotation.
          Technique tags, when present, are labeled LLM-judged. A handle is stored only if someone
          claims a breach.
        </p>
        <p>
          Audio stays private. A clip is published only after the caller opts in. The claim flow
          can ask for that opt-in.
        </p>
      </section>
      <section className="section">
        <h2>How long</h2>
        <p>
          How long a stored call, transcript, or recording is kept is not decided. This page will
          not name a number of days until that choice is made.
        </p>
      </section>
      <section className="section">
        <h2>Deletion</h2>
        <p>
          There is nothing stored to delete. The way to request deletion is not decided. When calls
          exist, this page will say where to send the request, and a request will cover the hash
          of the caller number, the transcript, the events, and any recording.
        </p>
      </section>
    </main>
  );
}