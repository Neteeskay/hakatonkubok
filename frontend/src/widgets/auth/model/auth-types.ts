import type { LucideIcon } from "lucide-react";

export type AuthMode = "login" | "register" | "recovery";
export type RegistrationRole = "volunteer" | "foundation";

export interface DemoRole {
  login: string;
  password: string;
  title: string;
  text: string;
  helper: string;
  href: string;
  registerHref: string;
  icon: LucideIcon;
}
