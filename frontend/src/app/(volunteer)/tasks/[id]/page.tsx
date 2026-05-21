import { TaskDetailClient } from "@/widgets/task-detail/task-detail-client";

export default async function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TaskDetailClient taskId={id} />;
}
