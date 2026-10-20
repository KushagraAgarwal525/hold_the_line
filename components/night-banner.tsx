export function NightBanner({ closed }: { closed: boolean }) {
  if (!closed) return null;
  return (
    <p className="night-banner" role="status">
      Closed for the night.
    </p>
  );
}
