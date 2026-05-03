type Props = { title: string; content?: string | null; icon?: React.ReactNode };

export function PlaybookArticleSection({ title, content, icon }: Props) {
  if (!content || !content.trim()) return null;
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        {icon}
        {title}
      </h2>
      <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">{content}</div>
    </section>
  );
}
