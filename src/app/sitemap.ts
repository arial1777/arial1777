import type { MetadataRoute } from "next";

import { SITE_URL } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: `${SITE_URL}/`, lastModified, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/works`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    // 曲は管理画面から随時足されるので、トップやプロダクトより更新が早い
    { url: `${SITE_URL}/songs`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    // ゲームは中身が変わらない。おまけなので優先度も低くしておく
    { url: `${SITE_URL}/play`, lastModified, changeFrequency: "yearly", priority: 0.5 },
  ];
}
