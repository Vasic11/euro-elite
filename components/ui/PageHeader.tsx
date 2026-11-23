/** Naslov stranice: isti stil na svim stranicama. */
export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <header className="mb-8">
      <h1 className="font-display text-5xl leading-none font-extrabold uppercase sm:text-6xl">
        {title}
      </h1>
      {description && <p className="text-ink-muted mt-3 max-w-xl">{description}</p>}
    </header>
  );
}
