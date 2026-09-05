import { getImageProps } from "next/image";
import Link from "next/link";

import bannerWide from "@assets/hero/hero-banner-wide.jpg";
import bgTall from "@assets/hero/hero-bg-tall.jpg";
import { site } from "@/content/site";

/**
 * ヒーローの背景は画面の向きで絵を変える（アートディレクション）。
 * 横長はキャラクター入りのバナー、縦長は水面だけの絵。
 * 縦長のほうは見出しが上に来るので、絵の側で上部を暗く空けてある。
 * <picture> に出し分けさせつつ next/image の最適化を効かせるため getImageProps を使う。
 */
const common = { alt: "", sizes: "100vw", quality: 72, priority: true } as const;
const {
  props: { srcSet: wideSrcSet },
} = getImageProps({ ...common, src: bannerWide });
const { props: tallProps } = getImageProps({ ...common, src: bgTall });

export function Hero() {
  return (
    <section className="hero" id="top">
      <picture className="hero__media">
        <source media="(min-width: 900px)" srcSet={wideSrcSet} />
        {/* 装飾なので alt は空。人物の説明は About 側の画像が担う */}
        <img {...tallProps} className="hero__mediaImg" alt="" />
      </picture>
      <div className="hero__scrim" aria-hidden="true" />

      <div className="container hero__inner">
        <div className="hero__copy">
          <h1 className="hero__title">
            {site.taglineParts.map((part) => (
              <span key={part}>{part}</span>
            ))}
          </h1>
          <p className="hero__sub">{site.subTagline}</p>

          <ul className="hero__roles">
            {site.roles.map((role) => (
              <li key={role}>{role}</li>
            ))}
          </ul>

          <Link className="hero__cta" href="/works">
            つくったものを見る
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
