import { CheckCircle2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { foundationSteps, type FoundationRegistrationStep } from "@/widgets/foundation-registration/foundation-registration-data";

export function FoundationStepper({ activeStep }: { activeStep: FoundationRegistrationStep }) {
  const activeIndex = foundationSteps.findIndex((step) => step.id === activeStep);

  return (
    <div className="grid gap-2 rounded-[1.45rem] bg-white p-3 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.055)] md:grid-cols-4">
      {foundationSteps.map((step, index) => {
        const done = index < activeIndex;
        const active = step.id === activeStep;
        return (
          <div key={step.id} className={cn("rounded-[1.1rem] p-3 transition", active ? "bg-brand" : done ? "bg-[#e8f8eb]" : "bg-[#fffdf7]")}>
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-full bg-white text-xs font-black">{done ? <CheckCircle2 className="size-4 text-[#247a31]" /> : index + 1}</span>
              <p className="text-sm font-black">{step.title}</p>
            </div>
            <p className="mt-1 pl-9 text-[11px] font-bold leading-4 text-black/48">{step.text}</p>
          </div>
        );
      })}
    </div>
  );
}
