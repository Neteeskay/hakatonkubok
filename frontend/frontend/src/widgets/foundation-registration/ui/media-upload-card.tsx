"use client";

import { ImagePlus } from "lucide-react";
import { cn } from "@/shared/lib/utils";

export function MediaUploadCard({ title, description, uploaded, variant, onUpload }: { title: string; description: string; uploaded: boolean; variant: "logo" | "cover"; onUpload: () => void }) {
  return (
    <button
      type="button"
      onClick={onUpload}
      className={cn(
        "relative overflow-hidden rounded-[1.35rem] bg-[#fffdf7] p-4 text-left shadow-[inset_0_0_0_1px_rgba(24,20,7,0.07)] transition hover:-translate-y-0.5 hover:bg-brand/10",
        variant === "cover" && "min-h-[180px]",
        variant === "logo" && "min-h-[180px]"
      )}
    >
      <div className={cn("absolute bg-brand/70 shadow-[0_18px_44px_rgba(255,227,0,0.22)]", variant === "logo" ? "right-5 top-5 size-20 rounded-full" : "inset-x-0 bottom-0 h-20 rounded-t-[50%]")} />
      <div className="relative z-10">
        <span className="grid size-11 place-items-center rounded-2xl bg-white">
          <ImagePlus className="size-5" />
        </span>
        <p className="mt-4 text-lg font-black">{title}</p>
        <p className="mt-1 max-w-xs text-xs font-bold leading-5 text-black/48">{description}</p>
        <span className={cn("mt-4 inline-flex rounded-full px-3 py-1.5 text-xs font-black", uploaded ? "bg-[#e8f8eb] text-[#247a31]" : "bg-white text-black/52")}>
          {uploaded ? "Загружено" : "Загрузить"}
        </span>
      </div>
    </button>
  );
}
