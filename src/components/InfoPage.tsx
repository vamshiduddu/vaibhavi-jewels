type InfoSection = {
  title: string;
  body: string[];
};

export default function InfoPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: InfoSection[];
}) {
  return (
    <section className="info-page">
      <div className="info-page-head">
        <p className="section-kicker">Vaibhavi Jewels</p>
        <h1>{title}</h1>
        <p>{intro}</p>
      </div>
      <div className="info-page-body">
        {sections.map((section) => (
          <article key={section.title} className="info-block">
            <h2>{section.title}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </article>
        ))}
      </div>
    </section>
  );
}
