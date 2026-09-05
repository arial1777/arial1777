"use client";

import { startTransition, useActionState, useEffect, useMemo, useState } from "react";

import type { Artist, SongsData } from "@/content/songs";
import { saveSongsAction, type SaveState } from "./actions";

/**
 * 曲の入力画面。
 *
 * 入力中は「まだ空の行」を持てる必要があるので、公開側の型（省略可能な項目が
 * undefined になる）ではなく、全項目が文字列で埋まった編集用の型を持つ。
 * 保存するときに空文字を落として SongsData に戻す。
 */

type SongRow = {
  id: string;
  title: string;
  reading: string;
  key: string;
  note: string;
  link: string;
  practicing: boolean;
};

type ArtistRow = {
  id: string;
  name: string;
  reading: string;
  songs: SongRow[];
};

/**
 * React の key 用の id。
 * 初期表示ぶんは添字から作る（サーバーとクライアントで同じ値になるように）。
 * 後から足した行だけ、重ならない値を採番する。
 */
let sequence = 0;
function nextId(prefix: string): string {
  sequence += 1;
  return `${prefix}-new${sequence}`;
}

function toRows(artists: readonly Artist[]): ArtistRow[] {
  return artists.map((artist, artistIndex) => ({
    id: `a${artistIndex}`,
    name: artist.name,
    reading: artist.reading ?? "",
    songs: artist.songs.map((song, songIndex) => ({
      id: `a${artistIndex}s${songIndex}`,
      title: song.title,
      reading: song.reading ?? "",
      key: song.key ?? "",
      note: song.note ?? "",
      link: song.link ?? "",
      practicing: song.practicing === true,
    })),
  }));
}

/** 保存用の形に戻す。空行落としや URL の確認はサーバー側でもう一度やる */
function toData(rows: ArtistRow[]): SongsData {
  return {
    artists: rows.map((artist) => ({
      name: artist.name.trim(),
      reading: artist.reading.trim() || undefined,
      songs: artist.songs.map((song) => ({
        title: song.title.trim(),
        reading: song.reading.trim() || undefined,
        key: song.key.trim() || undefined,
        note: song.note.trim() || undefined,
        link: song.link.trim() || undefined,
        practicing: song.practicing || undefined,
      })),
    })),
  };
}

function emptySong(): SongRow {
  return {
    id: nextId("s"),
    title: "",
    reading: "",
    key: "",
    note: "",
    link: "",
    practicing: false,
  };
}

function emptyArtist(): ArtistRow {
  return { id: nextId("a"), name: "", reading: "", songs: [emptySong()] };
}

const initialState: SaveState = { status: "idle" };

