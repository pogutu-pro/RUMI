/** The same plain header on every public page: a title and one sentence. */
export function PageIntro({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="max-w-2xl">
      <h1 className="text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">{title}</h1>
      {children && <p className="mt-4 text-lg leading-relaxed text-gray-600">{children}</p>}
    </div>
  );
}
