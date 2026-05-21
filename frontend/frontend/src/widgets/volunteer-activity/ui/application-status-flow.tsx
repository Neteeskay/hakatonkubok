import { Check, Clock3, Flag, MessageCircle, Star, Workflow, X } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { applicationFlow, type VolunteerApplicationStage } from "@/widgets/volunteer-activity/activity-data";

const stageIndex: Record<VolunteerApplicationStage, number> = {
  pending: 1,
  accepted: 2,
  "in-progress": 3,
  completed: 4,
  hours: 5,
  rejected: 1
};

const flowIcons = [Clock3, MessageCircle, Check, Workflow, Flag, Star];

const toneClasses = {
  gold: "bg-brand text-black shadow-[0_14px_28px_rgba(255,227,0,0.22)]",
  blue: "bg-[#e9efff] text-[#315ed1] shadow-[0_14px_28px_rgba(49,94,209,0.1)]",
  green: "bg-[#e6f8e9] text-[#247a31] shadow-[0_14px_28px_rgba(36,122,49,0.09)]",
  violet: "bg-[#eee9ff] text-[#6b4de6] shadow-[0_14px_28px_rgba(107,77,230,0.1)]",
  mint: "bg-[#e6f8ef] text-[#237650] shadow-[0_14px_28px_rgba(35,118,80,0.09)]",
  cream: "bg-brand/20 text-black shadow-[0_14px_28px_rgba(255,227,0,0.12)]"
};

const labelClasses = {
  gold: "text-black",
  blue: "text-[#315ed1]",
  green: "text-[#247a31]",
  violet: "text-[#6b4de6]",
  mint: "text-[#237650]",
  cream: "text-black"
};

export function ApplicationStatusFlow({ stage, compact = false }: { stage: VolunteerApplicationStage; compact?: boolean }) {
  const activeIndex = stageIndex[stage];
  const rejected = stage === "rejected";

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        {applicationFlow.map((step, index) => {
          const Icon = flowIcons[index];
          const pastOrCurrent = !rejected && index <= activeIndex;
          const current = !rejected && index === activeIndex;
          return (
            <span key={step.key} className="flex items-center gap-1.5">
              {index !== 0 ? <span className="h-px w-6 border-t border-dashed border-black/12" /> : null}
              <span
                className={cn(
                  "grid size-8 place-items-center rounded-full transition",
                  toneClasses[step.tone],
                  !pastOrCurrent && "opacity-55",
                  current && "ring-4 ring-black/5"
                )}
                aria-label={step.label}
              >
                <Icon className="size-4" />
              </span>
            </span>
          );
        })}
        {rejected ? (
          <>
            <span className="h-px w-6 border-t border-dashed border-black/12" />
            <span className="grid size-8 place-items-center rounded-full bg-[#ffe8e8] text-[#c83c3c] ring-4 ring-[#ffe8e8]/70">
              <X className="size-4" />
            </span>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-[1.35rem] bg-white p-5 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.055)]">
      <p className="mb-5 text-sm font-black">Как работают статусы откликов</p>
      <div className="grid gap-4 md:grid-cols-6">
        {applicationFlow.map((step, index) => {
          const Icon = flowIcons[index];
          const pastOrCurrent = !rejected && index <= activeIndex;
          const current = !rejected && index === activeIndex;
          return (
            <div key={step.key} className="relative">
              {index !== 0 ? <span className="absolute -left-1/2 top-5 hidden h-px w-full border-t border-dashed border-black/12 md:block" /> : null}
              <div className="relative z-10 flex flex-col items-start gap-3 md:items-center md:text-center">
                <span
                  className={cn(
                    "grid size-11 place-items-center rounded-full transition",
                    toneClasses[step.tone],
                    !pastOrCurrent && "opacity-58",
                    current && "ring-4 ring-black/5"
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className={cn("text-sm font-black leading-5", labelClasses[step.tone], !pastOrCurrent && "opacity-72")}>{step.label}</p>
                  <p className="mt-1 text-xs font-bold leading-4 text-black/46">{step.helper}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-6 flex items-start gap-2 text-xs font-bold leading-5 text-black/54">
        <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-white shadow-[inset_0_0_0_1px_rgba(24,20,7,0.18)]">i</span>
        <p>После подтверждения выполнения задания фондом волонтёрские часы будут начислены в течение 1-3 дней.</p>
      </div>
      {rejected ? (
        <div className="mt-4 rounded-[1rem] bg-[#ffe8e8] p-3 text-sm font-bold text-[#c83c3c]">
          Отклик отклонён. Можно посмотреть другие задания и откликнуться снова.
        </div>
      ) : null}
    </div>
  );
}
