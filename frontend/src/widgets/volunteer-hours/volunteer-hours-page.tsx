"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Download,
  History,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { Cell, LabelList, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getApiErrorMessage } from "@/shared/api/errors";
import { volunteersService } from "@/shared/api/services/volunteers";
import { HoursStatCard } from "@/widgets/volunteer-hours/ui/hours-stat-card";
import {
  emptyVolunteerHoursViewData,
  mapVolunteerHoursToViewData
} from "@/widgets/volunteer-hours/volunteer-hours-api-mappers";

const hoursInfo = [
  {
    icon: ShieldCheck,
    title: "Часы начисляются только за реальные выполненные задания."
  },
  {
    icon: Sparkles,
    title: "Организатор может отклонить участие, если задание не было выполнено."
  }
];

const hoursSteps = [
  "Вы выполняете задание или участвуете в мероприятии.",
  "Организатор подтверждает ваше участие.",
  "Часы начисляются на ваш счёт в течение 1-3 дней."
];

export function VolunteerHoursPage() {
  const [hoursData, setHoursData] = useState(emptyVolunteerHoursViewData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const { categories: hourCategories, dynamics: hourDynamics, summary: hourSummary } = hoursData;
  const monthDeltaCaption = `${hourSummary.monthDelta >= 0 ? "↑" : "↓"} ${Math.abs(hourSummary.monthDelta)} ч ${hourSummary.monthDelta >= 0 ? "больше" : "меньше"}, чем в прошлом месяце`;
  const maxDynamicHours = Math.max(40, ...hourDynamics.map((item) => item.hours));

  useEffect(() => {
    let active = true;

    async function loadHours() {
      setLoading(true);
      setError(null);

      try {
        const [summary, ledger, dynamics, byCategory] = await Promise.all([
          volunteersService.getMyVolunteerHoursSummary(),
          volunteersService.getMyVolunteerHoursLedger({ limit: 20 }),
          volunteersService.getMyVolunteerHoursDynamics(),
          volunteersService.getMyVolunteerHoursByCategory()
        ]);

        if (!active) return;

        void ledger;
        setHoursData(mapVolunteerHoursToViewData({ byCategory, dynamics, summary }));
      } catch (requestError) {
        if (active) {
          setError(getApiErrorMessage(requestError));
          setHoursData(emptyVolunteerHoursViewData);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadHours();

    return () => {
      active = false;
    };
  }, []);

  async function downloadReport() {
    setDownloading(true);
    setError(null);

    try {
      const year = new Date().getFullYear();
      const blob = await volunteersService.downloadMyVolunteerStatistics(year);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `volunteer-hours-${year}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(getApiErrorMessage(downloadError));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="rounded-[1.8rem] bg-white p-5 shadow-[0_24px_72px_rgba(34,28,8,0.055),inset_0_0_0_1px_rgba(24,20,7,0.045)] md:p-7">
      <header className="mb-7 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-4xl font-black leading-tight text-black md:text-[2.65rem]">Мои волонтёрские часы</h1>
          <p className="mt-3 text-base font-semibold text-black/62">Каждый час вашей помощи — это важные изменения</p>
          {loading ? <p className="mt-3 text-sm font-bold text-black/44">Загружаем часы...</p> : null}
          {error ? <p className="mt-3 rounded-xl bg-[#fff1f1] p-3 text-sm font-bold text-[#c83c3c]">{error}</p> : null}
        </div>
        <button onClick={downloadReport} disabled={downloading} className="inline-flex h-11 shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-white px-4 text-sm font-black text-black/64 shadow-[inset_0_0_0_1px_rgba(24,20,7,0.08)] transition hover:bg-brand/12 disabled:opacity-60">
          {downloading ? "Готовим отчёт" : "Скачать отчёт"}
          <Download className="size-4" />
        </button>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.35fr_0.9fr_0.9fr_0.95fr]">
        <HoursStatCard
          title="Всего часов"
          value={`${hourSummary.total}`}
          caption={`= ${hourSummary.totalDays} дней помощи`}
          icon={Clock3}
          imageSrc="/watch.png"
          tone="brand"
          wide
        >
          <SparkleCluster />
        </HoursStatCard>
        <HoursStatCard
          title="Подтверждено часов"
          value={`${hourSummary.confirmed}`}
          caption={`= ${hourSummary.confirmedDays} дней`}
          tone="green"
        >
          <span className="grid size-12 place-items-center rounded-2xl bg-[#d8f4dc] text-[#247a31]">
            <CheckCircle2 className="size-6" />
          </span>
        </HoursStatCard>
        <HoursStatCard
          title="Ожидают подтверждения"
          value={`${hourSummary.pending} ч`}
          caption={`≈ ${hourSummary.pendingDays} дня`}
          tone="violet"
        >
          <span className="grid size-12 place-items-center rounded-2xl bg-[#ded8ff] text-[#6550c7]">
            <Clock3 className="size-6" />
          </span>
        </HoursStatCard>
        <HoursStatCard
          title="В этом месяце"
          value={`${hourSummary.month} ч`}
          caption={monthDeltaCaption}
          tone="brand"
        >
          <BarMini />
        </HoursStatCard>
      </section>

      <section className="mt-5 grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="rounded-[1.45rem] bg-white p-5 shadow-[0_18px_54px_rgba(34,28,8,0.045),inset_0_0_0_1px_rgba(24,20,7,0.055)]">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-xl font-black text-black">Динамика часов</h2>
            <button className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-black shadow-[inset_0_0_0_1px_rgba(24,20,7,0.07)] transition hover:bg-brand/12">
              За 6 месяцев
              <ChevronDown className="size-4" />
            </button>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourDynamics} margin={{ top: 22, right: 18, bottom: 0, left: -18 }}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: "rgba(0,0,0,0.48)" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: "rgba(0,0,0,0.42)" }} domain={[0, maxDynamicHours]} />
                <Tooltip
                  cursor={{ stroke: "rgba(255,227,0,0.55)", strokeWidth: 2 }}
                  contentStyle={{
                    border: 0,
                    borderRadius: 14,
                    background: "#111",
                    color: "#fff",
                    boxShadow: "0 16px 38px rgba(0,0,0,0.16)",
                    fontWeight: 800
                  }}
                  formatter={(value) => [`${value} ч`, ""]}
                  labelFormatter={(label) => `${label}`}
                />
                <Line type="monotone" dataKey="hours" stroke="#FFE300" strokeWidth={3} dot={{ r: 5, fill: "#FFE300", stroke: "#fff", strokeWidth: 2 }} activeDot={{ r: 7, fill: "#FFE300", stroke: "#111", strokeWidth: 2 }} />
                <LabelList dataKey="hours" content={(props) => <HourPointLabel {...props} totalPoints={hourDynamics.length} />} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[1.45rem] bg-white p-5 shadow-[0_18px_54px_rgba(34,28,8,0.045),inset_0_0_0_1px_rgba(24,20,7,0.055)]">
          <h2 className="text-xl font-black text-black">Распределение часов по направлениям</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-[240px_1fr] md:items-center">
            <div className="relative h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={hourCategories} dataKey="hours" innerRadius={62} outerRadius={96} paddingAngle={0} stroke="none">
                    {hourCategories.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 grid place-items-center">
                <div className="text-center">
                  <p className="text-4xl font-black leading-none text-black">{hourSummary.total}</p>
                  <p className="mt-1 text-sm font-black text-black/62">часов</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {hourCategories.map((category) => (
                <div key={category.name} className="flex items-center justify-between gap-4 text-sm font-bold">
                  <span className="inline-flex items-center gap-2 text-black/62">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: category.color }} />
                    {category.name}
                  </span>
                  <span className="text-black/72">{category.hours} ч ({category.percent}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-5 flex flex-col gap-4 rounded-[1.25rem] bg-brand/12 p-4 shadow-[inset_0_0_0_1px_rgba(255,227,0,0.28)] md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white text-brand shadow-[0_12px_30px_rgba(255,227,0,0.18)]">
            <Clock3 className="size-8" strokeWidth={2.1} />
          </span>
          <div>
            <h3 className="text-base font-black text-black">Волонтёрские часы начисляются после подтверждения фондом</h3>
            <p className="mt-1 text-sm font-semibold text-black/58">Обычно это занимает от 1 до 3 дней после выполнения задания.</p>
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-4 xl:grid-cols-[1fr_1fr_0.85fr]">
        <div className="relative overflow-hidden rounded-[1.45rem] bg-white p-6 shadow-[0_18px_54px_rgba(34,28,8,0.045),inset_0_0_0_1px_rgba(24,20,7,0.055)]">
  
  <Image
    src="/heartTime.png"
    alt=""
    width={180}
    height={180}
    className="absolute bottom-0 right-2 z-0 hidden h-36 w-36 object-contain  drop-shadow-[0_22px_36px_rgba(255,227,0,0.22)] sm:block"
  />

  <div className="relative z-10">
    <h2 className="text-lg font-black text-black">
      Как начисляются часы?
    </h2>

    <ol className="mt-5 space-y-4">
      {hoursSteps.map((step, index) => (
        <li
          key={step}
          className="grid grid-cols-[24px_1fr] gap-3 text-sm font-bold leading-6 text-black/58"
        >
          <span className="font-black text-black">
            {index + 1}
          </span>

          <span>{step}</span>
        </li>
      ))}
    </ol>
  </div>
</div>

        <div className="rounded-[1.45rem] bg-white p-6 shadow-[0_18px_54px_rgba(34,28,8,0.045),inset_0_0_0_1px_rgba(24,20,7,0.055)]">
          <h2 className="text-lg font-black text-black">Важно знать</h2>
          <div className="mt-5 space-y-4">
            {hoursInfo.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand/16 text-brand">
                    <Icon className="size-5" />
                  </span>
                  <p className="pt-1 text-sm font-bold leading-6 text-black/58">{item.title}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[1.45rem] bg-brand/12 p-6 shadow-[0_18px_54px_rgba(34,28,8,0.045),inset_0_0_0_1px_rgba(24,20,7,0.055)]">
          <h2 className="relative z-10 text-lg font-black text-black">Ваш вклад меняет мир!</h2>
          <p className="relative z-10 mt-4 max-w-[220px] text-sm font-bold leading-6 text-black/62">Спасибо, что помогаете делать добрые дела каждый день.</p>
          <Image src="/TeamTime.png" alt="" width={500} height={320} className="absolute bottom-0 right-0 h-[170px] w-[280px] object-cover object-right-bottom opacity-95" />
        </div>
      </section>

      <section className="mt-5 overflow-hidden rounded-[1.45rem] bg-[#fffdf7] p-5 shadow-[0_18px_54px_rgba(34,28,8,0.045),inset_0_0_0_1px_rgba(24,20,7,0.055)]">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white text-black shadow-[0_14px_34px_rgba(34,28,8,0.06)]">
              <History className="size-6" />
            </span>
            <div>
              <h2 className="text-xl font-black text-black">История участия</h2>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-black/56">
                Подробные записи по заданиям, статусам подтверждения и начисленным часам собраны на отдельной странице истории.
              </p>
            </div>
          </div>
          <Link
            href="/volunteer/history"
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-black text-black shadow-[0_12px_28px_rgba(255,227,0,0.24)] transition hover:-translate-y-0.5 hover:brightness-95"
          >
            Перейти в историю
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function SparkleCluster() {
  return (
    <div aria-hidden className="pointer-events-none">
      <span className="absolute right-36 top-16 size-2 rounded-full bg-brand" />
      <span className="absolute right-48 bottom-12 size-1.5 rounded-full bg-brand" />
      <Sparkles className="absolute right-44 top-20 size-8 text-brand" />
    </div>
  );
}

function BarMini() {
  return (
    <div className="flex h-12 items-end gap-1.5 text-brand">
      {[18, 26, 36].map((height) => (
        <span key={height} className="w-2 rounded-full bg-brand" style={{ height }} />
      ))}
    </div>
  );
}

function HourPointLabel(props: { x?: string | number; y?: string | number; value?: string | number; index?: number; totalPoints: number }) {
  const x = Number(props.x ?? 0);
  const y = Number(props.y ?? 0);
  const value = Number(props.value ?? 0);
  const { index } = props;
  if (value == null) {
    return null;
  }
  const isLast = index === props.totalPoints - 1;
  return (
    <g>
      {isLast ? (
        <>
          <rect x={x - 21} y={y - 34} width="42" height="24" rx="8" fill="#FFE300" />
          <text x={x} y={y - 18} textAnchor="middle" fill="#111" fontSize="11" fontWeight="900">{value} ч</text>
        </>
      ) : (
        <text x={x} y={y - 14} textAnchor="middle" fill="rgba(0,0,0,0.72)" fontSize="11" fontWeight="800">{value} ч</text>
      )}
    </g>
  );
}
