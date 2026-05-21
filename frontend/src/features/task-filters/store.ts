import { create } from "zustand";

interface TaskFiltersState {
  city: string;
  format: string;
  search: string;
  category: string;
  deadline: string;
  duration: string;
  proBono: boolean;
  skill: string;
  hours: string;
  status: string;
  sort: string;
  setCity: (city: string) => void;
  setFormat: (format: string) => void;
  setSearch: (search: string) => void;
  setCategory: (category: string) => void;
  setDeadline: (deadline: string) => void;
  setDuration: (duration: string) => void;
  setProBono: (proBono: boolean) => void;
  setSkill: (skill: string) => void;
  setHours: (hours: string) => void;
  setStatus: (status: string) => void;
  setSort: (sort: string) => void;
  reset: () => void;
}

const defaultFilters = {
  city: "Все города",
  format: "Любой формат",
  search: "",
  category: "Все категории",
  deadline: "Любой дедлайн",
  duration: "Любая длительность",
  proBono: false,
  skill: "Любые навыки",
  hours: "Любые часы",
  status: "Любой статус",
  sort: "Сначала новые"
};

export const useTaskFilters = create<TaskFiltersState>((set) => ({
  ...defaultFilters,
  setCity: (city) => set({ city }),
  setFormat: (format) => set({ format }),
  setSearch: (search) => set({ search }),
  setCategory: (category) => set({ category }),
  setDeadline: (deadline) => set({ deadline }),
  setDuration: (duration) => set({ duration }),
  setProBono: (proBono) => set({ proBono }),
  setSkill: (skill) => set({ skill }),
  setHours: (hours) => set({ hours }),
  setStatus: (status) => set({ status }),
  setSort: (sort) => set({ sort }),
  reset: () => set(defaultFilters)
}));
