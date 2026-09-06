# arial — ホームページ

VTuber「arial」のホームページ。Next.js (App Router) + TypeScript。

```bash
npm run dev        # 開発サーバー http://localhost:3000
npm run build      # 本番ビルド
npm run typecheck  # tsc --noEmit
```

## ページ

| URL | 中身 |
|---|---|
| `/` | ヒーロー / About / 三つの活動（下2ページへの目次）/ 立ち絵 / ろぼと |
| `/works` | 個人開発でつくったもの（オシノミ・ふら旅） |
| `/songs` | 歌える曲の一覧。検索欄つき |
| `/play` | ろぼとダイブ。ろぼとを潜らせて障害物を避ける小さなゲーム |
| `/admin/songs` | 曲の管理画面。ベーシック認証で閉じてある |

トップの「三つの活動」が目次を兼ねていて、カードの右肩に曲数・プロダクト件数が出る。
公開4ページはヘッダーとフッターを共有する（`src/app/(site)/layout.tsx`）。丸括弧の
フォルダはルートグループで URL には出ない。管理画面はこの外にあるので、ヘッダーも
フッターも付かない。

## 文言を直したいとき

**`src/content/site.ts` だけ**を見ればよい。表示側のコンポーネントは文言を持っていない。

| 直したいもの | 場所 |
|---|---|
| キャッチコピー・肩書き | `site` |
| 自己紹介・プロフィール表 | `about` |
| 三つの活動 | `activities` |
| /works ページの見出し・導入文 | `worksPage` |
| プロダクト（オシノミ／ふら旅） | `works` |
| ろぼとの紹介 | `roboto` |
| 立ち絵の見出し・差分のラベル | `character`（絵そのものは `src/components/Character.tsx`） |
| イラストレーターのクレジット | `credits.illustrator`（`null` のあいだはフッターに出ない） |
| ヘッダーのナビ | `nav` |

プロダクトの画像だけは `src/components/Works.tsx` の `media` にある。文言と画像を分けてあるので、
プロダクトを増やすときは `works` に1件足して `media` に画像を1件足す。

素材の一覧と用途は `assets/README.md`、文言のドラフトは `content/profile.md` にある。
## ろぼとダイブ（/play）

相棒のろぼとを潜らせて、岩と海藻を避けながら進む小さなゲーム。入口はトップの
ろぼとの節にあるリンクだけで、ヘッダーのナビには出していない。

| ファイル | 役割 |
|---|---|
| `src/game/dive.ts` | 物理と出題。matter-js を触るのはここだけ。React も DOM も知らない |
| `src/game/draw.ts` | canvas への描画。座標をもらって絵にするだけ |
| `src/components/RobotoDive.tsx` | 採寸・入力・ループ・記録。唯一のクライアント側 |
| `src/app/(site)/play/game.css` | このページだけのスタイル |
| `public/game/*.webp` | ゲームが読む絵。canvas は URL でしか読めないので最適化済みを置く |

決めてあること:

- **世界は高さ600固定、幅は画面の形から決める。** 物の大きさは高さ基準なので、
  スマホでもパソコンでも画面に対する比率が変わらない。そのぶん速さを幅から
  逆算していて、「障害物が現れてから届くまでの歩数」はどの端末でも同じ。
  つまり縦長でも横長でも難易度は揃う
- **1歩は必ず1/60秒**（固定タイムステップ）。可変にすると120Hzの端末だけ挙動が変わる
- **記録は端末の localStorage だけ。** サーバーには何も送らない
- 難易度は距離ではなく**遊んだ歩数**で上がる。距離だと画面の幅で変わってしまう
- 岩と海藻と海底は即死、渦は弾かれるだけ、泡のかたまりは押しのけられる。
  当たり判定はろぼとの絵より小さめにしてあり、惜しい当たりは許す側に倒してある

物理エンジンを入れたのは、浮力・水の抵抗・機体の傾き・押しのけられる漂流物・
当たってから力尽きるまでのひと呼吸を、自前で書かずに済ませるため。素の
「重力＋タップ」だけなら要らなかった。

## 歌える曲を足すとき

`/admin/songs` の管理画面から入力する。コードを触る必要はない。

