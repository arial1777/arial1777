import { SITE_URL, site, works } from "@/content/site";

/**
 * Person + WebSite の構造化データ。
 * 検索結果とAI検索の両方で「何をしている人か」を機械可読にしておく。
 */
export function personJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${SITE_URL}/#person`,
        name: site.name,
        alternateName: site.reading,
        description: site.description,
        url: SITE_URL,
        image: `${SITE_URL}/icon.png`,
        jobTitle: "プロダクトマネージャー",
        knowsAbout: [
          "プロダクトマネジメント",
          "個人開発",
          "弾き語り",
          "Webアプリケーション開発",
        ],
        subjectOf: works.map((work) => ({
          "@type": "SoftwareApplication",
          name: work.name,
          alternateName: work.reading,
          description: work.tagline,
          url: work.links[0]?.href,
          applicationCategory: "WebApplication",
          operatingSystem: "Web",
        })),
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: site.name,
        description: site.description,
        inLanguage: "ja",
        publisher: { "@id": `${SITE_URL}/#person` },
      },
    ],
  };
}
