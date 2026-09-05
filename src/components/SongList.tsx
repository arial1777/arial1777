"use client";

import { useMemo, useState } from "react";

import type { Artist } from "@/content/songs";
import { songsPage } from "@/content/songs";

/**
 * 曲のしぼりこみ。このサイトで唯一のクライアントコンポーネント。
 * 一覧そのものはサーバー側でもレンダリングされるので、JSが動かない環境でも
 * 全曲が読める（入力欄が効かなくなるだけ）。
 */

/** カタカナをひらがなに寄せる。「アイミョン」でも「あいみょん」でも引けるようにするため */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .replace(/[\s　]+/g, "");
}

export function SongList({ artists }: { artists: readonly Artist[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return artists;

    return artists
      .map((artist) => {
        const artistHit = normalize(`${artist.name}${artist.reading ?? ""}`).includes(q);
        if (artistHit) return artist;
        const songs = artist.songs.filter((song) =>
          normalize(`${song.title}${song.reading ?? ""}`).includes(q),
        );
        return songs.length ? { ...artist, songs } : null;
      })
      .filter((artist): artist is Artist => artist !== null);
  }, [artists, query]);

  const hitCount = filtered.reduce((total, artist) => total + artist.songs.length, 0);

  return (
    <>
      <div className="songSearch">
        <label className="songSearch__label" htmlFor="song-search">
          {songsPage.searchLabel}
        </label>
        <input
          id="song-search"
          className="songSearch__input"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={songsPage.searchPlaceholder}
          autoComplete="off"
        />
        <p className="songSearch__count" aria-live="polite">
          {query
            ? `${hitCount} 曲 / ${filtered.length} アーティスト`
            : `全 ${hitCount} 曲 / ${filtered.length} アーティスト`}
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className="songs__empty">
          「{query}」に当てはまる曲は見つかりませんでした。
        </p>
      ) : (
        <div className="songs">
          {filtered.map((artist) => (
            <section className="songGroup" key={artist.name}>
              <h2 className="songGroup__name">
                {artist.name}
                <span className="songGroup__count">{artist.songs.length}曲</span>
              </h2>
              <ul className="songGroup__list">
                {artist.songs.map((song) => (
                  <li className="song" key={song.title}>
                    <span className="song__title">
                      {song.link ? (
                        <a href={song.link} target="_blank" rel="noopener noreferrer">
                          {song.title}
                          <span aria-hidden="true">↗</span>
                        </a>
                      ) : (
                        song.title
                      )}
                    </span>
                    {song.practicing ? (
                      <span className="song__practicing">{songsPage.practicingLabel}</span>
                    ) : null}
                    {song.key ? <span className="song__key">key {song.key}</span> : null}
                    {song.note ? <span className="song__note">{song.note}</span> : null}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
