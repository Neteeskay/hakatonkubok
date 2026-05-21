import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/shared/ui/button";

export function PeopleSection() {
  return (
    <section id="stories" className="relative -mt-2 overflow-hidden px-4 pb-4 pt-16 md:px-8 md:pt-20">
      <div className="absolute left-0 top-20 h-72 w-72 rounded-full bg-brand/18 blur-3xl" />
      <div className="absolute right-0 top-10 h-80 w-80 rounded-full bg-brand/26 blur-3xl" />
      <div className="absolute left-0 top-40 h-64 w-64 opacity-70 [background:radial-gradient(circle,rgba(255,209,0,.62)_2px,transparent_3px)] [background-size:18px_18px]" />
      <div className="absolute right-12 top-10 h-56 w-56 opacity-60 [background:radial-gradient(circle,rgba(255,209,0,.6)_2px,transparent_3px)] [background-size:18px_18px]" />
      <div className="relative mx-auto grid max-w-[1150px] gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
        <div className="relative z-10">
          <h2 className="max-w-md text-[42px] font-black leading-[1.05] tracking-normal md:text-[56px]">
            Добрые дела начинаются <span className="text-brand">с нас</span>
          </h2>
          <p className="mt-6 max-w-sm text-[17px] font-semibold leading-7 text-black/68">
            Присоединяйтесь к сообществу неравнодушных сотрудников Столото и вместе создавайте будущее, в котором важен каждый.
          </p>
          <Button className="mt-9 h-14 rounded-xl px-8 text-sm font-black" asChild>
            <Link href="/register/volunteer">
              Присоединиться
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        <div className="relative min-h-[330px] lg:min-h-[430px]">
          <Image
            src="/peoples.png"
            alt="Волонтёры Столото дают друг другу пять"
            fill
            sizes="(min-width: 1024px) 680px, 100vw"
            className="object-contain object-center drop-shadow-[0_30px_70px_rgba(80,61,0,0.16)]"
          />
        </div>
      </div>
    </section>
  );
}
