import { cn } from "@/shared/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  className
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("max-w-3xl", className)}>
      {eyebrow ? <p className="mb-2 text-sm font-extrabold uppercase tracking-wide text-foreground/48">{eyebrow}</p> : null}
      <h2>{title}</h2>
      {description ? <p className="mt-3 text-base leading-7 text-foreground/62">{description}</p> : null}
    </div>
  );
}
