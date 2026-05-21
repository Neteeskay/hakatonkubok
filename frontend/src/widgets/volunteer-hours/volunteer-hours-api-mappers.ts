import type {
  VolunteerHoursByCategoryItemResponse,
  VolunteerHoursDynamicsItemResponse,
  VolunteerHoursSummaryResponse
} from "@/shared/api/types";
import { getCategoryLabel } from "@/widgets/volunteer-feed/task-dictionaries";

export interface VolunteerHoursViewData {
  categories: Array<{
    color: string;
    hours: number;
    name: string;
    percent: number;
  }>;
  dynamics: Array<{
    hours: number;
    month: string;
  }>;
  summary: {
    confirmed: number;
    confirmedDays: number;
    month: number;
    monthDelta: number;
    pending: number;
    pendingDays: number;
    total: number;
    totalDays: number;
  };
}

const categoryColors = ["#FFE300", "#6B4DE6", "#111111", "#A2E8AA", "#FFB84D", "#64C7FF"];

function toNumber(value: string | number | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundHours(value: string | number | null | undefined) {
  return Math.round(toNumber(value));
}

function hoursToDays(hours: number) {
  return Math.round(hours / 8);
}

function formatMonth(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ru-RU", { month: "short" }).format(date).replace(".", "");
}

export function mapVolunteerHoursToViewData({
  byCategory,
  dynamics,
  summary
}: {
  byCategory: VolunteerHoursByCategoryItemResponse[];
  dynamics: VolunteerHoursDynamicsItemResponse[];
  summary: VolunteerHoursSummaryResponse;
}): VolunteerHoursViewData {
  const total = roundHours(summary.total_hours);
  const mappedDynamics = dynamics.map((item) => ({
    hours: roundHours(item.hours),
    month: formatMonth(item.period)
  }));
  const currentMonth = mappedDynamics.at(-1)?.hours ?? 0;
  const previousMonth = mappedDynamics.at(-2)?.hours ?? 0;
  const mappedCategories = byCategory.map((item, index) => {
    const hours = roundHours(item.hours);

    return {
      color: categoryColors[index % categoryColors.length],
      hours,
      name: getCategoryLabel(item.category),
      percent: total > 0 ? Math.round((hours / total) * 100) : 0
    };
  });

  return {
    categories: mappedCategories,
    dynamics: mappedDynamics,
    summary: {
      confirmed: total,
      confirmedDays: hoursToDays(total),
      month: currentMonth,
      monthDelta: currentMonth - previousMonth,
      pending: 0,
      pendingDays: 0,
      total,
      totalDays: hoursToDays(total)
    }
  };
}

export const emptyVolunteerHoursViewData: VolunteerHoursViewData = {
  categories: [],
  dynamics: [],
  summary: {
    confirmed: 0,
    confirmedDays: 0,
    month: 0,
    monthDelta: 0,
    pending: 0,
    pendingDays: 0,
    total: 0,
    totalDays: 0
  }
};
