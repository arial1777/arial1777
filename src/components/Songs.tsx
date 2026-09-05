import { SongList } from "@/components/SongList";
import { SectionHead } from "@/components/SectionHead";
import { songCount, songsPage, sortedArtists } from "@/content/songs";
import { loadSongs } from "@/lib/songs-store";

/** /songs ページの中身。曲は管理画面（/admin/songs）から入る。ここは読むだけ。 */
export async function Songs() {
  const { artists } = await loadSongs();

  return (
    <section className="section" id="songs" aria-labelledby="songs-title">
      <div className="container">
        <SectionHead
          id="songs"
          level={1}
          label={songsPage.label}
          title={songsPage.title}
          intro={songsPage.lead}
        />

        {songCount(artists) === 0 ? (
          <p className="songs__empty">{songsPage.empty}</p>
        ) : (
          <SongList artists={sortedArtists(artists)} />
        )}

        <p className="songs__note">{songsPage.note}</p>
      </div>
    </section>
  );
}
