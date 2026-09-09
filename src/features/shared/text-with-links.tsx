"use client";

export function TextWithLinks({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  const urlPattern = /\b(?:https?:\/\/|www\.)[^\s<]+/gi;
  const parts: React.ReactNode[] = [];
  let cursor = 0;

  for (const match of children.matchAll(urlPattern)) {
    const start = match.index;
    let url = match[0];
    let trailing = "";

    while (/[.,!?;:]$/.test(url)) {
      trailing = `${url.at(-1)}${trailing}`;
      url = url.slice(0, -1);
    }
    while (
      url.endsWith(")") &&
      (url.match(/\)/g)?.length ?? 0) > (url.match(/\(/g)?.length ?? 0)
    ) {
      trailing = `)${trailing}`;
      url = url.slice(0, -1);
    }

    parts.push(children.slice(cursor, start));
    const href = url.startsWith("www.") ? `https://${url}` : url;
    parts.push(
      <a
        key={`${start}-${url}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(event) => {
          event.stopPropagation();
          if (!window.confirm(`¿Querés abrir este enlace?\n\n${href}`)) {
            event.preventDefault();
          }
        }}
        className="font-medium text-cyan-200 underline decoration-cyan-200/35 underline-offset-2 transition-colors hover:text-cyan-100"
      >
        {url}
      </a>,
    );
    parts.push(trailing);
    cursor = start + match[0].length;
  }

  parts.push(children.slice(cursor));
  return <span className={className}>{parts}</span>;
}
