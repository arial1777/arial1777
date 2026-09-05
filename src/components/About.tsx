import type { CSSProperties } from "react";
import Image from "next/image";

import bust from "@assets/characters/arial-bust-framed.jpg";
import { about } from "@/content/site";
import { SectionHead } from "@/components/SectionHead";

export function About() {
  return (
    <section className="section section--alt" id="about" aria-labelledby="about-title">
      <div className="container">
        <SectionHead id="about" label="About" title="つくることと、うたうこと。" />

        <div className="about">
          <div className="about__art" data-reveal>
            <Image
              src={bust}
              alt="arial のバストアップ。水の輪と音符に囲まれている"
              sizes="(max-width: 900px) 90vw, 326px"
              placeholder="blur"
            />
          </div>

          <div className="about__text">
            <p className="about__lead" data-reveal>
              {about.lead}
            </p>
            {about.paragraphs.map((paragraph, index) => (
              <p
                key={paragraph.slice(0, 12)}
                data-reveal
                style={{ "--i": index + 1 } as CSSProperties}
              >
                {paragraph}
              </p>
            ))}

            <dl className="profile" data-reveal>
              {about.profile.map((row) => (
                <div key={row.label} style={{ display: "contents" }}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
