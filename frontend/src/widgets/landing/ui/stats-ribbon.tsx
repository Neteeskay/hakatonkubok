import { Building2, Heart, Trophy, UsersRound } from "lucide-react";

const stats = [
  { icon: UsersRound, value: "10 000+", label: "волонтёров" },
  { icon: Heart, value: "2 500+", label: "добрых дел" },
  { icon: Building2, value: "200+", label: "фондов и НКО" },
  { icon: Trophy, value: "1 000 000+", label: "часов помощи" }
];

export function StatsRibbon() {
  return (
    <section className="relative z-20 mx-auto -mt-2 max-w-[1150px] px-4 md:px-8">
      <div className="grid gap-5 rounded-[1.45rem] bg-white px-7 py-7 text-black shadow-[0_24px_80px_rgba(55,42,0,0.1),inset_0_0_0_1px_rgba(24,20,7,0.06)] md:grid-cols-4 md:px-10">
        {stats.map((stat, index) => (
          <div key={stat.label} className="flex items-center gap-5 md:border-r md:border-black/8 md:last:border-r-0">
            <stat.icon className="size-10 shrink-0 text-brand" />
            <div>
              <p className="text-3xl font-black leading-none">{stat.value}</p>
              <p className="mt-1 text-sm text-black/58">{stat.label}</p>
            </div>
            {index < stats.length - 1 ? <span className="hidden md:block" /> : null}
          </div>
        ))}
      </div>
    </section>
  );
}
