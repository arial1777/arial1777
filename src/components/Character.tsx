import type { CSSProperties } from "react";
import Image, { type StaticImageData } from "next/image";

import angleBack from "@assets/characters/angle/arial-angle-5.png";
import angleDiagonal from "@assets/characters/angle/arial-angle-2.png";
import angleFront from "@assets/characters/angle/arial-angle-1.png";
import angleLeft from "@assets/characters/angle/arial-angle-3.png";
import angleRight from "@assets/characters/angle/arial-angle-4.png";
import fullScene from "@assets/characters/arial-full-scene.jpg";
import faceAngry from "@assets/characters/face/arial-angry.png";
import faceNormal from "@assets/characters/face/arial-normal.png";
import faceSad from "@assets/characters/face/arial-sad.png";
import faceShy from "@assets/characters/face/arial-shy.png";
import faceSinging from "@assets/characters/face/arial-singing.png";
import faceSmile from "@assets/characters/face/arial-smile.png";
import faceSmileClosed from "@assets/characters/face/arial-smile-closed.png";
import faceSurprised from "@assets/characters/face/arial-surprised.png";
import faceTroubled from "@assets/characters/face/arial-troubled.png";
import faceWink from "@assets/characters/face/arial-wink.png";
import { character } from "@/content/site";
import { SectionHead } from "@/components/SectionHead";

/**
 * 立ち絵の節。差分の絵はここ、ラベルは site.ts。Works と同じ分け方で、
 * 差分を増やすときは両方に1件ずつ足す（鍵が id）。
 */
const angleArt: Record<string, StaticImageData> = {
  front: angleFront,
  diagonal: angleDiagonal,
  left: angleLeft,
  right: angleRight,
  back: angleBack,
};

const faceArt: Record<string, StaticImageData> = {
  normal: faceNormal,
  smile: faceSmile,
  "smile-closed": faceSmileClosed,
  wink: faceWink,
  singing: faceSinging,
  surprised: faceSurprised,
  shy: faceShy,
  troubled: faceTroubled,
  sad: faceSad,
  angry: faceAngry,
};

/**
 * 差分の一覧。絵は飾りとして alt を空にし、読み上げは見出しとラベルに任せる
 * ——「arial の笑顔の表情」を10回読ませても、分かることは増えない。
 */
function DiffSet({
  id,
  heading,
  items,
  art,
}: {
  id: "angles" | "faces";
  heading: string;
  items: readonly { id: string; label: string }[];
  art: Record<string, StaticImageData>;
}) {
  const headingId = `character-${id}`;

  return (
    <div className="charSet">
      <h3 className="charSet__head" id={headingId} data-reveal>
        {heading}
      </h3>

      <ul className={`charSet__list charSet__list--${id}`} aria-labelledby={headingId}>
        {items.map((item, index) => (
          <li
            key={item.id}
            data-reveal
            // 一覧ごと画面に入るので、通し番号だと後ろが待たされる。
            // 横一列ぶんで折り返して、行ごとに左から出す
            style={{ "--i": index % 5 } as CSSProperties}
          >
            <Image src={art[item.id]} alt="" />
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Character() {
  return (
    <section
      className="section section--alt"
      id="character"
      aria-labelledby="character-title"
    >
      <div className="container">
        <SectionHead
          id="character"
          label={character.label}
          title={character.title}
          intro={character.intro}
        />

        <div className="character">
          <div className="character__art" data-reveal>
            <Image
              src={fullScene}
              alt={character.fullAlt}
              sizes="(max-width: 900px) 56vw, 321px"
              placeholder="blur"
            />
          </div>

          <div className="character__diffs">
            <DiffSet
              id="angles"
              heading={character.angles.heading}
              items={character.angles.items}
              art={angleArt}
            />
            <DiffSet
              id="faces"
              heading={character.faces.heading}
              items={character.faces.items}
              art={faceArt}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
