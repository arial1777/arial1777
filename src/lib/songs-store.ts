import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { get, put } from "@vercel/blob";

import { emptySongsData, parseSongsData, type SongsData } from "@/content/songs";
import seed from "@/content/songs.seed.json";

/**
 * 曲データの保存先。差し替えたくなったら触るのはこのファイルだけでよい。
 *
 * - 本番（Vercel）: Vercel Blob に JSON をひとつ置く。サーバーレスなのでディスクには書けない。
 * - それ以外（手元の next dev / 自前サーバー）: data/songs.json。
 *
 * どちらを使うかは BLOB_READ_WRITE_TOKEN の有無で決まる。Vercel でストアを
 * 接続すると自動で入る変数なので、手元では何も設定しなくてもファイルに落ちる。
 */

const BLOB_PATHNAME = "songs/songs.json";
const LOCAL_PATH = path.join(process.cwd(), "data", "songs.json");

function usesBlob(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/** 保存先の名前。管理画面で「どこに書いているか」を出すために使う */
export function storeLabel(): string {
  return usesBlob() ? "Vercel Blob" : "data/songs.json（ローカル）";
}

async function readRaw(): Promise<string | null> {
  if (usesBlob()) {
    // useCache: false で CDN を通さず origin から読む。保存直後に古い内容が
    // 返ってくると、管理画面で「保存したのに戻っている」ように見えるため。
    const result = await get(BLOB_PATHNAME, { access: "public", useCache: false });
    if (!result || result.statusCode !== 200) return null;
    return await new Response(result.stream).text();
  }

  try {
    return await readFile(LOCAL_PATH, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

async function writeRaw(body: string): Promise<void> {
  if (usesBlob()) {
    await put(BLOB_PATHNAME, body, {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
      // 最短が60秒。読み出し側は useCache: false なので、ここは短ければよい。
      cacheControlMaxAge: 60,
    });
    return;
  }

  await mkdir(path.dirname(LOCAL_PATH), { recursive: true });
  await writeFile(LOCAL_PATH, body, "utf8");
}

/**
 * 曲データを読む。
 *
 * 読めなかったときは例外を投げずに空を返す。この関数はトップページの
 * ビルド時プリレンダーからも呼ばれるので、保存先が未設定・未作成というだけで
 * ビルドやサイト全体を落としたくない。
 *
 * まだ一度も保存していないあいだは songs.seed.json を使う。デプロイ直後の
 * 真っさらな保存先でも一覧が出るようにするため。
 * 「保存された結果、空になった」ときは種を使わない——全部消したのに翌日
 * 元に戻っていた、では困る。readRaw() が null を返すのは保存先に何も無いときだけ。
 */
export async function loadSongs(): Promise<SongsData> {
  let raw: string | null;
  try {
    raw = await readRaw();
  } catch (error) {
    console.error("[songs] 保存先から読めませんでした", error);
    return emptySongsData;
  }
  if (raw === null) return parseSongsData(seed);

  try {
    return parseSongsData(JSON.parse(raw));
  } catch (error) {
    console.error("[songs] 保存されている JSON を解釈できませんでした", error);
    return emptySongsData;
  }
}

/** 曲データを保存する。読みと違い、失敗は呼び出し側に伝える（黙って消えると困る） */
export async function saveSongs(data: SongsData): Promise<void> {
  await writeRaw(`${JSON.stringify(parseSongsData(data), null, 2)}\n`);
}
