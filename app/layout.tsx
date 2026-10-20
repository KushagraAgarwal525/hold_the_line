export const metadata = {
  title: "Hold the Line",
  description: "A public red-team range for a fictional banking voice agent. Not live.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          background: "#F6F4FB",
          color: "#14112B",
          fontFamily: "system-ui, sans-serif",
          margin: 0,
        }}
      >
        {children}
      </body>
    </html>
  );
}
