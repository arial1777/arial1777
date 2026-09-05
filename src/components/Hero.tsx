import type { CSSProperties } from "react";
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

/**
 * 立ちのぼる泡。位置・大きさ・速さを一粒ずつずらしてある。
 * 乱数だとサーバーとクライアントで食い違うので、数を並べて手で散らす。
 * left / size / duration / delay / 横流れ の順。
 */
const bubbles: readonly [string, string, string, string, string][] = [
  ["8%", "10px", "17s", "0.4s", "22px"],
  ["19%", "6px", "21s", "3.2s", "-16px"],
  ["31%", "14px", "15s", "1.6s", "34px"],
  ["44%", "7px", "23s", "5.4s", "-28px"],
  ["57%", "11px", "19s", "2.4s", "18px"],
  ["68%", "5px", "25s", "6.8s", "-12px"],
  ["79%", "13px", "16s", "4.2s", "26px"],
  ["91%", "8px", "22s", "0.9s", "-22px"],
];

export function Hero() {
  return (
    <section className="hero" id="top">
      <picture className="hero__media">
        <source media="(min-width: 900px)" srcSet={wideSrcSet} />
        {/* 装飾なので alt は空。人物の説明は About 側の画像が担う */}
        <img {...tallProps} className="hero__mediaImg" alt="" />
      </picture>

      {/* 水面のゆらぎ・光・泡。すべて飾りなので読み上げからは外す */}
      <div className="hero__caustics" aria-hidden="true" />
      <div className="hero__aurora" aria-hidden="true" />
      <div className="hero__scrim" aria-hidden="true" />
      <div className="hero__glow" aria-hidden="true" />
      <ul className="hero__bubbles" aria-hidden="true">
        {bubbles.map(([x, size, duration, delay, drift]) => (
          <li
            key={x}
            style={
              {
                "--x": x,
                "--size": size,
                "--d": duration,
                "--delay": delay,
                "--drift": drift,
              } as CSSProperties
            }
          />
        ))}
      </ul>

      <div className="container hero__inner">
        <div className="hero__copy">
          <h1 className="hero__title">
            {site.taglineParts.map((part, index) => (
              // 外側が窓、内側が下から上がってくる紙。窓で切るために二重にしている
              <span
                className="hero__titleLine"
                key={part}
                style={{ "--i": index } as CSSProperties}
              >
                <span className="hero__titleInner">{part}</span>
              </span>
            ))}
          </h1>
          <p className="hero__sub">{site.subTagline}</p>

          <ul className="hero__roles">
            {site.roles.map((role, index) => (
              <li key={role} style={{ "--i": index } as CSSProperties}>
                {role}
              </li>
            ))}
          </ul>

          <Link className="hero__cta" href="/works">
            <span className="hero__ctaLabel">つくったものを見る</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>

      <a className="hero__scroll" href="#about">
        <span className="hero__scrollLabel">Scroll</span>
        <span className="hero__scrollLine" aria-hidden="true" />
      </a>
    </section>
  );
}
