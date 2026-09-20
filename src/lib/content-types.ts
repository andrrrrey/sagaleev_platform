import { z } from 'zod';

/** Команда/промпт в шаге маршрута (RouteStep.commands). */
export const commandSchema = z.object({
  label: z.string(),
  text: z.string(),
  kind: z.enum(['command', 'prompt']),
});
export type Command = z.infer<typeof commandSchema>;
export const commandsSchema = z.array(commandSchema);

export function parseCommands(json: unknown): Command[] {
  const r = commandsSchema.safeParse(json);
  return r.success ? r.data : [];
}

/** KPI-плитка юзкейса (ContentUnit.kpis) — понадобится на Этапе 3. */
export const kpiSchema = z.object({
  label: z.string(),
  value: z.string(),
  hint: z.string().optional(),
});
export type Kpi = z.infer<typeof kpiSchema>;

export const kpisSchema = z.array(kpiSchema);
export function parseKpis(json: unknown): Kpi[] {
  const r = kpisSchema.safeParse(json);
  return r.success ? r.data : [];
}

/** Таймкод видео (ContentUnit.timecodes). */
export const timecodeSchema = z.object({ t: z.number(), label: z.string() });
export type Timecode = z.infer<typeof timecodeSchema>;
export const timecodesSchema = z.array(timecodeSchema);
export function parseTimecodes(json: unknown): Timecode[] {
  const r = timecodesSchema.safeParse(json);
  return r.success ? r.data.slice().sort((a, b) => a.t - b.t) : [];
}

/** Пошаговое действие юзкейса (ContentUnit.steps). */
export const usecaseStepSchema = z.object({
  title: z.string(),
  body: z.string().optional(),
  command: z.string().optional(),
});
export type UsecaseStep = z.infer<typeof usecaseStepSchema>;
export const usecaseStepsSchema = z.array(usecaseStepSchema);
export function parseUsecaseSteps(json: unknown): UsecaseStep[] {
  const r = usecaseStepsSchema.safeParse(json);
  return r.success ? r.data : [];
}

/** Ссылка на репозиторий/материал (ContentUnit.repoLinks). */
export const repoLinkSchema = z.object({ title: z.string(), url: z.string() });
export type RepoLink = z.infer<typeof repoLinkSchema>;
export const repoLinksSchema = z.array(repoLinkSchema);
export function parseRepoLinks(json: unknown): RepoLink[] {
  const r = repoLinksSchema.safeParse(json);
  return r.success ? r.data : [];
}
