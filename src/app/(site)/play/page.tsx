import type { Metadata } from "next";

import { Play } from "@/components/Play";
import { playPage } from "@/content/site";

import "./game.css";

export const metadata: Metadata = {
  title: playPage.title,
  description: playPage.description,
  alternates: { canonical: "/play" },
  openGraph: {
    title: playPage.title,
    description: playPage.description,
    url: "/play",
  },
  twitter: {
    title: playPage.title,
    description: playPage.description,
  },
};

export default function PlayRoute() {
  return <Play />;
}
