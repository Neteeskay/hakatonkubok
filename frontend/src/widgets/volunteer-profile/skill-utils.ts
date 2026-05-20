import { skillOptions, type SkillOption } from "@/widgets/volunteer-profile/skills-dictionary";

export function normalizeSkill(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("ru-RU");
}

export function cleanSkillLabel(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function hasSkill(skills: string[], value: string) {
  const normalized = normalizeSkill(value);
  return skills.some((skill) => normalizeSkill(skill) === normalized);
}

export function addSkill(skills: string[], value: string) {
  const label = cleanSkillLabel(value);
  if (!isValidSkill(label) || hasSkill(skills, label)) return skills;
  return [...skills, label];
}

export function removeSkill(skills: string[], value: string) {
  const normalized = normalizeSkill(value);
  return skills.filter((skill) => normalizeSkill(skill) !== normalized);
}

export function isValidSkill(value: string) {
  const label = cleanSkillLabel(value);
  if (label.length < 2 || label.length > 42) return false;
  return /[\p{L}\d]/u.test(label) && !/^[^\p{L}\d]+$/u.test(label);
}

export function findSkillSuggestions(query: string, selected: string[], groups: SkillOption["group"][], limit = 6) {
  const normalizedQuery = normalizeSkill(query);
  if (!normalizedQuery) {
    return skillOptions.filter((option) => groups.includes(option.group) && !hasSkill(selected, option.label)).slice(0, limit);
  }

  return skillOptions
    .filter((option) => groups.includes(option.group) && !hasSkill(selected, option.label))
    .map((option) => ({ option, score: scoreOption(option, normalizedQuery) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.option.label.localeCompare(b.option.label, "ru"))
    .slice(0, limit)
    .map((item) => item.option);
}

function scoreOption(option: SkillOption, query: string) {
  const values = [option.label, ...(option.aliases ?? [])].map(normalizeSkill);
  let best = 0;

  for (const value of values) {
    const words = value.split(/\s+/);
    if (value.startsWith(query) || words.some((word) => word.startsWith(query))) best = Math.max(best, 100);
    if (value.includes(query)) best = Math.max(best, 72);
    if (words.some((word) => levenshtein(word.slice(0, Math.max(query.length, 3)), query) <= 1)) best = Math.max(best, 56);
    if (levenshtein(value.slice(0, Math.max(query.length, 4)), query) <= 2) best = Math.max(best, 48);
  }

  return best;
}

function levenshtein(a: string, b: string) {
  const matrix = Array.from({ length: a.length + 1 }, (_, i) => Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }

  return matrix[a.length][b.length];
}
