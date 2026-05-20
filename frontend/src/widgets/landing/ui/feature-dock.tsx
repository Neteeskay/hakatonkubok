import { ArrowRight, ChartNoAxesCombined, Heart, Star, UsersRound } from "lucide-react";

const features = [
  { icon: Heart, title: "Удобно", text: "Находите мероприятия рядом с вами и участвуйте в пару кликов." },
  { icon: UsersRound, title: "Вместе", text: "Объединяйтесь с коллегами и помогайте тем, кто в этом нуждается." },
  { icon: ChartNoAxesCombined, title: "Прозрачно", text: "Все активности и ваш вклад учитываются. Видите результат своей помощи." },
  { icon: Star, title: "Со смыслом", text: "Каждое доброе дело делает мир лучше. Начните с малого." }
];

export function FeatureDock() {
  return (
    <div className="relative mx-auto grid max-w-[1120px] gap-4 overflow-hidden rounded-[1.45rem] bg-white p-5 shadow-[0_24px_80px_rgba(55,42,0,0.1)] md:grid-cols-4 md:p-6">
      <div className="absolute -left-16 -top-24 h-56 w-56 rounded-full bg-brand/20 blur-3xl" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
      {features.map((feature) => (
        <article key={feature.title} className="group relative min-h-[190px] rounded-[1.35rem] bg-[#fffdf7] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_18px_50px_rgba(52,43,13,0.07)] transition duration-500 hover:-translate-y-1 hover:bg-white">
          <div className="grid size-14 place-items-center rounded-2xl bg-brand text-black shadow-[0_16px_34px_rgba(255,204,0,0.32)]">
            <feature.icon className="size-7 stroke-[2.1]" />
          </div>
          <h3 className="mt-4 text-[18px] font-black">{feature.title}</h3>
          <p className="mt-2 max-w-[12rem] text-[13px] leading-5 text-black/72">{feature.text}</p>
          <ArrowRight className="absolute bottom-5 right-5 size-5 transition group-hover:translate-x-1" />
        </article>
      ))}
    </div>
  );
}
