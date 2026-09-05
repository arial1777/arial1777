import Link from "next/link";

import { activities, works } from "@/content/site";
import { SectionHead } from "@/components/SectionHead";

/**
 * 三つの活動。中身が別ページに出てからは、ここがそのまま目次になっている。
 * どのくらいの分量があるのかが押す前に分かるよう、カードに数を添える。
 */
export function Activities({ songCount }: { songCount: number }) {
  const metricText = (metric: string | undefined) => {
    if (metric === "songs") return songCount > 0 ? `${songCount}曲` : null;
    if (metric === "works") return `${works.length}件`;
    return null;
  };

  return (
    <section className="section" id="activities" aria-labelledby="activities-title">
      <div className="container">
        <SectionHead id="activities" label="Activities" title="三つの活動" />

        <ul className="activities">
          {activities.map((activity) => {
            const metric = metricText(activity.metric);

            return (
              <li className="activity" key={activity.index}>
                <p className="activity__index">{activity.index}</p>
                <h3 className="activity__title">
                  {activity.title}
                  {metric ? <span className="activity__metric">{metric}</span> : null}
                </h3>
                <p className="activity__body">{activity.body}</p>
                {activity.link ? (
                  <p className="activity__link">
                    <Link href={activity.link.href}>
                      {activity.link.label}
                      <span aria-hidden="true">→</span>
                    </Link>
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
