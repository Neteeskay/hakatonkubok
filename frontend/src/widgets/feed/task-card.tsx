import Link from "next/link";
import { ArrowRight, Clock, MapPin, Timer, Users } from "lucide-react";
import type { VolunteerTask } from "@/entities/task/model";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";

const skillNames = {
  events: "События",
  media: "Медиа",
  logistics: "Логистика",
  mentoring: "Наставничество",
  design: "Дизайн",
  analytics: "Аналитика"
};

export function TaskCard({ task }: { task: VolunteerTask }) {
  const progress = Math.round((task.filled / task.spots) * 100);

  return (
    <Card className="group transition duration-300 hover:-translate-y-1 hover:shadow-lift">
      <CardContent className="p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap gap-2">
              {task.skills.map((skill) => (
                <Badge key={skill} tone="brand">{skillNames[skill]}</Badge>
              ))}
              {task.proBono ? <Badge tone="blue">Pro bono</Badge> : null}
            </div>
            <h3 className="text-lg font-semibold">{task.title}</h3>
            <p className="mt-1 text-sm text-foreground/58">{task.foundation}</p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-foreground/58">
              <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" />{task.city}</span>
              <span className="inline-flex items-center gap-1.5"><Clock className="size-4" />{task.deadline}</span>
              <span className="inline-flex items-center gap-1.5"><Timer className="size-4" />{task.hours} ч.</span>
              <span className="inline-flex items-center gap-1.5"><Users className="size-4" />{task.filled}/{task.spots}</span>
            </div>
          </div>
          <Button asChild className="md:shrink-0">
            <Link href={`/volunteer/tasks/${task.id}`}>
              Открыть
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        <div className="mt-5">
          <div className="mb-2 flex justify-between text-xs font-medium text-foreground/52">
            <span>{task.impact}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-lg bg-surface-muted">
            <div className="h-full rounded-lg bg-brand" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
