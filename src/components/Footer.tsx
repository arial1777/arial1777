import { credits, site } from "@/content/site";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <p>
          © {year} {site.name}
        </p>
        {/* クレジットが無いあいだは、右側には何も出さない */}
        {credits.illustrator ? (
          <p className="footer__note">イラスト: {credits.illustrator}</p>
        ) : null}
      </div>
    </footer>
  );
}
