import type { Metadata } from "next";

import { sortedArtists } from "@/content/songs";
import { loadSongs, storeLabel } from "@/lib/songs-store";

import { SongsEditor } from "./SongsEditor";

export const metadata: Metadata = {
  title: "歌える曲の管理",
  robots: { index: false, follow: false },
};

/**
 * 保存した直後に古い内容が出ると「保存できていない」ように見えるので、
 * この画面は毎回サーバーで作り直す。
 */
export const dynamic = "force-dynamic";

export default async function AdminSongsPage() {
  const { artists } = await loadSongs();

  return (
    <main className="adminPage" id="main">
      <header className="adminPage__head">
        <h1 className="adminPage__title">歌える曲の管理</h1>
        <p className="adminPage__lead">
          ここで入力した内容が <a href="/songs">/songs</a> に出ます（トップページには曲数だけ）。
          公開側の並び順はよみ（無ければ名前）順で自動的に揃うので、入力の順番は気にしなくて構いません。
        </p>
      </header>

      {/* 入力途中の空行が消えないよう、並べ替えだけして中身はそのまま渡す */}
      <SongsEditor initialArtists={sortedArtists(artists)} storeLabel={storeLabel()} />
    </main>
  );
}