- アーティスト単位でまとめ、その下に曲を並べる
- 曲ごとに **よみ / キー / 備考 / リンク / 練習中** を持てる。どれも省略できる
- 「練習中」を入れた曲は、公開ページで曲名の横に「練習中」の印が付く
- `reading`（よみ）を入れておくと、カタカナでもひらがなでも引ける（検索側で
  カタカナをひらがなに寄せている）
- 並び順とアーティストごとの曲数はコードが自動で出すので、手で並べ替えなくてよい
- アーティスト名か曲名が空の行は、保存のときに落ちる。`https://` 以外のリンクも落ちる
- 1曲も入っていないあいだは「準備中」の文言だけが出る

管理画面はベーシック認証で閉じてある（`ADMIN_USER` / `ADMIN_PASSWORD`）。
どちらか欠けていると、誰も開けない状態になる。入口は `src/proxy.ts`
（Next.js 16 で `middleware.ts` から改名されたもの）。

### 曲データの置き場所

`src/content/songs.ts` にあるのは型と文言と並べ替えだけで、曲そのものは入っていない。
読み書きは `src/lib/songs-store.ts` が受け持ち、保存先は環境で自動的に切り替わる。

| | 保存先 | 条件 |
|---|---|---|
| 本番（Vercel） | Vercel Blob の `songs/songs.json` | `BLOB_READ_WRITE_TOKEN` がある |
| 手元 | `data/songs.json`（gitignore 済み） | 上が無い |

保存先がまだ空のあいだは `src/content/songs.seed.json` が使われる。デプロイ直後の
真っさらな保存先でも一覧が出るようにするための初期データで、管理画面から一度
保存すれば以後は読まれない。「全部消した」場合に種が復活しないよう、種を使うのは
保存先に何も無いときだけにしてある。

保存先を別のもの（DBなど）に替えたくなったら、書き換えるのは `songs-store.ts` の
`readRaw` / `writeRaw` だけでよい。

保存すると `revalidatePath` で `/`（曲数）と `/songs`（一覧そのもの）の両方が
作り直される。届かなかったときの保険として、どちらにも1時間の ISR
（`export const revalidate`）を入れてある。

検索欄だけがクライアントコンポーネント（`src/components/SongList.tsx`）。
一覧そのものはサーバー側でもレンダリングされるので、JSが動かない環境でも全曲が読める。

## デプロイ前に必ずやること

`NEXT_PUBLIC_SITE_URL` に公開URLを設定する（`.env.example` 参照）。
canonical・OGP・sitemap の生成元。`https://` から書くこと。

未設定・空・URLとして壊れている場合は、Vercel の本番ドメイン →
`http://localhost:3000` の順にフォールバックする（`src/content/site.ts`）。
ビルドは通るが canonical がプレビュー用のドメインになりうるので、結局は設定する。

Vercel なら環境変数に入れるだけ。

管理画面を使うので、あわせてこの2つも要る:

1. `ADMIN_USER` / `ADMIN_PASSWORD` — 管理画面のベーシック認証。未設定だと `/admin` は開かない
2. Vercel のダッシュボードで **Blob ストアを作ってプロジェクトに接続する** —
   `BLOB_READ_WRITE_TOKEN` が自動で入り、曲データの保存先がここになる。
   接続しないまま公開すると、保存のたびに「保存できませんでした」が出る
   （サーバーレスではディスクに書けないため）。
   ストアは **private access** で作る。`songs-store.ts` の `BLOB_ACCESS` がそれに揃えてあり、
   食い違うと保存時に `Cannot use public access on a private store` で蹴られる

静的ホスティング（GitHub Pages など）には、この構成では出せない。管理画面と保存が
サーバーを必要とするため。どうしても出す場合は `next.config.ts` のコメントにある
`output: "export"` と `images.unoptimized` を有効にしたうえで、曲データは
`data/songs.json` を手で置いてビルドすることになる。

## ウェブヘルス（Core Web Vitals）まわりの判断

計測値（`next start` をローカルで、初期表示ぶん）:

| | デスクトップ 1440px | モバイル 390px |
|---|---|---|
| 転送量 | 244 KB（うち画像 61 KB） | 208 KB（うち画像 25 KB） |
| CLS | 0 | 0 |
| LCP要素 | ヒーロー背景（AVIF） | ヒーロー背景（AVIF） |

意図的にそうしてある点:

