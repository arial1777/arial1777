import type { CSSProperties } from "react";
import Image, { type StaticImageData } from "next/image";

import furatabiLogo from "@assets/works/furatabi-logo.png";
import oshinomiLogo from "@assets/works/oshinomi-logo.png";
import oshinomiShot from "@assets/works/oshinomi-lp.png";
import { works, worksPage, type Work } from "@/content/site";
import { SectionHead } from "@/components/SectionHead";

/** プロダクトの画像。文言（site.ts）と切り離しておく。 */
const media: Record<
  string,
  { logo: StaticImageData; shot?: StaticImageData; shotAlt?: string }
> = {
  oshinomi: {
    logo: oshinomiLogo,
    shot: oshinomiShot,
    shotAlt: "オシノミのトップ画面。推し活カレンダーの月表示",
  },
  furatabi: { logo: furatabiLogo },
};

function WorkCard({ work, index }: { work: Work; index: number }) {
  const { logo, shot, shotAlt } = media[work.slug];

  return (
    <article
      className={`work${shot ? " work--withShot" : ""}`}
      data-reveal
      style={{ "--i": index } as CSSProperties}
    >
      <div>
        <div className="work__head">
          <span className="work__logo">
            <Image src={logo} alt="" width={44} height={44} />
          </span>
          <h2 className="work__name">
            {work.name}
            <span className="work__reading">{work.reading}</span>
          </h2>
          <span className="work__status">{work.status}</span>
        </div>

        <p className="work__tagline">{work.tagline}</p>
        <p className="work__body">{work.body}</p>

        <div className="work__block">
          <h3 className="work__blockHead">なぜ作ったか</h3>
          <p className="work__blockBody">{work.why}</p>
        </div>

        {work.note ? (
          <div className="work__block work__block--accent">
            <h3 className="work__blockHead">{work.note.heading}</h3>
            <p className="work__blockBody">{work.note.body}</p>
          </div>
        ) : null}

        <ul className="work__stack" aria-label={`${work.name} の技術スタック`}>
          {work.stack.map((tech) => (
            <li key={tech}>{tech}</li>
          ))}
        </ul>

        <p className="work__links">
          {work.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {link.label}
              <span aria-hidden="true">↗</span>
            </a>
          ))}
        </p>
      </div>

      {shot ? (
        <div className="work__shot">
          <Image src={shot} alt={shotAlt ?? ""} width={232} height={502} />
        </div>
      ) : null}
    </article>
  );
}

/** /works ページの中身。個人開発でつくったものだけを並べる。 */
export function Works() {
  return (
    <section className="section" id="works" aria-labelledby="works-title">
      <div className="container">
        <SectionHead
          id="works"
          level={1}
          label={worksPage.label}
          title={worksPage.title}
          intro={worksPage.intro}
        />

        <div className="works">
          {works.map((work, index) => (
            <WorkCard key={work.slug} work={work} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
