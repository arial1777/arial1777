import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Intro } from "@/components/Intro";
import { MotionRuntime } from "@/components/MotionRuntime";

/**
 * 公開ページ（トップ / つくったもの / 歌える曲）で共通のヘッダーとフッター。
 *
 * ルートグループ（丸括弧のフォルダ）なので URL には出ない。管理画面をこの外に
 * 置いてあるのは、ヘッダーもフッターも要らないから。
 *
 * 幕（Intro）と動きの制御（MotionRuntime）もここに置く。レイアウトはページを
 * 移っても作り直されないので、リンクを踏むたびに幕が下りることはない。
 */
export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Intro />
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <MotionRuntime />
    </>
  );
}
