import type { Metadata } from "next";

import { Works } from "@/components/Works";
import { worksPage } from "@/content/site";

export const metadata: Metadata = {
  title: worksPage.title,
  description: worksPage.description,
  alternates: { canonical: "/works" },
  openGraph: {
    title: worksPage.title,
    description: worksPage.description,
    url: "/works",
  },
  twitter: {
    title: worksPage.title,
    description: worksPage.description,
  },
};

export default function WorksRoute() {
  return <Works />;
}