- **日本語Webフォントを読み込まない。** 和文フォントは軽いものでも数百KBあり、LCPとCLSの
  両方を確実に悪化させる。和文は端末のシステムフォント、欧文だけ Outfit を next/font で
  セルフホストしている（`display: swap`、latin サブセットのみ）。
- **クライアントコンポーネントは2つだけ。** `/` と `/works` は自前のJSが0で、
  `/songs` の絞り込み入力（`SongList.tsx`）と `/play` のゲーム（`RobotoDive.tsx`）だけが
  クライアント側で動く。曲の一覧はサーバーでもレンダリングされるので、JSが落ちても全曲読める。
  残り約130KBは React + Next のランタイムそのもので、App Router を使う以上は削れない。
- **ゲームの重いものは、遊ぶと決めた人にだけ配る。** `/play` を開いた時点では
  物理エンジンもゲーム画像も落ちてこない（初期JS 147KB＝他ページとほぼ同じ）。
  「あそぶ」を押してはじめて matter-js（25KB）とWebP 9枚（145KB）を読む。
  トップの数字は変わっていない。
- **ヒーロー背景は画面の向きで絵を差し替える（アートディレクション）。** 横長はキャラクター入りの
  バナー、縦長は水面だけの絵。`next/image` の `getImageProps` で `<picture>` を組み立てているので、
  出し分けと AVIF/WebP 最適化を両立できている。縦長の絵は見出しが上に来る前提で、
  絵そのものの上部を暗く空けてある。
- **画像は全部 next/image の静的インポート。** width/height がビルド時に確定するので
  レイアウトシフトが起きない（CLS 0 はこれによる）。ヒーローだけ `priority`、他は遅延読み込み。
- **文字が載る領域のコントラストは、レンダリング後の実ピクセルで計測している。** 背景画像の上に
  白文字を置くと、明るい波紋の上で 2.4:1 まで落ちる。ヒーローの膜（`.hero__scrim`）の濃さは
  この実測から決めた。CTAボタンのグラデーションも、明るい側が 3.7:1 だったため終点を
  `#1D6FC0`（5.1:1）まで落としてある。現在は見出し・本文・チップ・CTAのすべてで AA 以上。
- **立ち絵の差分（角度5点・表情10点）は遅延読み込み。** 折り返しより下にしか出ないので
  初期表示の転送量には乗らない。1枚が最大でも130px相当で、AVIF に変換されると
  数KBずつになる。`next/image` の `imageSizes` に小さい幅を並べてあるのはこのため。
- **アニメーションは CSS のみ**で、`prefers-reduced-motion: reduce` で止まる。
- **負の z-index を使っていない。** 背景画像・膜・本文を 0 / 1 / 2 の順で重ねている。
- `robots.txt` / `sitemap.xml` / `manifest.webmanifest` / OGP画像 / Person・WebSite の
  構造化データ（JSON-LD）を生成している。

## 構成

```
src/
├── app/
│   ├── layout.tsx        メタデータ・フォント・JSON-LD（全ページ共通）
│   ├── globals.css       スタイル全部（CSSフレームワークは使っていない）
│   ├── robots.ts / sitemap.ts / manifest.ts
│   ├── icon.png, apple-icon.png, favicon.ico, opengraph-image.jpg
│   ├── (site)/           公開ページ。ヘッダーとフッターを共有する
│   │   ├── layout.tsx
│   │   ├── page.tsx      トップ
│   │   ├── works/        つくったもの
│   │   ├── songs/        歌える曲
│   │   └── play/         ろぼとダイブ（game.css を持つ）
│   └── admin/            管理画面（ヘッダー・フッターなし、admin.css を持つ）
│       └── songs/        page.tsx / SongsEditor.tsx / actions.ts
├── proxy.ts              /admin のベーシック認証
├── components/           セクションごと（Character.tsx が立ち絵と差分）
├── game/                 ろぼとダイブ。dive.ts が物理、draw.ts が描画
├── content/
│   ├── site.ts           文言はすべてここ
│   ├── songs.ts          曲の型・文言・並べ替え・入力の検証
│   └── songs.seed.json   保存先が空のときに使う初期データ
└── lib/
    ├── jsonld.ts         構造化データ
    ├── basic-auth.ts     認証の判定
    └── songs-store.ts    曲データの保存先（Blob / ローカルファイル）
assets/                   画像素材（切り出し済み・用途は assets/README.md）
content/profile.md        プロフィールのドラフト
```
