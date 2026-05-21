import { notFound } from "next/navigation";
import { foundations, tasks } from "@/shared/config/mock-data";
import { FoundationPublicPage } from "@/widgets/foundation-public/foundation-public-page";

export default async function FoundationPublicRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

  return <FoundationPublicPage activeTasks={activeTasks} completedTasks={archiveTasks} foundation={foundation} />;
}
