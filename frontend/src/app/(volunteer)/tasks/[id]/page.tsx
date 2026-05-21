import { TaskDetailRoute } from "@/widgets/task-detail/task-detail-route";

export default async function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <TaskDetailRoute taskId={id} />;
}
