export function SectionHead({
  label,
  title,
  intro,
  id,
  level = 2,
}: {
  label: string;
  title: string;
  intro?: string;
  id: string;
  /**
   * 見出しの階層。トップページは Hero が h1 を持っているので節は h2 だが、
   * 独立したページではこの見出し自体がページの h1 になる。
   */
  level?: 1 | 2;
}) {
  const Heading = level === 1 ? "h1" : "h2";

  return (
    <div className="section__head">
      <p className="section__label">{label}</p>
      <Heading className="section__title" id={`${id}-title`}>
        {title}
      </Heading>
      {intro ? <p className="section__intro">{intro}</p> : null}
    </div>
  );
}
