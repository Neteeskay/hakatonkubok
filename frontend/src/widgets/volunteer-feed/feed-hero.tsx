import Image from "next/image";

export function FeedHero() {
  return (
    <section className="relative min-h-[230px] overflow-hidden rounded-[1.55rem] bg-white shadow-[0_22px_70px_rgba(34,28,8,0.08),inset_0_0_0_1px_rgba(34,28,8,0.06)]">
      <div className="absolute inset-0 bg-[url('/backTaskVolounteer.png')] bg-cover bg-center" />
      <div className="absolute inset-0 bg-gradient-to-r from-white via-white/88 to-white/12" />
      <div className="relative z-10 max-w-xl px-6 py-10 md:px-8">
        <h1 className="text-[44px] font-black leading-[0.95] tracking-normal md:text-[58px]">Задания</h1>
        <div className="mt-4 h-1 w-12 rounded-full bg-brand" />
        <p className="mt-6 max-w-md text-[17px] leading-7 text-black/72">Находите задания, которые вам интересны, и помогайте там, где это действительно важно.</p>
      </div>
      <div className="absolute bottom-4 right-6 hidden md:block">
        <Image src="/heart.png" alt="" width={86} height={86} className="opacity-90 blur-[0.2px]" />
      </div>
    </section>
  );
}
