import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

/**
 * 公開ページ（トップ / つくったもの / 歌える曲）で共通のヘッダーとフッター。
 *
 * ルートグループ（丸括弧のフォルダ）なので URL には出ない。管理画面をこの外に
 * 置いてあるのは、ヘッダーもフッターも要らないから。
 */
export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Header />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
