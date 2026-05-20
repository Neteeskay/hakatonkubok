import type { SkillOption } from "@/widgets/volunteer-profile/skills-dictionary";

export function SuggestionsDropdown({ suggestions, onSelect }: { suggestions: SkillOption[]; onSelect: (label: string) => void }) {
  if (!suggestions.length) return null;

  return (
    <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 overflow-hidden rounded-[1rem] bg-white shadow-[0_18px_48px_rgba(34,28,8,0.12),inset_0_0_0_1px_rgba(24,20,7,0.06)]">
      {suggestions.map((item) => (
        <button key={`${item.group}-${item.label}`} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => onSelect(item.label)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-brand/12">
          <span className="text-sm font-black text-black/72">{item.label}</span>
          <span className="rounded-full bg-[#f4f3ee] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-black/38">{item.group === "probono" ? "pro bono" : item.group}</span>
        </button>
      ))}
    </div>
  );
}
