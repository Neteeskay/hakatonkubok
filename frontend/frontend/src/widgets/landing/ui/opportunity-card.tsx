import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/shared/ui/button";

export function OpportunityCard() {
  return (
    <section id="features" className="relative z-20 mx-auto -mt-1 max-w-[960px] px-4pb-16 md:px-8">
      <div className="gold-panel grid overflow-hidden rounded-[1.5rem] p-5 md:grid-cols-[170px_1fr_1.1fr_72px] md:items-center md:p-6">
        <div className="relative h-32 w-32 overflow-hidden rounded-[1.35rem] bg-white/24 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_18px_46px_rgba(142,91,0,0.18)] md:h-36 md:w-36">
          <Image src="/heart.png" alt="Объёмное сердце" fill sizes="144px" className="scale-[1.75] object-cover object-[50%_43%]" />
        </div>
        <div className="mt-6 md:mt-0">
          <h2 className="max-w-sm text-[30px] leading-[1.08] tracking-[-0.03em] md:text-[34px]">
            Один сервис — много возможностей
          </h2>
        </div>
        <p className="mt-5 max-w-sm text-sm font-medium leading-6 text-black/72 md:mt-0 md:border-l md:border-black/12 md:pl-8">
          Для волонтёров, фондов и администраторов. Единое пространство для организации, сопровождения и учёта волонтёрской деятельности.
        </p>
        <Button variant="secondary" size="icon" className="mt-5 size-14 rounded-full md:mt-0" asChild>
          <Link href="/login" aria-label="Открыть платформу">
            <ArrowRight className="size-5" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
