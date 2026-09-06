import { About } from "@/components/About";
import { Activities } from "@/components/Activities";
import { Character } from "@/components/Character";
import { Hero } from "@/components/Hero";
import { Roboto } from "@/components/Roboto";
import { songCount } from "@/content/songs";
import { loadSongs } from "@/lib/songs-store";

/**
 * 曲数を出すぶんだけ曲データを読む。保存時に revalidatePath("/") で作り直されるが、
 * それが何かの拍子に届かなかったときのために、1時間で自然に古くなるようにもしておく。
 */
export const revalidate = 3600;

export default async function Page() {
  const { artists } = await loadSongs();

  return (
    <>
      <Hero />
      <About />
      <Activities songCount={songCount(artists)} />
      <Character />
      <Roboto />
    </>
  );
}
