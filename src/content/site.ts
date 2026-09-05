/**
 * サイトに出る文言はすべてここに集約する。
 * 表示側は文言を持たないので、直したいときはこのファイルだけを見ればよい。
 */

/**
 * 公開URLの決め方。上から順に、使えるものを使う。
 *
 * 1. NEXT_PUBLIC_SITE_URL（明示設定）
 * 2. Vercel の本番ドメイン（環境変数を入れ忘れてもビルドは通る）
 * 3. http://localhost:3000
 *
 * `??` ではなく空文字も弾いているのは、Vercel で変数だけ作って値を空のまま
 * 置いておくと `new URL("")` がビルドを落とすため。値が壊れているときも
 * 同じ理由で捨てる。
 */
function resolveSiteUrl(): string {
  const productionDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    productionDomain ? `https://${productionDomain}` : undefined,
    "http://localhost:3000",
  ];

  for (const candidate of candidates) {
    const trimmed = candidate?.trim();
    if (!trimmed) continue;
    try {
      // 絶対URL（スキーム付き）でないと metadataBase / sitemap がそのまま壊れる。
      // 末尾の / は落とす——他で `${SITE_URL}/songs` のように連結しているため
      return new URL(trimmed).toString().replace(/\/+$/, "");
    } catch {
      continue;
    }
  }
  return "http://localhost:3000";
}

export const SITE_URL = resolveSiteUrl();

export const site = {
  name: "arial",
  reading: "アリアル",
  title: "arial — 弾き語り／個人開発／PdM",
  tagline: "まだ無いものを、届くかたちにする。",
  /** 見出しの改行位置を制御するため、読点で切って渡す */
  taglineParts: ["まだ無いものを、", "届くかたちにする。"],
  subTagline:
    "弾き語り配信と個人開発。ITベンチャーでプロダクト企画をしています。",
  description:
    "ITベンチャーでプロダクト企画（PdM）をしながら、弾き語り配信と個人開発をしている arial のホームページです。つくったもの（オシノミ／ふら旅）を置いています。",
  roles: ["弾き語り", "個人開発", "PdM"],
} as const;

export const about = {
  heading: "About",
  lead: "はじめまして、arial です。",
  paragraphs: [
    "平日はITベンチャーでプロダクトの企画をしています。何をつくるか、なぜつくるか、誰の何が変わるのか——そればかり考えている職業です。",
    "夜になるとギターを持って、配信で弾き語りをしています。仕様書に書けなかったことが、歌にはそのまま乗る。やっていることは、どちらも同じだと思っています。",
    "その延長で、個人開発もしています。相棒のろぼとは、もともと自分が趣味でつくったボットでした。",
    "歌と、コードと、その間にあるものを置いていく場所として、このサイトを作りました。",
  ],
  profile: [
    { label: "名前", value: "arial（アリアル）" },
    { label: "活動", value: "VTuber ／ 弾き語り ／ 個人開発" },
    { label: "職業", value: "ITベンチャーでプロダクト企画（PdM）" },
    { label: "イメージカラー", value: "青・水色・白" },
    { label: "モチーフ", value: "音楽・水・空" },
    { label: "一人称", value: "僕" },
    { label: "相棒", value: "ろぼと" },
  ],
} as const;

export type Activity = {
  index: string;
  title: string;
  body: string;
  link?: { label: string; href: string };
  /**
   * カードの右肩に出す数。実数は中身を数えないと出ないので、
   * ここでは「何を数えるか」だけを持ち、数えるのは表示側に任せる。
   */
  metric?: "songs" | "works";
};

export const activities: readonly Activity[] = [
  {
    index: "01",
    title: "弾き語り配信",
    body: "ギターと声だけの配信をしています。上手さより、その日の温度が乗ることを大事にしています。",
    link: { label: "歌える曲を見る", href: "/songs" },
    metric: "songs",
  },
  {
    index: "02",
    title: "個人開発",
    body: "自分が困ったものを、自分で作って自分で使っています。相棒のろぼともその一つ。",
    link: { label: "つくったものを見る", href: "/works" },
    metric: "works",
  },
  {
    index: "03",
    title: "プロダクト企画（PdM）",
    body: "ITベンチャーで、何をつくるかを決める仕事をしています。仕様の話、意思決定の話が、他の二つにも効いています。",
  },
];

export type Work = {
  slug: string;
  name: string;
  reading: string;
  status: string;
  tagline: string;
  body: string;
  why: string;
  note?: { heading: string; body: string };
  stack: readonly string[];
  links: readonly { label: string; href: string }[];
};

