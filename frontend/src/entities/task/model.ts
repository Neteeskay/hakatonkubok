export type TaskStatus = "open" | "in_progress" | "completed";
export type TaskFormat = "onsite" | "online" | "hybrid";
export type TaskSkill = string;
export type TaskCommitment = "one-time" | "regular" | "long-term";
export type TaskCategory =
  | "children"
  | "elderly"
  | "disability"
  | "sport"
  | "ecology"
  | "education"
  | "animals"
  | "probono"
  | "events";

export interface VolunteerTask {
  id: string;
  title: string;
  foundation: string;
  foundationId: string;
  city: string;
  format: TaskFormat;
  commitment: TaskCommitment;
  category: TaskCategory;
  proBono: boolean;
  date: string;
  deadline: string;
  hours: number;
  spots: number;
  filled: number;
  status: TaskStatus;
  skills: TaskSkill[];
  impact: string;
  description: string;
  location: string;
  contact: {
    name: string;
    role: string;
    phone: string;
  };
  requirements: string[];
  instructions: string[];
  timeline: { time: string; title: string; description: string }[];
}
