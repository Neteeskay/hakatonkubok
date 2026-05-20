import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Calendar, CheckCircle2, Clock, MapPin, Phone, Users } from "lucide-react";
import { ApplicationForm } from "@/features/application-form/application-form";
import { foundations, tasks } from "@/shared/config/mock-data";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { TaskCard } from "@/widgets/feed/task-card";

export default async function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = tasks.find((item) => item.id === id);
  if (!task) notFound();
  const foundation = foundations.find((item) => item.id === task.foundationId);
  const related = tasks.filter((item) => item.id !== task.id).slice(0, 2);

  return (
    <div className="space-y-6">
      <section className="gold-panel rounded-[2rem] p-6 md:p-8">
        <div className="grid gap-7 lg:grid-cols-[1fr_24rem]">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="brand">{task.foundation}</Badge>
              <Badge tone={task.status === "open" ? "green" : "blue"}>{task.status === "open" ? "Набор открыт" : "В работе"}</Badge>
              {task.proBono ? <Badge tone="blue">Pro bono</Badge> : null}
            </div>
            <h1 className="mt-5 max-w-4xl text-4xl md:text-6xl">{task.title}</h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-foreground/68">{task.description}</p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                [MapPin, task.city],
                [Calendar, task.date],
                [Clock, task.deadline],
                [Users, `${task.filled}/${task.spots} мест`]
              ].map(([Icon, text]) => (
                <div key={String(text)} className="rounded-[1.2rem] bg-white/58 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                  <Icon className="size-5 text-foreground/52" />
                  <p className="mt-3 font-extrabold">{String(text)}</p>
                </div>
              ))}
            </div>
          </div>
          <Card className="h-fit bg-white">
          <CardHeader><CardTitle>Участие</CardTitle></CardHeader>
            <CardContent>
              <div className="mb-4 rounded-2xl bg-[#fff8d7] p-4">
                <p className="text-4xl font-black">{task.hours} ч.</p>
                <p className="text-sm text-black/62">будет засчитано после подтверждения фонда</p>
              </div>
              <ApplicationForm />
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle>Как пройдёт участие</CardTitle></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              {task.timeline.map((item) => (
                <div key={item.time} className="rounded-[1.15rem] bg-surface-raised p-4">
                  <p className="text-sm font-black text-accent-red">{item.time}</p>
                  <h3 className="mt-3 text-base">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-foreground/58">{item.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-5 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Требования</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {task.requirements.map((item) => (
                  <p key={item} className="flex gap-3 text-sm leading-6"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />{item}</p>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Инструкция</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {task.instructions.map((item, index) => (
                  <p key={item} className="flex gap-3 text-sm leading-6"><span className="grid size-6 shrink-0 place-items-center rounded-lg bg-brand text-xs font-black">{index + 1}</span>{item}</p>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Локация</CardTitle></CardHeader>
            <CardContent>
              <div className="grid min-h-56 place-items-center rounded-[1.35rem] bg-surface-raised p-6 text-center">
                <div>
                  <MapPin className="mx-auto size-8" />
                  <p className="mt-4 text-xl font-black">{task.location}</p>
                  <p className="mt-2 text-sm text-foreground/58">Точная точка встречи появится после подтверждения участия.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-5">
          <Card>
            <CardHeader><CardTitle>Контакт фонда</CardTitle></CardHeader>
            <CardContent>
              <p className="text-lg font-black">{task.contact.name}</p>
              <p className="mt-1 text-sm text-foreground/58">{task.contact.role}</p>
              <p className="mt-4 flex items-center gap-2 text-sm font-bold"><Phone className="size-4" />{task.contact.phone}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>О фонде</CardTitle></CardHeader>
            <CardContent>
              <p className="text-lg font-black">{foundation?.name}</p>
              <p className="mt-2 text-sm leading-6 text-foreground/62">{foundation?.focus}</p>
              <Button className="mt-5 w-full" variant="ghost" asChild><Link href="/foundation">Открыть профиль <ArrowRight className="size-4" /></Link></Button>
            </CardContent>
          </Card>
        </aside>
      </div>

      <section>
        <h2 className="mb-4">Похожие задачи</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {related.map((item) => <TaskCard key={item.id} task={item} />)}
        </div>
      </section>
    </div>
  );
}
