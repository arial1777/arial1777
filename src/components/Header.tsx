import { nav, site } from "@/content/site";

export function Header() {
  return (
    <header className="header">
      <div className="container header__inner">
        <a className="wordmark" href="#top">
          {site.name}
        </a>
        <nav className="header__nav" aria-label="サイト内">
          {nav.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
