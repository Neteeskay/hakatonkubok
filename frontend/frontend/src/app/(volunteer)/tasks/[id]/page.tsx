import { notFound } from "next/navigation";
import { foundations, tasks } from "@/shared/config/mock-data";
import { TaskDetailPage } from "@/widgets/task-detail/task-detail-page";

export default async function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = tasks.find((item) => item.id === id);
  if (!task) notFound();
  const foundation = foundations.find((item) => item.id === task.foundationId);
  if (!foundation) notFound();
  const related = tasks
    .filter((item) => item.id !== task.id && (item.category === task.category || item.foundationId === task.foundationId))
    .slice(0, 2);

  return <TaskDetailPage foundation={foundation} related={related} task={task} />;
}
