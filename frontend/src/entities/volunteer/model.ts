export interface VolunteerProfile {
  id: string;
  name: string;
  role: string;
  department: string;
  city: string;
  hours: number;
  completedTasks: number;
  interests: string[];
  level: "Новичок" | "Уверенный волонтёр" | "Амбассадор";
  activeTaskIds: string[];
  achievements: string[];
  history: { title: string; date: string; hours: number; status: string }[];
  notifications: { title: string; text: string }[];
}
