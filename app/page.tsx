export default function HomePage() {
  return (
    <main style={{ maxWidth: "40rem", margin: "0 auto", padding: "2.5rem 1.25rem" }}>
      <h1 style={{ fontSize: "2.5rem", letterSpacing: "-0.03em", marginBottom: "0.75rem" }}>
        Hold the Line
      </h1>
      <p style={{ fontSize: "1.125rem", lineHeight: 1.5 }}>
        The night desk is not live. No phone number is attached, and Door 1 is not taking calls.
      </p>
      <p style={{ lineHeight: 1.5, color: "#14112B" }}>
        This build has the leak detector, the stats helpers, the database schema, and local tool
        stubs. Bolna, telephony, Vercel, and Supabase are not connected.
      </p>
    </main>
  );
}