export const works: readonly Work[] = [
  {
    slug: "oshinomi",
    name: "オシノミ",
    reading: "Oshinomi",
    status: "公開中",
    tagline: "推しの予定を、もう見逃さない。",
    body: "ライブ・配信・リリース・イベントの予定を、ひとつのカレンダーに集約する推し活サービス。ファンクラブのようにログインが必要で機械的に取得できないサイトの情報も、スクリーンショットを送るだけでAIが日時・会場・URLを読み取って登録します。推しごとの色分け、1週間前／前日／1時間前のリマインドまで。",
    why: "推し活の情報は、ファンクラブ・X・Instagram・公式サイトに散らばっています。毎日巡回しないと追えないし、それでもチケットの申込を忘れる。だから「情報を集めること」ではなく、「忘れないこと」に寄せました。",
    stack: [
      "Next.js",
      "React Native (Expo)",
      "NestJS",
      "PostgreSQL / Prisma",
      "Firebase Auth",
      "Cloud Run",
      "Gemini",
      "Turborepo",
    ],
    links: [
      { label: "oshinomi.app", href: "https://oshinomi.app" },
      {
        label: "App Store",
        href: "https://apps.apple.com/jp/app/%E3%82%AA%E3%82%B7%E3%83%8E%E3%83%9F/id6787456659",
      },
    ],
  },
  {
    slug: "furatabi",
    name: "ふら旅",
    reading: "Furatabi",
    status: "公開中（MVP）",
    tagline: "あなたの休日を、AIが旅にする。",
    body: "東京発・週末1泊2日の一人温泉旅を、毎週金曜の夜にLINEで1件だけ届けるコンシェルジュ。行き先を決めるところから、宿・行き方・雨の日の過ごし方まで用意した状態で送られてきます。比較させない、選ばせない。提案は常に本命1件だけです。",
    why: "「旅行に行きたいけど、計画するのが面倒」で止まる人のためのものです。既存のAI旅程生成は「行き先が決まっている」ところから始まりますが、ふら旅は行き先すら決める気力がない状態から始まります。だからプル型ではなくプッシュ型で、体験の起点は金曜の夜にLINEが鳴ることにしました。",
    note: {
      heading: "事実を、LLMに生成させない",
      body: "交通時刻・料金・空室はすべて実データのみを情報源にして、LLMには文章だけを書かせています。そのうえで、生成された文章と構造化した事実を機械的に突き合わせ、時刻・金額・駅名が一つでも食い違えば配信そのものを止めます。AIが交通時刻を間違えることは、信頼の即死要因だと考えたからです。",
    },
    stack: [
      "Next.js",
      "TypeScript",
      "Supabase",
      "LINE Messaging API / LIFF",
      "Gemini / Claude",
      "楽天API",
      "Open-Meteo",
      "Vercel Cron",
    ],
    links: [
      { label: "furatabi.app", href: "https://furatabi.app" },
      { label: "LINEで友だち追加", href: "https://line.me/R/ti/p/@181hwwgc" },
    ],
  },
];

/** /works ページの文言 */
export const worksPage = {
  label: "Works",
  title: "つくったもの",
  intro:
    "どちらも「AIに何をさせて、何をさせないか」を決めたプロダクトです。オシノミは読み取りをAIに任せて確認を人に返し、ふら旅は文章だけを書かせて事実は書かせない。偶然ではなく、判断の結果です。",
  description:
    "arial がつくったものを置いています。推し活カレンダーの「オシノミ」と、AIが旅程をつくる「ふら旅」。",
} as const;

export const roboto = {
  heading: "ろぼと",
  speech: "Hello!",
  body: [
    "相棒のろぼとです。もともとは僕が個人開発でつくった小型の対話ボットでした。いつの間にか、自分で喋るようになりました。",
    "素直で褒め上手、ちょっと天然。返事だけはやたら早いです。名前は arial と対になるフォント名から取りました。",
  ],
} as const;

/**
 * 立ち絵のクレジット。表記が必要な場合はここに名前を入れると
 * フッターに出る。null のあいだは何も出ない。
 */
export const credits = {
  illustrator: null as string | null,
};

/**
 * ヘッダーのナビ。トップの中の節へはアンカー、独立したページへはパスで指す。
 * サブページからも押せるよう、アンカーは "/" から書く。
 */
export const nav = [
  { label: "About", href: "/#about" },
  { label: "個人開発", href: "/works" },
  { label: "歌える曲", href: "/songs" },
  { label: "ろぼと", href: "/#roboto" },
] as const;
