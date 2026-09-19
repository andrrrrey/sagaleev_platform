/**
 * Инлайн-скрипт, применяющий тему до первой отрисовки (без «мигания»).
 * Явный выбор хранится в localStorage('theme') = 'light' | 'dark';
 * значение 'system' (или отсутствие) → тема следует за prefers-color-scheme.
 */
export function ThemeScript() {
  const code = `(function(){try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
