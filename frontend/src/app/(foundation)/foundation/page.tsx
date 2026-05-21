"use client";

import Link from "next/link";
import { Download, FileSpreadsheet, Plus, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { applicationApi, fundApi, taskApi } from "@/shared/api/services";
import { mapApiFundToFoundation } from "@/shared/api/mappers";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { StatCard } from "@/shared/ui/stat-card";
import { Table, Td, Th } from "@/shared/ui/table";
import { ImpactChart } from "@/widgets/dashboard/impact-chart";

export default function FoundationDashboardPage() {
  const fundQuery = useQuery({ queryKey: ["fund", "me"], queryFn: () => fundApi.me() });
  const tasksQuery = useQuery({ queryKey: ["tasks", "foundation"], queryFn: () => taskApi.listMine() });
  const applicationsQuery = useQuery({ queryKey: ["applications", "foundation"], queryFn: () => applicationApi.listFund() });
  const tasks = tasksQuery.data ?? [];
  const applications = applicationsQuery.data ?? [];
  const foundation = fundQuery.data
    ? mapApiFundToFoundation(fundQuery.data, tasks, applications)
    : { name: "Фонд", focus: "Данные загружаются", curator: "", activeTasks: 0, volunteersNeeded: 0, responseRate: 0, reportsReady: 0 };

  return (
    <div className="space-y-6">
      <section className="gold-panel rounded-[2rem] p-6 md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-wide text-black/48">Кабинет фонда</p>
            <h1 className="mt-2 text-4xl md:text-6xl">{foundation.name}</h1>
            <p className="mt-3 max-w-2xl text-black/62">{foundation.focus} · куратор {foundation.curator}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost"><Download className="size-4" />CSV</Button>
            <Button asChild><Link href="/foundation/create-task"><Plus className="size-4" />Новая задача</Link></Button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Активных задач" value={foundation.activeTasks} delta="по backend" icon={Plus} tone="brand" />
        <StatCard label="Нужны волонтеры" value={foundation.volunteersNeeded} delta="по текущим задачам" icon={Users} tone="blue" />
        <StatCard label="Отклики приняты" value={`${foundation.responseRate}%`} delta="средний показатель" icon={FileSpreadsheet} tone="green" />
        <StatCard label="Документы" value={foundation.reportsReady} delta="загружено" icon={Download} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_26rem]">
        <Card>
          <CardHeader><CardTitle>Аналитика задач</CardTitle></CardHeader>
          <CardContent><ImpactChart /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Статус профиля</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Badge tone={fundQuery.data?.status === "approved" ? "green" : "brand"}>{fundQuery.data?.status ?? "loading"}</Badge>
            <p className="text-sm font-bold leading-6 text-black/58">{fundQuery.data?.moderation_comment ?? "Комментариев модерации нет"}</p>
            <Button asChild className="w-full"><Link href="/foundation/profile">Открыть профиль</Link></Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_26rem]">
        <Card>
          <CardHeader><CardTitle>Управление задачами</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <thead><tr><Th>Задача</Th><Th>Дедлайн</Th><Th>Набор</Th><Th>Статус</Th></tr></thead>
              <tbody>
                {tasks.slice(0, 4).map((task) => (
                  <tr key={task.id}>
                    <Td className="font-bold">{task.title}</Td>
                    <Td>{task.deadline_at ? new Date(task.deadline_at).toLocaleDateString("ru-RU") : "-"}</Td>
                    <Td>{task.participant_limit ?? "-"}</Td>
                    <Td><Badge tone={task.status === "published" ? "green" : "blue"}>{task.status}</Badge></Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Комментарии модерации</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[fundQuery.data?.moderation_comment, ...tasks.map((task) => task.moderation_comment)].filter(Boolean).map((item) => (
              <div key={item} className="rounded-[1.15rem] bg-white/58 p-4 text-sm leading-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">{item}</div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Заявки волонтеров</CardTitle>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm"><FileSpreadsheet className="size-4" />XLSX</Button>
            <Button variant="secondary" size="sm">Отчет</Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <thead><tr><Th>Волонтер</Th><Th>Задача</Th><Th>Часы</Th><Th>Статус</Th></tr></thead>
            <tbody>
              {applications.map((application) => (
                <tr key={application.id}>
                  <Td className="font-bold">{application.volunteer?.full_name ?? application.volunteer?.email ?? application.volunteer_id}</Td>
                  <Td>{application.task?.title ?? application.task_id}</Td>
                  <Td>{application.task?.expected_hours ?? "-"}</Td>
                  <Td><Badge tone={application.status === "accepted" ? "green" : "brand"}>{application.status}</Badge></Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
