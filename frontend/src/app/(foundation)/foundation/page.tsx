import { Download, FileSpreadsheet, Plus, Users } from "lucide-react";
import { applications, foundations, tasks } from "@/shared/config/mock-data";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input, Select, Textarea } from "@/shared/ui/form";
import { StatCard } from "@/shared/ui/stat-card";
import { Table, Td, Th } from "@/shared/ui/table";
import { ImpactChart } from "@/widgets/dashboard/impact-chart";

export default function FoundationDashboardPage() {
  const foundation = foundations[0];

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
            <Button><Plus className="size-4" />Новая задача</Button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Активных задач" value={foundation.activeTasks} delta="2 требуют набора" icon={Plus} tone="brand" />
        <StatCard label="Нужны волонтёры" value={foundation.volunteersNeeded} delta="по текущим задачам" icon={Users} tone="blue" />
        <StatCard label="Отклики приняты" value={`${foundation.responseRate}%`} delta="средний показатель" icon={FileSpreadsheet} tone="green" />
        <StatCard label="Готовые отчёты" value={foundation.reportsReady} delta="за квартал" icon={Download} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_26rem]">
        <Card>
          <CardHeader><CardTitle>Аналитика задач</CardTitle></CardHeader>
          <CardContent><ImpactChart /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Создать задачу</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Название задачи" />
            <Select><option>Спорт и события</option><option>Pro bono</option><option>Образование</option></Select>
            <Textarea placeholder="Краткое описание для волонтёров" />
            <Button className="w-full">Отправить на модерацию</Button>
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
                    <Td>{task.deadline}</Td>
                    <Td>{task.filled}/{task.spots}</Td>
                    <Td><Badge tone={task.status === "open" ? "green" : "blue"}>{task.status === "open" ? "открыта" : "в работе"}</Badge></Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Комментарии модерации</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {["Уточните точку встречи для спортивного дня", "Добавьте контакт координатора", "Отчёт за апрель готов к экспорту"].map((item) => (
              <div key={item} className="rounded-[1.15rem] bg-white/58 p-4 text-sm leading-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">{item}</div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Заявки волонтёров</CardTitle>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm"><FileSpreadsheet className="size-4" />XLSX</Button>
            <Button variant="secondary" size="sm">Отчёт</Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <thead><tr><Th>Волонтёр</Th><Th>Задача</Th><Th>Часы</Th><Th>Статус</Th></tr></thead>
            <tbody>
              {applications.map((application) => (
                <tr key={application.id}>
                  <Td className="font-bold">{application.volunteer}</Td>
                  <Td>{application.task}</Td>
                  <Td>{application.hours}</Td>
                  <Td><Badge tone={application.status === "принята" ? "green" : "brand"}>{application.status}</Badge></Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
