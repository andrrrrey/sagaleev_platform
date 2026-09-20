import { test, expect } from '@playwright/test';

/**
 * Смоук публичных экранов (не требуют БД) + проверка отсутствия
 * горизонтального скролла. Экраны с БД покрываются в CI с Postgres.
 */
const pages = [
  { path: '/login', heading: /Войти/ },
  { path: '/register', heading: /Создать аккаунт/ },
  { path: '/forgot', heading: /Восстановить пароль/ },
];

for (const p of pages) {
  test(`рендерится ${p.path}`, async ({ page }) => {
    await page.goto(p.path);
    await expect(page.locator('h1')).toContainText(p.heading);
    // Рама эталона присутствует.
    await expect(page.locator('text=sys_auth_01')).toBeVisible();
  });
}

test('нет горизонтального скролла на 375px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/register');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test('переключатель темы меняет data-theme', async ({ page }) => {
  await page.goto('/login');
  const toggle = page.getByRole('button', { name: /Тема/ });
  await toggle.click(); // system → light
  await toggle.click(); // light → dark
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});
