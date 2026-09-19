/** Нижняя мерная лента мастер-контейнера (обязательна на каждом экране). */
export function TickBorder() {
  return (
    <div className="bg-tick pointer-events-none relative z-10 h-8 w-full border-t border-line bg-paper opacity-50" />
  );
}
