export function JsonLd({ data }: { data: Record<string, unknown> | null | undefined }) {
  if (!data) return null;
  const graph = data["@graph"];
  if (Array.isArray(graph) && graph.length === 0) return null;
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
