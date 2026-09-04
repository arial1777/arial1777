import { activities } from "@/content/site";
import { SectionHead } from "@/components/SectionHead";

export function Activities() {
  return (
    <section className="section" id="activities" aria-labelledby="activities-title">
      <div className="container">
        <SectionHead id="activities" label="Activities" title="三つの活動" />

        <ul className="activities">
          {activities.map((activity) => (
            <li className="activity" key={activity.index}>
              <p className="activity__index">{activity.index}</p>
              <h3 className="activity__title">{activity.title}</h3>
              <p className="activity__body">{activity.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
