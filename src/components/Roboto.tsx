import Image from "next/image";
import Link from "next/link";

import chibi from "@assets/characters/chibi/arial-chibi-2.png";
import mascot from "@assets/roboto/roboto.png";
import { playPage, roboto } from "@/content/site";
import { SectionHead } from "@/components/SectionHead";

export function Roboto() {
  return (
    <section className="section" id="roboto" aria-labelledby="roboto-title">
      <div className="container">
        <SectionHead id="roboto" label="Partner" title="相棒のこと" />

        <div className="roboto" data-reveal>
          <div className="roboto__figure">
            <Image
              className="roboto__chibi"
              src={chibi}
              alt=""
              width={76}
              height={100}
            />
            <Image
              className="roboto__mascot"
              src={mascot}
              alt="相棒のろぼと。水色の小さな対話ロボット"
              width={128}
              height={157}
            />
            {/* 吹き出しだけ少し遅れて、ぽんと出る */}
            <p className="roboto__bubble" data-reveal>
              {roboto.speech}
            </p>
          </div>

          <div className="roboto__text">
            <h3 className="visually-hidden">{roboto.heading}</h3>
            {roboto.body.map((paragraph) => (
              <p key={paragraph.slice(0, 12)}>{paragraph}</p>
            ))}

            {/* ゲームの入口はここだけ。ナビには出していない */}
            <p className="roboto__play">
              <Link href="/play">
                {playPage.title}であそぶ
                <span aria-hidden="true">→</span>
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
