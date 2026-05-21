import { notFound } from "next/navigation";
import type { Foundation } from "@/entities/foundation/model";
import { fundsService } from "@/shared/api";
import { foundations, tasks } from "@/shared/config/mock-data";
import { mapTaskResponseToVolunteerTask } from "@/widgets/volunteer-feed/task-api-mappers";
import { getCategoryLabel } from "@/widgets/volunteer-feed/task-dictionaries";
import { FoundationPublicPage } from "@/widgets/foundation-public/foundation-public-page";

export default async function FoundationPreviewRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const publicProfile = await fundsService.getPublicFundProfile(id).catch(() => null);
  if (publicProfile) {
    const publicTasks = await fundsService.listPublicFundTasks(id).catch(() => []);
    const mappedTasks = publicTasks.map(mapTaskResponseToVolunteerTask);
    const foundation: Foundation = {
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
    };

    return (
      <main className="min-h-screen bg-[#fffdf7] px-4 py-5 md:px-6">
        <div className="mx-auto max-w-[1500px]">
          <FoundationPublicPage activeTasks={mappedTasks} completedTasks={[]} documents={publicProfile.documents} foundation={foundation} />
        </div>
      </main>
    );
  }

  const foundation = foundations.find((item) => item.id === id);
  if (!foundation) notFound();

  const foundationTasks = tasks.filter((task) => task.foundationId === foundation.id);
  const activeTasks = foundationTasks.filter((task) => task.status !== "completed").slice(0, 4);
  const completedTasks = foundationTasks.filter((task) => task.status === "completed");
  const archiveTasks = completedTasks.length
    ? completedTasks
    : foundationTasks.slice(0, 2).map((task) => ({
        ...task,
        date: task.commitment === "regular" ? "апрель 2026" : "март 2026",
        deadline: "завершено",
        status: "completed" as const
      }));

  return (
    <main className="min-h-screen bg-[#fffdf7] px-4 py-5 md:px-6">
      <div className="mx-auto max-w-[1500px]">
        <FoundationPublicPage activeTasks={activeTasks} completedTasks={archiveTasks} foundation={foundation} />
      </div>
    </main>
  );
}
