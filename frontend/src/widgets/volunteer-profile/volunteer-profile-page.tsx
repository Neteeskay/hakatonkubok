"use client";

import { useState } from "react";
import Link from "next/link";
import { Edit3, Mail, MapPin, Phone, Star } from "lucide-react";
import { ProfileEditDrawer, type ProfileEditFocus, type ProfileSkillsSnapshot } from "@/widgets/volunteer-profile/profile-edit-drawer";
import { hoursByMonth, profileRows, profileStats, profileTimeline, profileVolunteer } from "@/widgets/volunteer-profile/profile-data";
import { ProfileCard, ProfileSectionTitle, RoundIcon, SoftBadge } from "@/widgets/volunteer-profile/profile-ui";
import { SkillChip } from "@/widgets/volunteer-profile/ui/skill-chip";
import { taskVisuals } from "@/widgets/volunteer-feed/task-dictionaries";
import { getVolunteerAchievements } from "@/widgets/volunteer-achievements/achievement-data";
import { ProfileBadgesPreview } from "@/widgets/volunteer-achievements/ui/profile-badges-preview";

export function VolunteerProfilePage() {
  const [editing, setEditing] = useState(false);
  const [editFocus, setEditFocus] = useState<ProfileEditFocus>("basic");
  const [skillsSnapshot, setSkillsSnapshot] = useState<ProfileSkillsSnapshot>({
    interests: ["Помощь животным", "Экология", "Образование", "Дети", "Пожилые люди", "Культура и искусство"],
    skills: ["Маркетинг", "SMM", "Копирайтинг", "Презентации", "Аналитика", "Дизайн", "Планирование"],
    proBono: ["Презентации", "Product Design", "Аудит анкет"]
  });
  const achievements = getVolunteerAchievements();

  function openEditor(focus: ProfileEditFocus = "basic") {
    setEditFocus(focus);
    setEditing(true);
  }

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[1.6rem] bg-white p-5 shadow-[0_22px_70px_rgba(34,28,8,0.08),inset_0_0_0_1px_rgba(24,20,7,0.06)] md:p-7">
        <div className="absolute inset-y-0 right-0 hidden w-[52%] bg-[url('/backTaskVolounteer.png')] bg-cover bg-center md:block" />
        <div className="absolute inset-y-0 right-0 hidden w-[60%] bg-gradient-to-r from-white via-white/60 to-transparent md:block" />
        <div className="relative z-10 grid gap-6 md:grid-cols-[150px_1fr] md:items-center">
          <div className="relative size-36 overflow-hidden rounded-full bg-brand/20 shadow-[0_18px_44px_rgba(34,28,8,0.12)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_45%_32%,#fff_0_9%,transparent_10%),linear-gradient(145deg,#FFE300,#FFE300)]" />
            <span className="absolute inset-0 grid place-items-center text-5xl font-black">АС</span>
            <button onClick={() => openEditor()} className="absolute bottom-2 right-2 grid size-10 place-items-center rounded-full bg-white shadow-[0_8px_20px_rgba(34,28,8,0.18)]" aria-label="Редактировать фото">
              <Edit3 className="size-4" />
            </button>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-4xl font-black leading-none md:text-5xl">{profileVolunteer.name}</h1>
              <SoftBadge tone="gold"><Star className="mr-1 size-3.5" />Уровень 3</SoftBadge>
            </div>
            <p className="mt-3 text-sm font-bold text-black/54">Волонтёр с июня 2023</p>
            <div className="mt-5 grid gap-2 text-sm font-bold text-black/62">
              <span className="inline-flex items-center gap-2"><MapPin className="size-4" />Москва, Россия</span>
              <span className="inline-flex items-center gap-2"><Mail className="size-4" />anna.smirnova@mail.ru</span>
              <span className="inline-flex items-center gap-2"><Phone className="size-4" />+7 (999) 123-45-67</span>
            </div>
            <button onClick={() => openEditor()} className="mt-7 inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-black shadow-[inset_0_0_0_1px_rgba(24,20,7,0.09),0_12px_28px_rgba(34,28,8,0.06)] transition hover:bg-brand/12">
              Редактировать профиль
              <Edit3 className="size-4" />
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        {profileStats.map((stat) => (
          <ProfileCard key={stat.label}>
            <RoundIcon icon={stat.icon} />
            <div className="mt-4 flex items-end gap-2">
              <p className="text-3xl font-black leading-none">{stat.value}</p>
              <p className="pb-1 text-sm font-bold leading-4 text-black/62">{stat.label}</p>
            </div>
            <p className="mt-5 text-xs font-bold text-black/54">{stat.helper}</p>
            <div className="mt-3 h-2 rounded-full bg-[#efeee8]">
              <div className="h-full rounded-full bg-brand" style={{ width: `${stat.progress}%` }} />
            </div>
          </ProfileCard>
        ))}
      </div>

      <ProfileCard>
        <ProfileSectionTitle title="Мои бейджи" action="Все бейджи →" actionHref="/volunteer/achievements" />
        <ProfileBadgesPreview achievements={achievements} />
      </ProfileCard>

      <div className="grid gap-5 xl:grid-cols-[1fr_0.95fr]">
        <ProfileCard>
          <ProfileSectionTitle title="Мои часы" action="Открыть часы →" actionHref="/volunteer/hours" />
          <p className="text-3xl font-black">56 часов</p>
          <p className="mt-1 text-sm text-black/50">Общее количество</p>
          <div className="mt-6 flex h-48 items-end gap-5">
            {hoursByMonth.map((item) => (
              <div key={item.month} className="flex h-full flex-1 flex-col justify-end gap-2">
                <div className="rounded-t-xl bg-brand transition hover:brightness-95" style={{ height: `${item.value * 5}px` }} />
                <p className="text-center text-xs font-bold text-black/52">{item.month}</p>
              </div>
            ))}
          </div>
        </ProfileCard>

        <div className="space-y-5">
          <ProfileCard>
            <EditableSectionTitle title="Мои навыки" onEdit={() => openEditor("skills")} />
            <div className="flex flex-wrap gap-2">
              {skillsSnapshot.interests.map((item) => <SkillChip key={item} label={item} tone="brand" />)}
            </div>
          </ProfileCard>
          <ProfileCard>
            <EditableSectionTitle title="Проф. навыки" onEdit={() => openEditor("skills")} />
            <div className="flex flex-wrap gap-2">
              {skillsSnapshot.skills.map((item) => <SkillChip key={item} label={item} tone="violet" />)}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {skillsSnapshot.proBono.map((item) => <SkillChip key={item} label={item} tone="brand" />)}
            </div>
          </ProfileCard>
        </div>
      </div>

      <ProfileCard>
        <div className="mb-5 flex flex-wrap gap-6 border-b border-black/8">
          {[
            { label: "История откликов", href: "/volunteer/applications" },
            { label: "Мои участия", href: "/volunteer/history" },
            { label: "Начисленные часы", href: "/volunteer/hours" }
          ].map((tab, index) => (
            <Link key={tab.href} href={tab.href} className={`pb-3 text-sm font-black transition hover:text-black ${index === 0 ? "border-b-4 border-brand text-black" : "text-black/48"}`}>
              {tab.label}
            </Link>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-separate border-spacing-y-3 text-left">
            <thead className="text-xs font-black uppercase tracking-[0.12em] text-black/36">
              <tr><th>Задание</th><th>Статус</th><th>Период</th><th>Часы</th><th /></tr>
            </thead>
            <tbody>
              {profileRows.map((row) => (
                <tr key={row.task.id} className="group">
                  <td className="rounded-l-2xl bg-[#fffdf7] p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-20 rounded-xl bg-cover bg-center" style={{ backgroundImage: `url('${taskVisuals[row.task.id]?.image ?? "/peoples.png"}')` }} />
                      <div>
                        <p className="font-black">{row.task.title}</p>
                        <p className="mt-1 text-xs text-black/48">{row.task.foundation}</p>
                      </div>
                    </div>
                  </td>
                  <td className="bg-[#fffdf7] p-3"><SoftBadge tone={row.tone as "green" | "violet" | "red"}>{row.status}</SoftBadge></td>
                  <td className="whitespace-pre-line bg-[#fffdf7] p-3 text-sm font-bold text-black/58">{row.period}</td>
                  <td className="bg-[#fffdf7] p-3 text-sm font-black">{row.hours}</td>
                  <td className="rounded-r-2xl bg-[#fffdf7] p-3 text-right text-black/38 transition group-hover:text-black">›</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Link href="/volunteer/applications" className="mx-auto mt-3 flex h-11 w-full max-w-[560px] items-center justify-center rounded-full bg-[#fbfaf4] text-sm font-black text-black/62 transition hover:bg-brand/12">
          Показать ещё
        </Link>
      </ProfileCard>

      <ProfileCard>
        <ProfileSectionTitle title="Активность" />
        <div className="space-y-4">
          {profileTimeline.map((item) => (
            <div key={item.title} className="flex gap-4">
              <RoundIcon icon={item.icon} />
              <div className="min-w-0 flex-1 rounded-2xl bg-[#fffdf7] p-4">
                <p className="font-black">{item.title}</p>
                <p className="mt-1 text-sm text-black/54">{item.text}</p>
              </div>
              <p className="w-28 pt-4 text-right text-xs font-bold text-black/42">{item.time}</p>
            </div>
          ))}
        </div>
      </ProfileCard>

      <ProfileEditDrawer open={editing} onClose={() => setEditing(false)} initialFocus={editFocus} skillsSnapshot={skillsSnapshot} onSave={setSkillsSnapshot} />
    </div>
  );
}

function EditableSectionTitle({ title, onEdit }: { title: string; onEdit: () => void }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <h2 className="text-xl font-black">{title}</h2>
      <button onClick={onEdit} className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#fbfaf4] px-3 text-sm font-black text-black/58 transition hover:bg-brand/12 hover:text-black">
        Редактировать
        <Edit3 className="size-4" />
      </button>
    </div>
  );
}
