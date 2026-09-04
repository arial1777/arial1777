# arial — ホームページ

VTuber「arial」のホームページ。Next.js (App Router) + TypeScript。

```bash
npm run dev        # 開発サーバー http://localhost:3000
npm run build      # 本番ビルド
npm run typecheck  # tsc --noEmit
```

## 文言を直したいとき

**`src/content/site.ts` だけ**を見ればよい。表示側のコンポーネントは文言を持っていない。

| 直したいもの | 場所 |
|---|---|
| キャッチコピー・肩書き | `site` |
| 自己紹介・プロフィール表 | `about` |
| 三つの活動 | `activities` |
| プロダクト（オシノミ／ふら旅） | `works`, `worksIntro` |
| ろぼとの紹介 | `roboto` |
| イラストレーターのクレジット | `credits.illustrator`（`null` のあいだはフッターに出ない） |

プロダクトの画像だけは `src/components/Works.tsx` の `media` にある。文言と画像を分けてあるので、
プロダクトを増やすときは `works` に1件足して `media` に画像を1件足す。

素材の一覧と用途は `assets/README.md`、文言のドラフトは `content/profile.md` にある。

## デプロイ前に必ずやること

`NEXT_PUBLIC_SITE_URL` に公開URLを設定する（`.env.example` 参照）。
canonical・OGP・sitemap の生成元なので、未設定だと `http://localhost:3000` が埋め込まれる。

Vercel なら環境変数に入れるだけ。GitHub Pages など静的ホスティングに出す場合は
`next.config.ts` のコメントにある `output: "export"` と `images.unoptimized` を有効にする
（next/image の最適化が効かなくなるぶん、画像は元サイズのまま配信される）。

## ウェブヘルス（Core Web Vitals）まわりの判断

計測値（`next start` をローカルで、モバイル 390px、初期表示ぶん）:

| | |
|---|---|
| 転送量 | 約 209 KB（JS 129 / フォント 32 / 画像 26 / HTML 12 / CSS 3） |
| CLS | 0 |
| LCP | 立ち絵（`priority` 指定、AVIF 26KB） |

意図的にそうしてある点:

- **日本語Webフォントを読み込まない。** 和文フォントは軽いものでも数百KBあり、LCPとCLSの
  両方を確実に悪化させる。和文は端末のシステムフォント、欧文だけ Outfit を next/font で
  セルフホストしている（`display: swap`、latin サブセットのみ）。
- **クライアントコンポーネントがゼロ。** 全部サーバーコンポーネントで、ページ自身のJSは0。
  ナビゲーションはアンカーリンク、開閉するUIも作っていない。残り129KBは
  React + Next のランタイムそのもので、App Router を使う以上は削れない。
- **画像は全部 next/image の静的インポート。** width/height がビルド時に確定するので
  レイアウトシフトが起きない（CLS 0 はこれによる）。ヒーローだけ `priority`、他は遅延読み込み。
- **立ち絵を引き伸ばさない。** 元素材が 321px 幅なので、レイアウト側で原寸付近に収めている。
  `next.config.ts` の `imageSizes` も実際に使う幅だけに絞ってある。
- **アニメーションは CSS のみ**で、`prefers-reduced-motion: reduce` で止まる。
- コントラスト比は全ての本文色の組み合わせで WCAG AA（4.5:1）以上を満たしている。
- `robots.txt` / `sitemap.xml` / `manifest.webmanifest` / OGP画像 / Person・WebSite の
  構造化データ（JSON-LD）を生成している。

## 構成

```
src/
├── app/
│   ├── layout.tsx        メタデータ・フォント・JSON-LD
│   ├── page.tsx          セクションを並べるだけ
│   ├── globals.css       スタイル全部（CSSフレームワークは使っていない）
│   ├── robots.ts / sitemap.ts / manifest.ts
│   └── icon.png, apple-icon.png, favicon.ico, opengraph-image.jpg
├── components/           セクションごと
├── content/site.ts       文言はすべてここ
└── lib/jsonld.ts         構造化データ
assets/                   画像素材（切り出し済み・用途は assets/README.md）
content/profile.md        プロフィールのドラフト
```
