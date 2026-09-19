export type NavItem = {
  href: string;
  label: string;
  icon: string; // solar name без префикса
};

/** Верхнее меню студента (docs/02 §2.3). */
export const STUDENT_NAV: NavItem[] = [
  { href: '/', label: 'Главная', icon: 'home-smile-linear' },
  { href: '/route', label: 'Маршрут', icon: 'routing-linear' },
  { href: '/skills', label: 'Скиллы', icon: 'bolt-linear' },
  { href: '/usecases', label: 'Юзкейсы', icon: 'chart-2-linear' },
  { href: '/lessons', label: 'Уроки', icon: 'videocamera-record-linear' },
  { href: '/streams', label: 'Эфиры', icon: 'microphone-3-linear' },
  { href: '/leaderboard', label: 'Лидерборд', icon: 'cup-first-linear' },
  { href: '/profile', label: 'Профиль', icon: 'user-linear' },
];

/** Нижняя навигация на <md (5 табов). */
export const MOBILE_NAV: NavItem[] = [
  { href: '/', label: 'Главная', icon: 'home-smile-linear' },
  { href: '/route', label: 'Маршрут', icon: 'routing-linear' },
  { href: '/skills', label: 'Скиллы', icon: 'bolt-linear' },
  { href: '/usecases', label: 'Юзкейсы', icon: 'chart-2-linear' },
  { href: '/profile', label: 'Профиль', icon: 'user-linear' },
];

/** Левое меню админки. EDITOR видит только контентные пункты. */
export const ADMIN_NAV: Array<NavItem & { adminOnly?: boolean }> = [
  { href: '/admin', label: 'Обзор', icon: 'widget-linear' },
  { href: '/admin/students', label: 'Студенты', icon: 'users-group-rounded-linear', adminOnly: true },
  { href: '/admin/payments', label: 'Оплаты', icon: 'card-linear', adminOnly: true },
  { href: '/admin/plans', label: 'Тарифы', icon: 'wallet-money-linear', adminOnly: true },
  { href: '/admin/skills', label: 'Скиллы', icon: 'bolt-linear' },
  { href: '/admin/route', label: 'Маршрут', icon: 'routing-linear' },
  { href: '/admin/content', label: 'Контент', icon: 'document-text-linear' },
  { href: '/admin/tags', label: 'Теги', icon: 'point-on-map-linear' },
  { href: '/admin/banners', label: 'Баннеры', icon: 'graph-new-linear' },
  { href: '/admin/cohort', label: 'Поток', icon: 'chart-2-linear', adminOnly: true },
  { href: '/admin/curator', label: 'Куратор', icon: 'diploma-verified-linear', adminOnly: true },
  { href: '/admin/users', label: 'Пользователи', icon: 'user-linear', adminOnly: true },
  { href: '/admin/settings', label: 'Настройки', icon: 'settings-linear', adminOnly: true },
];
