"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/shared/ui/button";
import { Input, Textarea } from "@/shared/ui/form";

const applicationSchema = z.object({
  motivation: z.string().min(12),
  phone: z.string().min(7)
});

type ApplicationValues = z.infer<typeof applicationSchema>;

export function ApplicationForm() {
  const form = useForm<ApplicationValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: { motivation: "", phone: "" }
  });

  return (
    <form className="space-y-3" onSubmit={form.handleSubmit(() => undefined)}>
      <Input placeholder="Телефон для координатора" {...form.register("phone")} />
      <Textarea placeholder="Почему вам интересна эта задача" {...form.register("motivation")} />
      <Button className="w-full" type="submit">
        Откликнуться
      </Button>
    </form>
  );
}
