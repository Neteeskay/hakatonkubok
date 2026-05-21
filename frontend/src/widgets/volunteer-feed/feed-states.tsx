import { Search } from "lucide-react";

export function TaskFeedEmpty() {
  return (
    <div className="grid min-h-72 place-items-center rounded-[1.45rem] bg-white p-8 text-center shadow-[inset_0_0_0_1px_rgba(24,20,7,0.06)]">
      <div>
        <Search className="mx-auto size-8 text-black/28" />
        <h3 className="mt-4 text-2xl font-black">Заданий не найдено</h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-black/54">Измените фильтры или сбросьте условия поиска, чтобы увидеть больше возможностей.</p>
      </div>
    </div>
  );
}

export function TaskFeedSkeleton() {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="grid min-h-[245px] animate-pulse gap-5 rounded-[1.35rem] bg-white p-4 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.06)] md:grid-cols-[245px_1fr]">
          <div className="rounded-[1.15rem] bg-black/6" />
          <div className="space-y-4 py-2">
            <div className="h-4 w-32 rounded-full bg-black/6" />
            <div className="h-7 w-4/5 rounded-full bg-black/8" />
            <div className="h-4 w-full rounded-full bg-black/6" />
            <div className="h-4 w-3/5 rounded-full bg-black/6" />
            <div className="mt-8 h-10 w-36 rounded-xl bg-black/8" />
          </div>
        </div>
      ))}
    </div>
  );
}
