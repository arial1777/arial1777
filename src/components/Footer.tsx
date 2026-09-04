import { credits, site } from "@/content/site";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <p>
          © {year} {site.name}
        </p>
        <p className="footer__note">
          {credits.illustrator ? (
            <>イラスト: {credits.illustrator}　/　</>
          ) : null}
          Built with Next.js
        </p>
      </div>
    </footer>
  );
}
