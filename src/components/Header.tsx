import Link from "next/link";

import { nav, site } from "@/content/site";

export function Header() {
  return (
    <header className="header">
      <div className="container header__inner">
        <Link className="wordmark" href="/">
          {site.name}
        </Link>
        <nav className="header__nav" aria-label="サイト内">
          {nav.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
