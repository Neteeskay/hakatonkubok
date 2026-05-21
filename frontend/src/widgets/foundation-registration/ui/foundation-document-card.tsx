"use client";

import { ExternalLink, FileUp, Trash2 } from "lucide-react";
import { useRef, type ChangeEvent } from "react";
import { resolveApiFileUrl } from "@/shared/api/config";
import { cn } from "@/shared/lib/utils";
import { documentStatusConfig, type FoundationDocumentItem } from "@/widgets/foundation-registration/foundation-registration-data";

export function FoundationDocumentCard({ document, onUpload, onRemove }: { document: FoundationDocumentItem; onUpload?: (file: File) => void; onRemove?: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const status = documentStatusConfig[document.status];
  const Icon = status.icon;
  const uploaded = Boolean(document.fileName);
  const fileUrl = resolveApiFileUrl(document.fileUrl);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      onUpload?.(file);
    }
    event.target.value = "";
  }

  return (
    <article className="group rounded-[1.25rem] bg-white p-4 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.055),0_16px_40px_rgba(34,28,8,0.045)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[inset_0_0_0_1px_rgba(24,20,7,0.07),0_20px_52px_rgba(34,28,8,0.07)]">
      <div className="flex items-start gap-4">
        <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#fffdf7]">
          <FileUp className="size-5 text-black/64" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-black">{document.title}</h3>
            <span className={cn("inline-flex min-h-7 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-black", status.className)}>
              <Icon className="size-3.5" />
              {status.label}
            </span>
          </div>
          <p className="mt-1 text-xs font-bold leading-5 text-black/48">{document.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {uploaded ? <span className="rounded-full bg-[#f4f3ee] px-3 py-1.5 text-[11px] font-black text-black/56">{document.fileName}</span> : null}
            <span className="text-[11px] font-bold text-black/38">{status.helper}</span>
          </div>
          <div className="mt-4 flex gap-2">
            <input ref={inputRef} type="file" className="sr-only" onChange={handleFileChange} />
            <button type="button" onClick={() => inputRef.current?.click()} className="h-9 rounded-xl bg-brand px-3 text-xs font-black text-black">{uploaded ? "Заменить файл" : "Загрузить"}</button>
            {fileUrl ? (
              <a href={fileUrl} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-white px-3 text-xs font-black text-black/62 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.08)]">
                Открыть
                <ExternalLink className="size-3.5" />
              </a>
            ) : null}
            {uploaded ? (
              <button type="button" onClick={onRemove} className="grid size-9 place-items-center rounded-xl bg-[#fff1f1] text-[#c83c3c]">
                <Trash2 className="size-4" />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