export function SongsEditor({
  initialArtists,
  storeLabel,
}: {
  initialArtists: readonly Artist[];
  storeLabel: string;
}) {
  const [rows, setRows] = useState<ArtistRow[]>(() => toRows(initialArtists));
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    JSON.stringify(toData(toRows(initialArtists))),
  );
  const [state, save, saving] = useActionState(saveSongsAction, initialState);

  const payload = useMemo(() => JSON.stringify(toData(rows)), [rows]);
  const dirty = payload !== savedSnapshot;

  // 保存が通ったら、その時点の内容を「保存済み」の基準に置き換える。
  // payload を依存に入れると保存後の打鍵でも走ってしまうので、結果だけを見る。
  useEffect(() => {
    if (state.status === "saved") setSavedSnapshot(state.payload);
  }, [state]);

  // 書きかけのまま閉じるのを止める
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const updateArtist = (id: string, patch: Partial<ArtistRow>) =>
    setRows((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));

  const updateSong = (artistId: string, songId: string, patch: Partial<SongRow>) =>
    setRows((prev) =>
      prev.map((artist) =>
        artist.id === artistId
          ? {
              ...artist,
              songs: artist.songs.map((song) =>
                song.id === songId ? { ...song, ...patch } : song,
              ),
            }
          : artist,
      ),
    );

  const addArtist = () => setRows((prev) => [...prev, emptyArtist()]);

  const removeArtist = (id: string, label: string) => {
    if (!window.confirm(`「${label || "名前未入力"}」を曲ごと消します。よろしいですか？`)) {
      return;
    }
    setRows((prev) => prev.filter((artist) => artist.id !== id));
  };

  const addSong = (artistId: string) =>
    setRows((prev) =>
      prev.map((artist) =>
        artist.id === artistId ? { ...artist, songs: [...artist.songs, emptySong()] } : artist,
      ),
    );

  const removeSong = (artistId: string, songId: string) =>
    setRows((prev) =>
      prev.map((artist) =>
        artist.id === artistId
          ? { ...artist, songs: artist.songs.filter((song) => song.id !== songId) }
          : artist,
      ),
    );

  /** 公開ページと同じ並び（よみ、無ければ名前）に揃える。入力中に勝手には動かさない */
  const sortByReading = () => {
    const order = (value: { reading: string; name?: string; title?: string }) =>
      (value.reading || value.name || value.title || "").toLowerCase();
    setRows((prev) =>
      [...prev]
        .sort((a, b) => order(a).localeCompare(order(b), "ja"))
        .map((artist) => ({
          ...artist,
          songs: [...artist.songs].sort((a, b) => order(a).localeCompare(order(b), "ja")),
        })),
    );
  };

  const submit = () => startTransition(() => save(payload));

  const named = rows.flatMap((artist) => artist.songs.filter((song) => song.title.trim() !== ""));
  const practicingCount = named.filter((song) => song.practicing).length;

  const saveButton = (
    <button
      type="button"
      className="admin__button admin__button--primary"
      onClick={submit}
      disabled={saving || !dirty}
    >
      {saving ? "保存中…" : dirty ? "保存する" : "保存済み"}
    </button>
  );

  return (
    <div className="admin">
      <div className="admin__bar">
        <p className="admin__counts">
          <strong>{rows.length}</strong> アーティスト / <strong>{named.length}</strong> 曲
          {practicingCount > 0 ? `（うち練習中 ${practicingCount}）` : null}
        </p>
        <div className="admin__barActions">
          <button type="button" className="admin__button" onClick={sortByReading}>
            よみ順に並べ替え
          </button>
          {saveButton}
        </div>
      </div>

      <p className="admin__status" role="status" aria-live="polite">
        {state.status === "error" ? (
          <span className="admin__status--error">{state.message}</span>
        ) : dirty ? (
          "保存していない変更があります。"
        ) : state.status === "saved" ? (
          <span className="admin__status--ok">{state.message}</span>
        ) : (
          `保存先: ${storeLabel}`
        )}
      </p>

      {rows.length === 0 ? (
        <p className="admin__empty">
          まだ1曲も入っていません。「アーティストを追加」から始めてください。
        </p>
      ) : null}

      {rows.map((artist) => (
        <section className="adminArtist" key={artist.id}>
          <div className="adminArtist__head">
            <label className="adminField adminField--grow">
              <span className="adminField__label">アーティスト名</span>
              <input
                className="adminField__input"
                value={artist.name}
                onChange={(event) => updateArtist(artist.id, { name: event.target.value })}
                placeholder="あいみょん"
                autoComplete="off"
              />
            </label>
            <label className="adminField adminField--grow">
              <span className="adminField__label">よみ</span>
              <input
                className="adminField__input"
                value={artist.reading}
                onChange={(event) => updateArtist(artist.id, { reading: event.target.value })}
                placeholder="あいみょん"
                autoComplete="off"
              />
            </label>
            <button
              type="button"
              className="admin__button admin__button--danger"
              onClick={() => removeArtist(artist.id, artist.name)}
            >
              アーティストごと削除
            </button>
          </div>

          {artist.name.trim() === "" ? (
            <p className="adminArtist__warn">
              アーティスト名が空のままだと、保存のときにこのまとまりごと消えます。
            </p>
          ) : null}

          <ul className="adminSongs">
            {artist.songs.map((song) => (
              <li className="adminSong" key={song.id}>
                <label className="adminField adminField--grow">
                  <span className="adminField__label">曲名</span>
                  <input
                    className="adminField__input"
                    value={song.title}
                    onChange={(event) =>
                      updateSong(artist.id, song.id, { title: event.target.value })
                    }
                    placeholder="マリーゴールド"
                    autoComplete="off"
                  />
                </label>
                <label className="adminField adminField--grow">
                  <span className="adminField__label">よみ</span>
                  <input
                    className="adminField__input"
                    value={song.reading}
                    onChange={(event) =>
                      updateSong(artist.id, song.id, { reading: event.target.value })
                    }
                    placeholder="まりーごーるど"
                    autoComplete="off"
                  />
                </label>
                <label className="adminField adminField--key">
                  <span className="adminField__label">キー</span>
                  <input
                    className="adminField__input"
                    value={song.key}
                    onChange={(event) => updateSong(artist.id, song.id, { key: event.target.value })}
                    placeholder="-2"
                    autoComplete="off"
                  />
                </label>
                <label className="adminField adminField--grow">
                  <span className="adminField__label">備考</span>
                  <input
                    className="adminField__input"
                    value={song.note}
                    onChange={(event) =>
                      updateSong(artist.id, song.id, { note: event.target.value })
                    }
                    autoComplete="off"
                  />
                </label>
                <label className="adminField adminField--grow">
                  <span className="adminField__label">リンク</span>
                  <input
                    className="adminField__input"
                    type="url"
                    value={song.link}
                    onChange={(event) =>
                      updateSong(artist.id, song.id, { link: event.target.value })
                    }
                    placeholder="https://youtu.be/..."
                    autoComplete="off"
                  />
                </label>

                <label className="adminCheck">
                  <input
                    type="checkbox"
                    checked={song.practicing}
                    onChange={(event) =>
                      updateSong(artist.id, song.id, { practicing: event.target.checked })
                    }
                  />
                  練習中
                </label>

                <button
                  type="button"
                  className="admin__button admin__button--icon"
                  onClick={() => removeSong(artist.id, song.id)}
                  aria-label={`${song.title || "この曲"} を削除`}
                  title="この曲を削除"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>

          <button type="button" className="admin__button" onClick={() => addSong(artist.id)}>
            曲を追加
          </button>
        </section>
      ))}

      <div className="admin__footer">
        <button type="button" className="admin__button" onClick={addArtist}>
          アーティストを追加
        </button>
        {saveButton}
      </div>
    </div>
  );
}
