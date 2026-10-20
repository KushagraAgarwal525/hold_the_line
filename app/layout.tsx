import type { Metadata } from "next";
import { Bricolage_Grotesque, IBM_Plex_Mono } from "next/font/google";
import { SiteHeader } from "../components/site-header";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bricolage",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-plex",
});

export const metadata: Metadata = {
  title: {
    default: "Hold the Line",
    template: "%s · Hold the Line",
  },
  description: "A public red-team range for a fictional banking voice agent. The phone lines are not assigned yet.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bricolage.variable} ${plexMono.variable}`}>
      <body>
        <a className="skip" href="#content">
          Skip to content
        </a>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
