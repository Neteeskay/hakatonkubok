"use client";

import { useMemo, useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import type { SkillOption } from "@/widgets/volunteer-profile/skills-dictionary";
import { addSkill, cleanSkillLabel, findSkillSuggestions, hasSkill, isValidSkill, removeSkill } from "@/widgets/volunteer-profile/skill-utils";
import { SkillChip } from "@/widgets/volunteer-profile/ui/skill-chip";
import { SuggestionsDropdown } from "@/widgets/volunteer-profile/ui/suggestions-dropdown";

export function SkillsInput({
  label,
  description,
  value,
  onChange,
  groups,
  options,
  tone = "brand"
}: {
  label: string;
  description: string;
  value: string[];
  onChange: (skills: string[]) => void;
  groups: SkillOption["group"][];
  options?: SkillOption[];
  tone?: "brand" | "violet";
}) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const cleanQuery = cleanSkillLabel(query);
  const suggestions = useMemo(() => findSkillSuggestions(query, value, groups, options), [groups, options, query, value]);
  const duplicate = cleanQuery ? hasSkill(value, cleanQuery) : false;
  const invalid = cleanQuery.length > 0 && !isValidSkill(cleanQuery);
  const canAddCustom = cleanQuery.length > 1 && !duplicate && !invalid;

  function add(labelToAdd: string) {
    const next = addSkill(value, labelToAdd);
    onChange(next);
    setQuery("");
  }

  return (
    <div className="rounded-[1.25rem] bg-white p-4 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black">{label}</p>
          <p className="mt-1 text-xs font-bold leading-5 text-black/48">{description}</p>
        </div>
        <Sparkles className="size-5 shrink-0 text-brand" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {value.map((skill) => (
          <SkillChip key={skill} label={skill} tone={tone} onRemove={() => onChange(removeSkill(value, skill))} />
        ))}
      </div>

      <div className="relative mt-4">
        <div className="flex min-h-12 items-center gap-2 rounded-2xl bg-[#fffdf7] px-4 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.08)] focus-within:shadow-[inset_0_0_0_2px_rgba(255,227,0,0.88)]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => window.setTimeout(() => setFocused(false), 120)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                if (suggestions[0]) add(suggestions[0].label);
                else if (canAddCustom) add(cleanQuery);
              }
            }}
            placeholder="Начните вводить навык"
            className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-black/32"
          />
          <button type="button" disabled={!canAddCustom} onClick={() => add(cleanQuery)} className="grid size-8 place-items-center rounded-full bg-brand text-black transition hover:brightness-95 disabled:bg-[#ece8dc] disabled:text-black/28">
            <Plus className="size-4" />
          </button>
        </div>
        {focused || query ? <SuggestionsDropdown suggestions={suggestions} onSelect={add} /> : null}
      </div>

      <div className="mt-3 min-h-5">
        {duplicate ? <p className="text-xs font-bold text-[#c83c3c]">Такой навык уже добавлен.</p> : null}
        {invalid ? <p className="text-xs font-bold text-[#c83c3c]">Введите понятное название навыка без лишних символов.</p> : null}
      </div>
    </div>
  );
}
