export type ActionState = {
  ok: boolean;
  message?: string;
  /** Ошибки по полям формы. */
  fieldErrors?: Record<string, string>;
  /** Полезная нагрузка (напр. dev-ссылка подтверждения). */
  meta?: Record<string, string>;
};

export const initialActionState: ActionState = { ok: false };

export function fieldErrorsFromZod(
  issues: { path: (string | number)[]; message: string }[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const key = String(i.path[0] ?? '_');
    if (!out[key]) out[key] = i.message;
  }
  return out;
}
