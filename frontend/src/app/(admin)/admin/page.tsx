import { Activity, Check, Download, MessageSquare, ShieldCheck, X } from "lucide-react";
import { foundations, moderationQueue, tasks } from "@/shared/config/mock-data";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Textarea } from "@/shared/ui/form";
import { StatCard } from "@/shared/ui/stat-card";
import { Table, Td, Th } from "@/shared/ui/table";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-white p-6 shadow-[0_22px_70px_rgba(34,28,8,0.08),inset_0_0_0_1px_rgba(24,20,7,0.06)] md:p-8">
        <p className="text-sm font-extrabold uppercase text-black/48">Администрирование</p>
        <h1 className="mt-2 text-4xl md:text-6xl">Контроль качества программы</h1>
        <p className="mt-4 max-w-3xl text-black/64">Модерация фондов, задач, подтверждений часов и отчётов в одном рабочем интерфейсе.</p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="В очереди" value={7} delta="2 требуют решения сегодня" icon={ShieldCheck} tone="brand" />
        <StatCard label="SLA модерации" value="3.4 ч" delta="медиана за неделю" icon={Activity} tone="green" />
        <StatCard label="Экспортов" value={18} delta="CSV/XLSX за месяц" icon={Download} tone="blue" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_26rem]">
        <Card>
          <CardHeader><CardTitle>Очередь модерации</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {moderationQueue.map((item) => (
              <div key={item.id} className="grid gap-3 rounded-[1.25rem] bg-white/58 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <p className="font-black">{item.title}</p>
                  <p className="mt-1 text-sm text-foreground/58">{item.type} · {item.owner}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm"><Check className="size-4" />Approve</Button>
                  <Button size="sm" variant="danger"><X className="size-4" />Reject</Button>
                </div>
              </div>
            ))}
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
              <thead><tr><Th>Фонд</Th><Th>Город</Th><Th>Задачи</Th><Th>Статус</Th></tr></thead>
              <tbody>
                {foundations.map((foundation) => (
                  <tr key={foundation.id}>
                    <Td className="font-bold">{foundation.name}</Td>
                    <Td>{foundation.city}</Td>
                    <Td>{foundation.activeTasks}</Td>
                    <Td><Badge tone={foundation.moderationStatus === "approved" ? "green" : "brand"}>{foundation.moderationStatus}</Badge></Td>
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
                    <Td>{task.foundation}</Td>
                    <Td>{task.hours}</Td>
                    <Td>{task.filled}/{task.spots}</Td>
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
