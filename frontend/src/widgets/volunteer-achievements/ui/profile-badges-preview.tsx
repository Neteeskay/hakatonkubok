import Image from "next/image";
import Link from "next/link";
import { ArrowRight, LockKeyhole, Star } from "lucide-react";
import type { ComputedAchievement } from "@/widgets/volunteer-achievements/achievement-data";
import { RoundIcon } from "@/widgets/volunteer-profile/profile-ui";

export function ProfileBadgesPreview({ achievements }: { achievements: ComputedAchievement[] }) {
  const unlocked = achievements.filter((achievement) => achievement.unlocked).slice(0, 6);
  const next = getNextAchievement(achievements);

  if (!unlocked.length) {
    return (
      <div className="rounded-[1.25rem] bg-[#fffdf7] p-5">
        <div className="flex items-center gap-4">
          <RoundIcon icon={LockKeyhole} tone="gold" />
          <div>
            <p className="font-black">У вас пока нет медалей</p>
            <p className="mt-1 text-sm font-bold text-black/48">Участвуйте в заданиях и получайте достижения.</p>
          </div>
        </div>
        <Link href="/volunteer/achievements" className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-black text-black">
          Смотреть все достижения
          <ArrowRight className="size-4" />
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
        {unlocked.map((badge) => (
          <Link href="/volunteer/achievements" key={badge.id} className="group text-center">
            <div className="relative mx-auto flex h-28 items-center justify-center transition duration-300 group-hover:-translate-y-1">
              <span className="absolute bottom-3 h-10 w-20 rounded-full bg-brand/26 blur-xl transition group-hover:bg-brand/38" />
              <Image src={badge.icon} alt={badge.title} width={96} height={96} className="relative z-10 h-24 w-24 object-contain drop-shadow-[0_18px_24px_rgba(34,28,8,0.18)]" />
            </div>
            <p className="mt-3 text-sm font-black">{badge.title}</p>
            <p className="text-xs font-bold text-black/45">{badge.earnedAt}</p>
          </Link>
        ))}
      </div>
      <div className="mt-6 rounded-[1.2rem] bg-[#fbfaf4] p-4">
        <div className="flex items-center gap-3">
          <RoundIcon icon={Star} tone="violet" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black">До следующей медали «{next.title}»</p>
            <p className="mt-1 text-xs font-bold text-black/50">{next.nextText}</p>
            <div className="mt-3 h-2 rounded-full bg-[#e8e4f8]"><div className="h-full rounded-full bg-[#6b4de6]" style={{ width: `${next.progress}%` }} /></div>
          </div>
          <p className="text-sm font-black text-black/58">{next.humanProgress}</p>
        </div>
      </div>
    </>
  );
}

function getNextAchievement(achievements: ComputedAchievement[]) {
  return [...achievements]
    .filter((achievement) => !achievement.unlocked)
    .sort((a, b) => b.progress - a.progress)[0] ?? achievements[0];
}
