import Image from "next/image";
import { CheckCircle2, LockKeyhole } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { ComputedAchievement } from "@/widgets/volunteer-achievements/achievement-data";

export function AchievementCard({ achievement }: { achievement: ComputedAchievement }) {
  return (
    <article
      className={cn(
        "group rounded-[1.55rem] bg-white p-5 shadow-[0_20px_60px_rgba(34,28,8,0.055),inset_0_0_0_1px_rgba(24,20,7,0.055)] transition duration-300 hover:-translate-y-0.5",
        achievement.unlocked ? "hover:shadow-[0_26px_76px_rgba(255,227,0,0.18),inset_0_0_0_1px_rgba(255,227,0,0.46)]" : "hover:shadow-[0_22px_68px_rgba(34,28,8,0.08),inset_0_0_0_1px_rgba(24,20,7,0.08)]"
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn("relative grid size-20 shrink-0 place-items-center rounded-[1.45rem] bg-[#fffdf7] shadow-[inset_0_0_0_1px_rgba(24,20,7,0.05)]", !achievement.unlocked && "opacity-55 grayscale")}>
          <Image src={achievement.icon} alt={achievement.title} width={72} height={72} className="h-16 w-16 object-contain drop-shadow-[0_12px_22px_rgba(34,28,8,0.16)]" />
          {!achievement.unlocked ? (
            <span className="absolute -right-2 -top-2 grid size-8 place-items-center rounded-full bg-white shadow-[0_10px_24px_rgba(34,28,8,0.12)]">
              <LockKeyhole className="size-4 text-black/46" />
            </span>
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("inline-flex min-h-7 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-black", achievement.unlocked ? "bg-[#e8f8eb] text-[#247a31]" : "bg-[#f4f3ee] text-black/52")}>
              {achievement.unlocked ? <CheckCircle2 className="size-3.5" /> : <LockKeyhole className="size-3.5" />}
              {achievement.unlocked ? "Получено" : "В процессе"}
            </span>
            {achievement.earnedAt ? <span className="text-[11px] font-black text-black/34">{achievement.earnedAt}</span> : null}
          </div>
          <h3 className="mt-3 text-xl font-black leading-tight">{achievement.title}</h3>
          <p className="mt-2 text-sm font-bold leading-6 text-black/50">{achievement.description}</p>
        </div>
      </div>
      <div className="mt-5 rounded-[1.1rem] bg-[#fffdf7] p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-black">{achievement.humanProgress}</p>
          <p className="text-xs font-black text-black/42">{achievement.unlocked ? "готово" : achievement.nextText}</p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/8">
          <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${achievement.progress}%` }} />
        </div>
      </div>
    </article>
  );
}
