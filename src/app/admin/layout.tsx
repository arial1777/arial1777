import "./admin.css";

/**
 * 管理画面は公開ページと同じ配色を使うが、ヘッダーもフッターも要らない。
 * ルートレイアウトの下にこれを挟んで、管理画面だけのCSSをここで読み込む。
 */
export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
