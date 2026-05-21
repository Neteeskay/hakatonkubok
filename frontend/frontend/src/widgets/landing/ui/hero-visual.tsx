import Image from "next/image";

export function HeroVisual() {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[58%] overflow-visible lg:block">
      <div className="hero-rings absolute left-[2%] top-[11%] size-[680px] rounded-full opacity-95" />
      <div className="orb-black absolute right-[-3rem] top-[7rem] size-28 rounded-full blur-[0.2px]" />
      <div className="orb-yellow absolute right-[17%] top-[13rem] size-28 rounded-full" />
      <div className="orb-yellow absolute left-[6%] top-[20rem] size-12 rounded-full" />
      <div className="orb-black absolute left-[13%] bottom-[15rem] size-14 rounded-full" />
      <div className="absolute left-[19%] top-[18rem] h-[280px] w-[320px]">
        <div className="orb-black absolute left-2 top-0 size-24 rounded-full" />
        <div className="absolute left-0 top-14 h-72 w-36 rotate-[16deg] rounded-[5rem_5rem_3rem_5rem] bg-[#090908] shadow-[inset_-24px_-30px_60px_rgba(255,227,0,0.16),0_28px_80px_rgba(0,0,0,0.22)]" />
        <div className="orb-yellow absolute right-6 top-0 size-28 rounded-full" />
        <div className="absolute right-5 top-16 h-72 w-36 -rotate-[16deg] rounded-[5rem_5rem_5rem_3rem] bg-brand shadow-[inset_-24px_-34px_58px_rgba(175,116,0,0.22),0_32px_80px_rgba(255,227,0,0.34)]" />
        <div className="absolute left-[5.1rem] top-[9.2rem] grid size-36 place-items-center rounded-full bg-white/82 shadow-[inset_0_0_28px_rgba(255,209,0,0.45),0_12px_38px_rgba(255,209,0,0.28)]">
          <Image src="/logo.png" alt="" width={92} height={92} className="h-20 w-20 object-contain object-left" />
        </div>
      </div>
      <div className="hero-hand absolute bottom-[-4.2rem] right-[-3rem] h-52 w-[600px] -rotate-[10deg] rounded-[60%_45%_46%_68%/60%_70%_40%_44%]" />
      <div className="hero-hand absolute bottom-[2.4rem] right-[12rem] h-24 w-[300px] -rotate-[4deg] rounded-[70%_26%_48%_72%/60%_45%_58%_46%]" />
      <div className="absolute bottom-[-3rem] right-[-5rem] size-56 rounded-full bg-brand blur-[2px] opacity-95" />
    </div>
  );
}
