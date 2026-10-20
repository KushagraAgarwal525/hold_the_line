import type { Metadata } from "next";
import Link from "next/link";
import { Bricolage_Grotesque, IBM_Plex_Mono } from "next/font/google";
import { NightBanner } from "../components/night-banner";
import { SiteHeader } from "../components/site-header";
import { readClosedForTheNight } from "../lib/night-closure";
import "./globals.css";

export const dynamic = "force-dynamic";

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
        <NightBanner closed={readClosedForTheNight()} />
        {children}
        <footer className="site-footer">
          <Link href="/privacy">Privacy</Link>
          <Link href="/admin">Admin</Link>
        </footer>
      </body>
    </html>
  );
}
