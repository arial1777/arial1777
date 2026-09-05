import type { MetadataRoute } from "next";

import { SITE_URL } from "@/content/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // /admin はベーシック認証で閉じているが、URL をたどられる理由もないので伏せる
    rules: [{ userAgent: "*", allow: "/", disallow: "/admin" }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
