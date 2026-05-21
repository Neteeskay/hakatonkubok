"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Foundation } from "@/entities/foundation/model";
import type { VolunteerTask } from "@/entities/task/model";
import { fundsService, getApiErrorMessage } from "@/shared/api";
import type { FundDocumentResponse } from "@/shared/api/types";
import { mapTaskResponseToVolunteerTask } from "@/widgets/volunteer-feed/task-api-mappers";
import { getCategoryLabel } from "@/widgets/volunteer-feed/task-dictionaries";
import { FoundationPublicPage } from "@/widgets/foundation-public/foundation-public-page";

export default function FoundationPublicRoute() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [foundation, setFoundation] = useState<Foundation | null>(null);
  const [activeTasks, setActiveTasks] = useState<VolunteerTask[]>([]);
  const [documents, setDocuments] = useState<FundDocumentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadFoundation() {
      setLoading(true);
      setError(null);

      try {
        const [publicProfile, publicTasks] = await Promise.all([
          fundsService.getPublicFundProfile(id),
          fundsService.listPublicFundTasks(id).catch(() => [])
        ]);

        if (!active) return;

        setFoundation({
          activeTasks: publicProfile.active_tasks,
          city: publicProfile.region ?? "Регион не указан",
          curator: publicProfile.contact_person ?? "Координатор",
          focus: (publicProfile.help_categories ?? []).map(getCategoryLabel).join(", ") || "Направления помощи",
          id: publicProfile.id,
          moderationStatus: "approved",
          name: publicProfile.name,
          reportsReady: 0,
          responseRate: 0,
          volunteersNeeded: publicProfile.volunteers_total
        });
        setActiveTasks(publicTasks.map(mapTaskResponseToVolunteerTask));
        setDocuments(publicProfile.documents);
      } catch (requestError) {
        if (!active) return;
        setFoundation(null);
        setActiveTasks([]);
        setDocuments([]);
        setError(getApiErrorMessage(requestError));
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadFoundation();

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return <PublicState title="Загружаем страницу фонда..." />;
  }

  if (!foundation) {
    return <PublicState title="Фонд не найден" text={error ?? "Не удалось открыть публичную страницу фонда."} />;
  }

  return <FoundationPublicPage activeTasks={activeTasks} completedTasks={[]} documents={documents} foundation={foundation} />;
}

function PublicState({ title, text }: { title: string; text?: string }) {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <section className="rounded-[1.6rem] bg-white p-6 shadow-[0_22px_70px_rgba(34,28,8,0.08),inset_0_0_0_1px_rgba(24,20,7,0.06)]">
        <p className="text-xl font-black">{title}</p>
        {text ? <p className="mt-2 text-sm font-bold leading-6 text-black/54">{text}</p> : null}
      </section>
    </main>
  );
}
