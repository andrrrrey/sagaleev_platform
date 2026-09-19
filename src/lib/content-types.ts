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

/** Таймкод видео (ContentUnit.timecodes). */
export const timecodeSchema = z.object({ t: z.number(), label: z.string() });
export type Timecode = z.infer<typeof timecodeSchema>;
