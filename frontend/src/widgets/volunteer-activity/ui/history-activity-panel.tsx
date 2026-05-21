import { MapPin } from "lucide-react";
import type { VolunteerHistoryEntry } from "@/widgets/volunteer-activity/history-data";

export function HistoryActivityPanel({ entries }: { entries: VolunteerHistoryEntry[] }) {
  const monthlyActivity = buildMonthlyActivity(entries);
  const cityContribution = buildCityContribution(entries);
  const maxMonth = Math.max(1, ...monthlyActivity.map((item) => item.hours));
  const maxCity = Math.max(1, ...cityContribution.map((item) => item.hours));

  return (
    <section className="grid gap-8 rounded-[1.25rem] bg-[#fffdf7] p-5 md:grid-cols-[1fr_1fr]">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black">Ваша активность по месяцам</h2>
          <p className="text-xs font-bold text-black/48">За все время</p>
        </div>
        <div className="mt-7 flex h-44 items-end gap-5">
          <div className="flex h-full flex-col justify-between pb-7 text-xs font-bold text-black/38">
            <span>30</span>
            <span>20</span>
            <span>10</span>
            <span>0</span>
          </div>
          <div className="flex h-full flex-1 items-end justify-between gap-4">
            {monthlyActivity.map((item) => (
              <div key={item.month} className="flex h-full flex-1 flex-col justify-end gap-3">
                <div className="flex h-[136px] items-end">
                  <div className="w-full rounded-t-xl bg-brand transition hover:brightness-95" style={{ height: `${Math.max(20, (item.hours / maxMonth) * 128)}px` }} />
                </div>
                <p className="text-center text-xs font-bold text-black/48">{item.month}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black">Города, где вы помогали</h2>
          <p className="text-xs font-bold text-black/48">Все города</p>
        </div>
        <div className="mt-7 space-y-4">
          {cityContribution.map((item) => (
            <div key={item.city} className="grid grid-cols-[130px_1fr_46px] items-center gap-4">
              <p className="flex items-center gap-2 text-sm font-bold text-black/64">
                <MapPin className="size-4 text-[#6b4de6]" />
                {item.city}
              </p>
              <div className="h-1.5 rounded-full bg-[#edeae0]">
                <div className="h-full rounded-full bg-brand" style={{ width: `${(item.hours / maxCity) * 100}%` }} />
              </div>
              <p className="text-right text-xs font-black text-black/58">{item.hours} ч</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function buildMonthlyActivity(entries: VolunteerHistoryEntry[]) {
  const buckets = new Map<string, number>();
  for (const entry of entries) {
    buckets.set(entry.date, (buckets.get(entry.date) ?? 0) + entry.hours);
  }
  const values = Array.from(buckets, ([month, hours]) => ({ month, hours }));
  return values.length ? values.slice(0, 6) : [{ month: "-", hours: 0 }];
}

function buildCityContribution(entries: VolunteerHistoryEntry[]) {
  const buckets = new Map<string, number>();
  for (const entry of entries) {
    buckets.set(entry.task.city, (buckets.get(entry.task.city) ?? 0) + entry.hours);
  }
  const values = Array.from(buckets, ([city, hours]) => ({ city, hours }));
  return values.length ? values.slice(0, 5) : [{ city: "-", hours: 0 }];
}
