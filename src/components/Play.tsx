import { playPage } from "@/content/site";
import { RobotoDive } from "@/components/RobotoDive";
import { SectionHead } from "@/components/SectionHead";

/**
 * /play の中身。動かないところ（見出し・遊び方）はサーバー側で出して、
 * canvas とループだけをクライアントに渡す。
 *
 * JS が動かない環境では遊べないが、ページそのものは読める。
 */
export function Play() {
  return (
    <section className="section" id="play" aria-labelledby="play-title">
      <div className="container">
        <SectionHead
          id="play"
          level={1}
          label={playPage.label}
          title={playPage.title}
          intro={playPage.intro}
        />

        <RobotoDive />

        <noscript>
          <p className="dive__noscript">{playPage.noscript}</p>
        </noscript>

        <div className="dive__rules">
          <h2 className="dive__rulesHead">遊びかた</h2>
          <ul>
            {playPage.rules.map((rule) => (
              <li key={rule.slice(0, 10)}>{rule}</li>
            ))}
          </ul>
          <p className="dive__note">{playPage.note}</p>
        </div>
      </div>
    </section>
  );
}
