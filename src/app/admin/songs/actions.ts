"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { parseSongsData, songCount } from "@/content/songs";
import { isAuthorized } from "@/lib/basic-auth";
import { saveSongs } from "@/lib/songs-store";

/**
 * 保存の結果。
 *
 * 失敗を例外で返すと Next.js の汎用エラー画面に飛んで入力中の内容が消えるので、
 * 成否は戻り値で伝えて画面に留まらせる。
 *
 * `payload` は受け取った JSON をそのまま返したもの。画面側はこれと手元の内容を
 * 見比べて「保存済みかどうか」を判断する。
 */
export type SaveState =
  | { status: "idle" }
  | { status: "saved"; message: string; payload: string }
  | { status: "error"; message: string };

export async function saveSongsAction(
  _previous: SaveState,
  payload: string,
): Promise<SaveState> {
  // 入口の proxy.ts でも弾いているが、Server Action は画面を通さず直接 POST
  // できるので、ここでも確かめる
  if (!isAuthorized((await headers()).get("authorization"))) {
    return {
      status: "error",
      message: "認証が確認できませんでした。ページを再読み込みしてください。",
    };
  }

  let data;
  try {
    data = parseSongsData(JSON.parse(payload));
  } catch {
    return { status: "error", message: "送信された内容を読めませんでした。" };
  }

  try {
    await saveSongs(data);
  } catch (error) {
    console.error("[songs] 保存に失敗しました", error);
    const detail = error instanceof Error ? error.message : String(error);
    return { status: "error", message: `保存できませんでした: ${detail}` };
  }

  // 公開側は静的に焼かれているので、作り直させる。
  // トップは曲数だけ、/songs は一覧そのものを出している。
  revalidatePath("/");
  revalidatePath("/songs");
  revalidatePath("/admin/songs");

  return {
    status: "saved",
    message: `保存しました（${data.artists.length} アーティスト / ${songCount(data.artists)} 曲）`,
    payload,
  };
}
