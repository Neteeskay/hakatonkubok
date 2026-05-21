"use client";

import { useMemo } from "react";
import { BadgeCheck, ShieldCheck, UsersRound } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fundApi, taskApi } from "@/shared/api/services";
import type { ApiFundProfile } from "@/shared/api/types";
import { mapApiFundToFoundation, mapApiTaskToVolunteerTask } from "@/shared/api/mappers";
import { FoundationPublicPage, type FoundationPublicDetails } from "@/widgets/foundation-public/foundation-public-page";
import { categoryLabels } from "@/widgets/volunteer-feed/task-dictionaries";

export function FoundationPublicClient({ fundId }: { fundId: string }) {
  const fundQuery = useQuery({
    queryKey: ["funds", fundId],
    queryFn: () => fundApi.getById(fundId),
    enabled: Boolean(fundId)
  });

  const tasksQuery = useQuery({
    queryKey: ["tasks", "feed", "foundation", fundId],
    queryFn: () => taskApi.listFeed(),
    enabled: Boolean(fundId)
  });

  const fundTasks = useMemo(
    () => (tasksQuery.data ?? []).filter((task) => task.fund_id === fundId),
    [fundId, tasksQuery.data]
  );

  if (fundQuery.isLoading || tasksQuery.isLoading) {
    return <div className="premium-surface rounded-[1.7rem] p-6 text-sm font-bold text-black/58">Загружаем фонд...</div>;
  }

  if (fundQuery.isError || !fundQuery.data) {
    return <div className="premium-surface rounded-[1.7rem] p-6 text-sm font-bold text-black/58">Фонд не найден или недоступен.</div>;
  }

  const foundation = mapApiFundToFoundation(fundQuery.data, fundTasks);
  const activeTasks = fundTasks.map((task) => mapApiTaskToVolunteerTask(task));
  const details = buildDetails(fundQuery.data, activeTasks.map((task) => task.category));

  return <FoundationPublicPage activeTasks={activeTasks} completedTasks={[]} details={details} foundation={foundation} />;
}

function buildDetails(fund: ApiFundProfile, taskCategories: string[]): FoundationPublicDetails {
  const categories = Array.from(new Set([...(fund.help_categories ?? []), ...taskCategories]));

  return {
    verified: fund.status === "approved",
    logo: fund.name.slice(0, 2).toUpperCase(),
    description: fund.description ?? fund.planned_help ?? "Описание фонда появится после заполнения профиля.",
    site: normalizeSite(fund.website_url),
    icons: [ShieldCheck, BadgeCheck, UsersRound],
    mission: fund.planned_help ?? fund.description ?? "Фонд готовит описание направлений помощи.",
    activityTypes: categories.length
      ? categories.map((category) => categoryLabels[category as keyof typeof categoryLabels] ?? category)
      : ["Направления помощи уточняются"],
    categories: categories.length
      ? categories.map((category) => categoryLabels[category as keyof typeof categoryLabels] ?? category)
      : ["Направления помощи уточняются"],
    email: fund.contact_email ?? fund.representative?.email ?? "Контакты уточняются",
    phone: fund.contact_phone ?? fund.representative?.phone ?? "Контакты уточняются",
    inn: [fund.inn, fund.ogrn].filter(Boolean).join(" / ") || "Не указан"
  };
}

function normalizeSite(value: string | null | undefined) {
  if (!value) return "example.org";
  return value.replace(/^https?:\/\//, "").replace(/\/$/, "");
}
