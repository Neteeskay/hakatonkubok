import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Reveal } from "@/widgets/landing/ui/reveal";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-[#fffdf7]">
      <div className="relative w-full overflow-hidden bg-[#fffdf7]">
        <div className="relative aspect-[4232/2456] min-h-[620px] w-full bg-[url('/backround1.png')] bg-cover bg-center md:min-h-0">
          <div className="absolute left-[4.3%] top-[45%] z-10 max-w-[510px] -translate-y-1/2">
            <Reveal delay={0.04}>
              <h1 className="sr-only">Помогать просто</h1>
              <Image
                src="/textLanding.svg"
                alt="Помогать просто"
                width={595}
                height={234}
                priority
                className="w-[330px] drop-shadow-[0_18px_35px_rgba(0,0,0,0.38)] sm:w-[430px] lg:w-[500px]"
              />
              <p className="mt-7 max-w-[430px] rounded-2xl bg-black/72 p-4 text-[16px] font-medium leading-[1.45] text-white shadow-[0_18px_60px_rgba(0,0,0,0.45)] md:bg-transparent md:p-0 md:shadow-none md:text-[21px]">
                Платформа корпоративного волонтёрства от <strong>Столото</strong>. Объединяем людей, идеи и добрые дела, чтобы делать мир лучше — вместе.
              </p>
            </Reveal>
            <Reveal delay={0.12}>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Button className="h-[58px] rounded-xl px-7 text-[15px] shadow-[0_24px_60px_rgba(255,205,0,0.24)]" asChild>
                  <Link href="/register/volunteer">
                    Стать волонтёром
                    <ArrowRight className="size-5" />
                  </Link>
                </Button>
                <Button variant="ghost" className="h-[58px] rounded-xl bg-white/12 px-7 text-[15px] text-white shadow-[inset_0_0_0_1px_rgba(255,211,0,0.95),0_18px_42px_rgba(0,0,0,0.16)] backdrop-blur hover:bg-white/18" asChild>
                  <Link href="/register/foundation">
                    Для фондов и НКО
                    <ArrowRight className="size-5" />
                  </Link>
                </Button>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
