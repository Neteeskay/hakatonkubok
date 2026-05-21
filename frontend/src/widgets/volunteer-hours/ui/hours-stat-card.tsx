import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import { cn } from "@/shared/lib/utils";

type HoursStatCardProps = {
  title: string;
  value: string;
  caption: string;
  icon?: LucideIcon;
  imageSrc?: string;
  tone?: "brand" | "green" | "violet" | "plain";
  wide?: boolean;
  children?: ReactNode;
};

const tones = {
  brand: "bg-brand/14",
  green: "bg-[#effaf0]",
  violet: "bg-[#f4f1ff]",
  plain: "bg-white"
};

export function HoursStatCard({ title, value, caption, icon: Icon, imageSrc, tone = "plain", wide, children }: HoursStatCardProps) {
  return (
    <article className={cn("relative min-h-[180px] overflow-hidden rounded-[1.45rem] p-6 shadow-[0_20px_54px_rgba(35,28,8,0.055),inset_0_0_0_1px_rgba(24,20,7,0.045)]", tones[tone], wide && "md:col-span-2 xl:col-span-1")}>
      <div className="relative z-10">
        <div className="grid size-12 place-items-center rounded-2xl bg-brand shadow-[0_14px_30px_rgba(255,227,0,0.26)]">
          {Icon ? <Icon className="size-6 text-black" strokeWidth={2.2} /> : null}
        </div>
        <p className="mt-5 text-sm font-extrabold text-black/72">{title}</p>
        <p className="mt-2 text-4xl font-black leading-none text-black">{value}</p>
        <p className="mt-4 text-sm font-bold text-black/52">{caption}</p>
      </div>
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt=""
          width={170}
          height={170}
          className="absolute bottom-1 right-3 h-[142px] w-[142px] object-contain drop-shadow-[0_22px_32px_rgba(78,58,0,0.18)]"
          priority
        />
      ) : null}
      {children ? <div className="absolute bottom-6 right-6">{children}</div> : null}
    </article>
  );
}
