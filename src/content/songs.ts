/**
 * 弾き語りで歌える曲の「かたち」と、ページの文言。
 *
 * 曲そのもののデータはこのファイルには無い。/admin/songs の管理画面から入力し、
 * 保存先（本番は Vercel Blob、ローカルは data/songs.json）に置かれる。
 * 読み書きは src/lib/songs-store.ts が受け持つ。
 *
 * ここに置いてあるのは、保存先が何であっても変わらないもの
 * ——型、表示用の並べ替え、外から来た JSON を信用せずに整える parse——だけ。
 */

export type Song = {
  title: string;
  /** 検索と並び替えのためのかな。漢字やアルファベットの曲に入れておくと引きやすい */
  reading?: string;
  /** 原曲キーからの上下（例: "±0", "-2"） */
  key?: string;
  note?: string;
  /** アーカイブや歌ってみたのURL。あれば曲名がリンクになる */
  link?: string;
  /** 練習中。一覧には出るが「練習中」の印が付く */
  practicing?: boolean;
};

export type Artist = {
  name: string;
  reading?: string;
  songs: readonly Song[];
};

export type SongsData = {
  artists: readonly Artist[];
};

export const emptySongsData: SongsData = { artists: [] };

export const songsPage = {
  label: "Songs",
  title: "歌える曲",
  description:
    "arial が配信の弾き語りで歌っている曲の一覧です。曲名やアーティスト名でしぼりこめます。",
  lead: "配信の弾き語りでよく歌っているものです。",
  note: "ここに無い曲でも、練習して歌えるようになることがあります。リクエストは配信のコメントでどうぞ。",
  empty: "いま整理しているところです。もう少し待ってください。",
  searchLabel: "曲名・アーティスト名でしぼりこむ",
  searchPlaceholder: "曲名やアーティスト名",
  practicingLabel: "練習中",
} as const;

/** 表示用に、アーティストと曲を読み（無ければ名前）で並べ替える */
export function sortedArtists(artists: readonly Artist[]): readonly Artist[] {
  const key = (a: { reading?: string; name?: string; title?: string }) =>
    (a.reading ?? a.name ?? a.title ?? "").toLowerCase();
  return [...artists]
    .sort((a, b) => key(a).localeCompare(key(b), "ja"))
    .map((artist) => ({
      ...artist,
      songs: [...artist.songs].sort((a, b) => key(a).localeCompare(key(b), "ja")),
    }));
}

export function songCount(artists: readonly Artist[]): number {
  return artists.reduce((total, artist) => total + artist.songs.length, 0);
}

/* ------------------------------------------------------------------
   保存先から読んだ JSON / 管理画面から送られてきた JSON を整える。

   保存先のファイルは手で書き換えられるし、Server Action は UI を通さずに
   直接叩ける。どちらも「型が付いているから正しい」とは言えないので、
   ここを通ったものだけを SongsData として扱う。
   ------------------------------------------------------------------ */

/** 文字列以外は捨てる。前後の空白も落とす */
function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** 空文字なら「無い」として扱いたいので、undefined に寄せる */
function optionalText(value: unknown): string | undefined {
  const trimmed = text(value);
  return trimmed === "" ? undefined : trimmed;
}

function parseSong(raw: unknown): Song | null {
  if (typeof raw !== "object" || raw === null) return null;
  const source = raw as Record<string, unknown>;
  const title = text(source.title);
  // 曲名の無い行は、入力途中の空行とみなして落とす
  if (title === "") return null;

  const song: Song = { title };
  const reading = optionalText(source.reading);
  const key = optionalText(source.key);
  const note = optionalText(source.note);
  const link = optionalText(source.link);
  if (reading) song.reading = reading;
  if (key) song.key = key;
  if (note) song.note = note;
  // http(s) 以外は javascript: などを踏みうるので落とす
  if (link && /^https?:\/\//i.test(link)) song.link = link;
  if (source.practicing === true) song.practicing = true;
  return song;
}

function parseArtist(raw: unknown): Artist | null {
  if (typeof raw !== "object" || raw === null) return null;
  const source = raw as Record<string, unknown>;
  const name = text(source.name);
  if (name === "") return null;

  const songs = Array.isArray(source.songs)
    ? source.songs.map(parseSong).filter((song): song is Song => song !== null)
    : [];
  // 曲が1つも無いアーティストは一覧に出しても意味がない
  if (songs.length === 0) return null;

  const artist: Artist = { name, songs };
  const reading = optionalText(source.reading);
  if (reading) artist.reading = reading;
  return artist;
}

/** 何が来ても SongsData を返す。読めない部分は黙って落ちる */
export function parseSongsData(raw: unknown): SongsData {
  if (typeof raw !== "object" || raw === null) return emptySongsData;
  const source = raw as Record<string, unknown>;
  if (!Array.isArray(source.artists)) return emptySongsData;

  const artists = source.artists
    .map(parseArtist)
    .filter((artist): artist is Artist => artist !== null);
  return { artists };
}
