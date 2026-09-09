"use client";

import { useState } from "react";

import { ConfirmationDialog } from "@/features/shared/confirmation-dialog";

export function TextWithLinks({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  const [pendingHref, setPendingHref] = useState<string | null>(null);
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
          event.preventDefault();
          setPendingHref(href);
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
  return (
    <>
      <span className={className}>{parts}</span>
      <ConfirmationDialog
        open={pendingHref !== null}
        title="Abrir enlace externo"
        description={
          <span className="break-all">
            Vas a salir de RTTP para visitar {pendingHref}.
          </span>
        }
        confirmLabel="Abrir enlace"
        onCancel={() => setPendingHref(null)}
        onConfirm={() => {
          if (!pendingHref) return;
          window.open(pendingHref, "_blank", "noopener,noreferrer");
          setPendingHref(null);
        }}
      />
    </>
  );
}
