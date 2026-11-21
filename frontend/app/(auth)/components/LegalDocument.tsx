import Link from "next/link";

type LegalSection = {
  title: string;
  paragraphs: string[];
};

type LegalDocumentProps = {
  title: string;
  introduction: string;
  sections: LegalSection[];
  relatedHref: string;
  relatedLabel: string;
};

export function LegalDocument({
  title,
  introduction,
  sections,
  relatedHref,
  relatedLabel,
}: LegalDocumentProps) {
  return (
    <main className="bg-background min-h-screen px-4 py-10 sm:px-8 sm:py-16">
      <article className="mx-auto max-w-3xl">
        <nav
          aria-label="Legal document navigation"
          className="mb-10 flex flex-wrap items-center gap-3 text-sm"
        >
          <Link
            className="text-primary underline-offset-4 hover:underline"
            href="/sign-up"
          >
            Back to sign up
          </Link>
          <span aria-hidden="true" className="text-muted-foreground">
            /
          </span>
          <Link
            className="text-primary underline-offset-4 hover:underline"
            href={relatedHref}
          >
            {relatedLabel}
          </Link>
        </nav>

        <header className="border-border border-b pb-8">
          <p className="text-primary mb-3 text-xs font-semibold tracking-[0.2em] uppercase">
            getINvolved · Draft for review
          </p>
          <h1 className="text-foreground text-3xl font-bold tracking-tight sm:text-5xl">
            {title}
          </h1>
          <p className="text-muted-foreground mt-5 max-w-2xl text-base leading-7">
            {introduction}
          </p>
        </header>

        <div className="flex flex-col gap-9 py-9">
          {sections.map(({ title: sectionTitle, paragraphs }) => (
            <section
              key={sectionTitle}
              className="grid gap-3 sm:grid-cols-[11rem_1fr] sm:gap-8"
            >
              <h2 className="text-foreground text-lg font-semibold">
                {sectionTitle}
              </h2>
              <div className="text-muted-foreground flex flex-col gap-3 text-sm leading-7 sm:text-base">
                {paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
