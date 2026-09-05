import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";

import { personJsonLd } from "@/lib/jsonld";
import { SITE_URL, site } from "@/content/site";

import "./globals.css";
import "./motion.css";

/**
 * 欧文だけ Google Fonts（next/font でセルフホスト）。
 * 和文は端末のシステムフォントを使う。日本語Webフォントは軽くても数百KB〜あり、
 * LCP と CLS の両方を確実に悪化させるため、ここでは読み込まない。
 */
const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "500", "600"],
  display: "swap",
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: site.title,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.name }],
  creator: site.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: site.name,
    title: site.title,
    description: site.description,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

/**
 * 最初の描画より前に走らせる小さなスクリプト。
 *
 * - data-js: JS が動いていることの印。motion.css はこれが付いているときだけ
 *   「出現前」の状態（透明・少し下）を作る。付かない環境では中身は最初から見える。
 * - data-intro: 同じセッションで一度見た幕は、二度目からは出さない。
 *
 * React より先に属性を付けたいので、hydration より前の同期スクリプトにしている。
 * sessionStorage が使えない設定のブラウザもあるので、失敗しても素通りさせる。
 */
const bootstrap = `(function(){var d=document.documentElement;d.dataset.js="on";try{if(sessionStorage.getItem("arial.intro")==="1"){d.dataset.intro="skip"}else{sessionStorage.setItem("arial.intro","1")}}catch(e){}})()`;

export const viewport: Viewport = {
  themeColor: "#091434",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={outfit.variable} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: bootstrap }} />
        <a className="skip-link" href="#main">
          本文へスキップ
        </a>
        {children}
        <script
          type="application/ld+json"
          // 構造化データ。文字列は自前の定数のみなので外部入力は入らない。
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd()) }}
        />
      </body>
    </html>
  );
}
