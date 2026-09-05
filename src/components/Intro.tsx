import type { CSSProperties } from "react";

import { site } from "@/content/site";

/**
 * 開幕アニメーション（幕）。ページを開いた最初の一度だけ、水面に落ちた
 * 一滴から波紋が広がって名前が浮かび上がる、という筋書きを見せる。
 *
 * 中身は CSS のキーフレームだけで動く。JS を待たずに始まってほしいのと、
 * 途中で React が入ってくると幕の時間が端末の速さでぶれるため。
 * MotionRuntime は「飛ばす」ときにだけ html[data-intro="skip"] を立てる。
 *
 * 装飾なので aria-hidden。読み上げには本文の h1 がそのまま届く。
 */
export function Intro() {
  return (
    <div className="intro" aria-hidden="true">
      <div className="intro__water">
        <span className="intro__ring" />
        <span className="intro__ring" />
        <span className="intro__ring" />
      </div>

      <div className="intro__inner">
        <p className="intro__mark">
          {[...site.name].map((char, index) => (
            <span key={`${char}${index}`} style={{ "--i": index } as CSSProperties}>
              {char}
            </span>
          ))}
        </p>
        <span className="intro__rule" />
        <p className="intro__sub">{site.reading}</p>
      </div>
    </div>
  );
}
