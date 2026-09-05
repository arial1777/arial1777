import type { Metadata } from "next";

import { Songs } from "@/components/Songs";
import { songsPage } from "@/content/songs";

export const metadata: Metadata = {
  title: songsPage.title,
  description: songsPage.description,
  alternates: { canonical: "/songs" },
  openGraph: {
    title: songsPage.title,
    description: songsPage.description,
    url: "/songs",
  },
  twitter: {
    title: songsPage.title,
    description: songsPage.description,
  },
};

/** トップと同じく、保存時の revalidate が届かなかったときの保険 */
export const revalidate = 3600;

export default function SongsRoute() {
  return <Songs />;
}
