"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/play", label: "Play" },
  { href: "/results", label: "Results" },
];

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="site-header">
      <Link className="wordmark" href="/">
        Hold the Line
      </Link>
      <nav aria-label="Pages">
        <div className="nav">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
