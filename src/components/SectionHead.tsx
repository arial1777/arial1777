export function SectionHead({
  label,
  title,
  intro,
  id,
}: {
  label: string;
  title: string;
  intro?: string;
  id: string;
}) {
  return (
    <div className="section__head">
      <p className="section__label">{label}</p>
      <h2 className="section__title" id={`${id}-title`}>
        {title}
      </h2>
      {intro ? <p className="section__intro">{intro}</p> : null}
    </div>
  );
}
