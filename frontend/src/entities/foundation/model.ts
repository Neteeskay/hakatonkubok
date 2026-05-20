export interface Foundation {
  id: string;
  name: string;
  focus: string;
  city: string;
  activeTasks: number;
  volunteersNeeded: number;
  responseRate: number;
  moderationStatus: "approved" | "review" | "changes";
  curator: string;
  reportsReady: number;
}
