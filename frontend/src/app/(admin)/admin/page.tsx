"use client";

import { Activity, Check, Download, MessageSquare, ShieldCheck, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/shared/api/services";
import type { ApiAdminFund, ApiAdminTask } from "@/shared/api/types";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Textarea } from "@/shared/ui/form";
import { StatCard } from "@/shared/ui/stat-card";
import { Table, Td, Th } from "@/shared/ui/table";

type QueueItem = {
  id: string;
  kind: "fund" | "task";
  title: string;
  type: string;
  owner: string;
};

export default function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const { data: dashboard } = useQuery({ queryKey: ["admin", "dashboard"], queryFn: () => adminApi.dashboard() });
  const { data: funds = [] } = useQuery({ queryKey: ["admin", "funds"], queryFn: () => adminApi.funds() });
  const { data: tasks = [] } = useQuery({ queryKey: ["admin", "tasks"], queryFn: () => adminApi.tasks() });

  const moderationQueue: QueueItem[] = [
    ...funds.filter((fund) => fund.status === "pending_review").map(fundToQueueItem),
    ...tasks.filter((task) => task.status === "pending_review").map(taskToQueueItem)
  ];

  const moderationMutation = useMutation({
    mutationFn: async ({ item, approve }: { item: QueueItem; approve: boolean }) => {
      if (item.kind === "fund") {
        await adminApi.moderateFund(item.id, approve ? "approved" : "rejected", approve ? null : "Отклонено администратором");
        return;
      }
      await adminApi.moderateTask(item.id, approve ? "published" : "rejected", approve ? null : "Отклонено администратором");
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "funds"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "tasks"] })
      ]);
    }
  });

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-white p-6 shadow-[0_22px_70px_rgba(34,28,8,0.08),inset_0_0_0_1px_rgba(24,20,7,0.06)] md:p-8">
        <p className="text-sm font-extrabold uppercase text-black/48">Администрирование</p>
        <h1 className="mt-2 text-4xl md:text-6xl">Контроль качества программы</h1>
        <p className="mt-4 max-w-3xl text-black/64">Модерация фондов, задач, подтверждений часов и отчётов в одном рабочем интерфейсе.</p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="В очереди" value={moderationQueue.length} delta={`${dashboard?.tasks_pending_review ?? 0} задач и ${dashboard?.funds_pending_review ?? 0} фондов`} icon={ShieldCheck} tone="brand" />
        <StatCard label="Всего откликов" value={dashboard?.applications_total ?? 0} delta="данные backend" icon={Activity} tone="green" />
        <StatCard label="Часов начислено" value={dashboard?.awarded_hours_total ?? 0} delta="по ledger" icon={Download} tone="blue" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_26rem]">
        <Card>
          <CardHeader><CardTitle>Очередь модерации</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {moderationQueue.map((item) => (
              <div key={`${item.kind}-${item.id}`} className="grid gap-3 rounded-[1.25rem] bg-white/58 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <p className="font-black">{item.title}</p>
                  <p className="mt-1 text-sm text-foreground/58">{item.type} · {item.owner}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" disabled={moderationMutation.isPending} onClick={() => moderationMutation.mutate({ item, approve: true })}><Check className="size-4" />Approve</Button>
                  <Button size="sm" variant="danger" disabled={moderationMutation.isPending} onClick={() => moderationMutation.mutate({ item, approve: false })}><X className="size-4" />Reject</Button>
                </div>
              </div>
            ))}
            {!moderationQueue.length ? <p className="rounded-[1.1rem] bg-white/60 p-4 text-sm font-bold text-black/54">Очередь пуста.</p> : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Комментарий</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Textarea placeholder="Напишите понятный комментарий фонду или координатору" />
            <Button className="w-full" variant="secondary"><MessageSquare className="size-4" />Отправить</Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Фонды на контроле</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <thead><tr><Th>Фонд</Th><Th>Город</Th><Th>Контакт</Th><Th>Статус</Th></tr></thead>
              <tbody>
                {funds.map((foundation) => (
                  <tr key={foundation.id}>
                    <Td className="font-bold">{foundation.name}</Td>
                    <Td>{foundation.region ?? "Не указан"}</Td>
                    <Td>{foundation.contact_person ?? foundation.contact_email ?? "Не указан"}</Td>
                    <Td><Badge tone={foundation.status === "approved" ? "green" : "brand"}>{foundation.status}</Badge></Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Задачи на проверке</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <thead><tr><Th>Задача</Th><Th>Фонд</Th><Th>Часы</Th><Th>Набор</Th></tr></thead>
              <tbody>
                {tasks.slice(0, 4).map((task) => (
                  <tr key={task.id}>
                    <Td className="font-bold">{task.title}</Td>
                    <Td>{task.fund_id.slice(0, 8)}</Td>
                    <Td>{task.expected_hours}</Td>
                    <Td>{task.participant_limit ?? "∞"}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function fundToQueueItem(fund: ApiAdminFund): QueueItem {
  return {
    id: fund.id,
    kind: "fund",
    title: fund.name,
    type: "Фонд",
    owner: fund.contact_person ?? fund.contact_email ?? "Контакт не указан"
  };
}

function taskToQueueItem(task: ApiAdminTask): QueueItem {
  return {
    id: task.id,
    kind: "task",
    title: task.title,
    type: "Задание",
    owner: task.city ?? task.fund_id
  };
}
