# 02. Дизайн-система: 1:1 с `docs/reference/docuframe-hero.html`

> **Правило №1.** Стиль берём из эталона буквально. Это светлая «бумажная» техническая эстетика (тёплый бежевый `#f6f5ef`) в тёмной внешней раме `#111110`. Тёмная тема и gold-акценты из КП **не используются**. Акцент один: оранжево-красный `#d95321`.
>
> Перед версткой любого экрана открой `docs/reference/docuframe-hero.html` и сверься. Если в этом документе и в эталоне есть расхождение, прав эталон.

## 1. Токены

### 1.1 Цвета (точные значения из эталона)

| Токен | Значение | Где используется в эталоне |
|---|---|---|
| `page-bg` | `#111110` | `body`, внешняя тёмная подложка вокруг рамы |
| `paper` | `#f6f5ef` | Мастер-контейнер, шапки панелей, футеры инпутов, `nav` |
| `paper-panel` | `#fbfaf6` | Панели/карточки (чат-окно), вторичная кнопка |
| `paper-tint` | `#efede6` (с `/40`) | Правая визуальная колонка |
| `paper-hover` | `#eae7df` | hover кнопки «Initialize» |
| `line` | `#e0dcd0` | Все границы, линии, «бумага» |
| `ink` | `#1a1a19` | Основная кнопка (фон), border |
| `ink-hover` | `#000000` | hover основной кнопки |
| `accent` | `#d95321` | Kicker, иконки-акценты, звёзды, индикатор-пульс, hover-цвета, `selection` |
| Tailwind zinc | `zinc-900` заголовки, `zinc-800` текст, `zinc-700` вторичный, `zinc-600` подзаголовок, `zinc-500` мелкий/нав, `zinc-400` неактивные иконки/лейблы, `zinc-300` рамки уголков/кроссхейры | |
| `white` | `#ffffff` | Мини-плашки статуса, логотип-квадрат, вторичные кнопки-инпуты |

`selection`: фон `#d95321` c 20% прозрачности, текст `#d95321`.

Функциональные состояния (ошибка/успех), которых нет в эталоне, см. раздел 6.

### 1.2 Tailwind-конфиг (обязательный)

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        page:   '#111110',
        paper:  { DEFAULT: '#f6f5ef', panel: '#fbfaf6', tint: '#efede6', hover: '#eae7df' },
        line:   '#e0dcd0',
        ink:    { DEFAULT: '#1a1a19', hover: '#000000' },
        accent: '#d95321',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        frame: '0 25px 50px -12px rgb(0 0 0 / 0.25)',   // shadow-2xl эталона
        panel: '0 8px 30px rgba(0,0,0,0.03)',
      },
    },
  },
} satisfies Config;
```

Допустимо и использовать в разметке произвольные значения `bg-[#f6f5ef]`, как в эталоне. Токены нужны, чтобы не плодить копипасту. Значения не менять.

### 1.3 Типографика

- **Sans:** Inter, веса **300 и 400 только**. Заголовки `font-normal` (400), НЕ жирные. Тело `font-light` (300). Никаких `font-bold`/`font-semibold`.
- **Mono:** JetBrains Mono 400. Используется для: навигации, кикеров, лейблов, кнопок-действий, бейджей статуса, текста в «терминальных» блоках (промпты, команды, таймкоды, KPI-числа).
- Шкала (из эталона):

| Роль | Классы |
|---|---|
| H1 (hero) | `font-sans text-4xl md:text-5xl lg:text-6xl leading-[1.05] tracking-tight text-zinc-900 font-normal` |
| Подзаголовок | `text-base md:text-lg text-zinc-600 font-light leading-relaxed` |
| Тело/список | `text-sm md:text-base font-light text-zinc-700` (неактивные пункты `text-zinc-500`) |
| Логотип-текст | `font-normal text-base tracking-tight text-zinc-900` |
| Кикер | `font-mono text-xs tracking-widest text-[#d95321] uppercase` + линия `w-6 h-px bg-[#d95321]` слева |
| Моно-нав | `text-xs font-mono text-zinc-500 hover:text-zinc-900` |
| Микро-лейбл | `text-[10px] font-mono uppercase tracking-widest text-zinc-400` (или `text-zinc-500`) |
| Терминальный текст | `text-sm font-mono text-zinc-800 leading-[28px]` |
| Кнопка-действие | `text-[11px] font-mono tracking-wide text-zinc-700` |
| Координаты рамки | `font-mono text-[9px] text-zinc-400 tracking-widest uppercase` |

Для H2/H3 внутренних страниц (в эталоне нет): та же схема, что H1, размеры `text-2xl md:text-3xl` (H2), `text-lg md:text-xl` (H3), `leading-[1.1]`, `tracking-tight`, `font-normal`.

### 1.4 Геометрия

- **Никаких скруглений** у контента: кнопки, панели, инпуты, бейджи, аватары, карточки строго прямоугольные (`rounded-none`, у индикатора-пульса явно `rounded-none`). Скругления есть только у мастер-контейнера и внутренней рамки (см. 2.1).
- **Границы:** `border border-[#e0dcd0]`. Акцентная граница при hover: `border-[#d95321]/30`.
- **Тени:** только `shadow-sm` на кнопках/плашках, `shadow-[0_8px_30px_rgba(0,0,0,0.03)]` на панелях, `shadow-2xl` на мастер-контейнере. Ничего больше.
- **Разделители:** `border-b border-[#e0dcd0]/70`, внутри секций `border-t border-[#e0dcd0]/60`.

## 2. Каркас страницы (обязателен для ВСЕХ экранов)

### 2.1 Framed Master Container

Каждая страница студента и админки живёт внутри рамы:

```html
<body class="bg-[#111110] font-sans antialiased text-zinc-800
             selection:bg-[#d95321]/20 selection:text-[#d95321]
             flex flex-col p-2 sm:p-4 md:p-6 lg:p-8 min-h-screen">

  <div class="flex-1 w-full max-w-[1440px] mx-auto bg-[#f6f5ef]
              rounded-2xl md:rounded-[2rem] shadow-2xl flex flex-col relative overflow-hidden
              ring-1 ring-white/10"
       style="background-image: repeating-linear-gradient(-45deg, transparent, transparent 3px,
              rgba(0,0,0,0.015) 3px, rgba(0,0,0,0.015) 4px);">
    <!-- Technical Inner Framing (см. 2.2) -->
    <!-- nav -->
    <!-- main -->
    <!-- Tick border (см. 2.4) -->
  </div>
</body>
```

Реализовать как компонент `<AppFrame>` (`src/components/frame`). Штриховка `repeating-linear-gradient(-45deg…)` обязательна на фоне мастер-контейнера.

### 2.2 Техническая внутренняя рамка и уголки

```html
<div class="absolute inset-2 sm:inset-4 border border-[#e0dcd0] pointer-events-none z-40
            rounded-xl md:rounded-[1.5rem]">
  <div class="absolute -top-[1px] -left-[1px] w-4 h-4 border-t border-l border-zinc-400 rounded-tl-xl md:rounded-tl-[1.5rem]"></div>
  <div class="absolute -top-[1px] -right-[1px] w-4 h-4 border-t border-r border-zinc-400 rounded-tr-xl md:rounded-tr-[1.5rem]"></div>
  <div class="absolute -bottom-[1px] -left-[1px] w-4 h-4 border-b border-l border-zinc-400 rounded-bl-xl md:rounded-bl-[1.5rem]"></div>
  <div class="absolute -bottom-[1px] -right-[1px] w-4 h-4 border-b border-r border-zinc-400 rounded-br-xl md:rounded-br-[1.5rem]"></div>
  <div class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[50%] bg-[#f6f5ef] px-2 font-mono text-[9px] text-zinc-400 tracking-widest uppercase">sys_frame_01</div>
  <div class="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[50%] bg-[#f6f5ef] px-2 font-mono text-[9px] text-zinc-400 tracking-widest uppercase">end_frame</div>
</div>
```

Компонент `<CornerBrackets>` с пропсами `topLabel` / `bottomLabel`. Метки на экранах: вместо `sys_frame_01` подставлять имя раздела в том же стиле (`sys_route_01`, `sys_skills_01`, `sys_admin_01` …), нижняя всегда `end_frame`.

### 2.3 Навигация (desktop)

Точно как в эталоне:

```html
<nav class="flex items-center justify-between px-6 py-5 md:px-10 md:py-6 w-full z-50 relative border-b border-[#e0dcd0]/70">
  <div class="flex items-center gap-8">
    <div class="flex items-center gap-3 cursor-pointer group">
      <div class="w-6 h-6 border border-zinc-300 flex items-center justify-center bg-white group-hover:border-[#d95321] transition-colors">
        <div class="w-2 h-2 bg-zinc-800 group-hover:bg-[#d95321] transition-colors"></div>
      </div>
      <span class="font-normal text-base tracking-tight text-zinc-900">{BRAND}</span>
    </div>
    <div class="hidden md:flex items-center gap-8 text-xs font-mono text-zinc-500">
      <!-- ссылки: Главная · Маршрут · Скиллы · Юзкейсы · Профиль -->
      <a class="hover:text-zinc-900 transition-colors">…</a>
    </div>
  </div>
  <div class="flex items-center gap-5">
    <a class="hidden sm:block text-xs font-mono text-zinc-500 hover:text-zinc-900 transition-colors">…</a>
    <button class="text-xs font-mono px-4 py-2 bg-transparent border border-[#e0dcd0] text-zinc-700
                   hover:bg-[#eae7df] hover:border-zinc-300 transition-all shadow-sm flex items-center gap-2">
      … <iconify-icon icon="solar:arrow-right-linear" stroke-width="1.5"></iconify-icon>
    </button>
  </div>
</nav>
```

Активный пункт: `text-zinc-900` + подчёркивание `border-b border-[#d95321]` (единственное добавление, использует токены эталона).

Разделы верхнего меню: **Главная · Маршрут · Скиллы · Юзкейсы · Уроки · Эфиры · Лидерборд · Профиль**. Если не помещается, «Уроки/Эфиры/Лидерборд» уходят в выпадающий пункт «Ещё» (`solar:alt-arrow-down-linear`, как «Architecture» в эталоне).

### 2.4 Нижняя мерная лента

Обязательна внизу мастер-контейнера на каждом экране:

```html
<div class="h-8 w-full border-t border-[#e0dcd0] opacity-50 pointer-events-none relative z-10 bg-[#f6f5ef]"
     style="background-image: repeating-linear-gradient(to right, #e0dcd0, #e0dcd0 1px, transparent 1px, transparent 100px),
                              repeating-linear-gradient(to right, #e0dcd0, #e0dcd0 1px, transparent 1px, transparent 10px);
            background-size: 100% 100%, 100% 20%; background-repeat: no-repeat; background-position: bottom;"></div>
```

### 2.5 Crosshair-акценты

`+` в углах секций: `<div class="absolute top-12 right-12 text-zinc-300 font-mono text-xs">+</div>`. Ставить 1–2 на крупных секциях (hero, пустые состояния, страницы оплаты). Не на каждой карточке.

## 3. Компоненты (спецификации на базе эталона)

### 3.1 Кнопки

| Вариант | Классы (точно как в эталоне) |
|---|---|
| **Primary** | `bg-[#1a1a19] text-[#f6f5ef] px-6 py-3 border border-[#1a1a19] text-sm font-normal hover:bg-black transition-colors shadow-sm flex items-center justify-center gap-2` + иконка слева (`solar:power-linear` в эталоне) |
| **Secondary** | `bg-[#fbfaf6] text-zinc-700 border border-[#e0dcd0] px-6 py-3 text-sm font-normal shadow-sm hover:bg-white hover:text-zinc-900 transition-colors flex items-center justify-center gap-2` |
| **Ghost (nav)** | `text-xs font-mono px-4 py-2 bg-transparent border border-[#e0dcd0] text-zinc-700 hover:bg-[#eae7df] hover:border-zinc-300 transition-all shadow-sm flex items-center gap-2` |
| **Action (mono)** | `flex items-center gap-2 bg-white border border-[#e0dcd0] px-4 py-2 text-[11px] font-mono tracking-wide text-zinc-700 hover:text-[#d95321] hover:border-[#d95321]/30 transition-colors shadow-sm group` + иконка `text-[#d95321] text-sm group-hover:scale-110 transition-transform` |
| **Icon** | `w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-zinc-700 transition-colors` |

Mobile: Primary/Secondary `w-full sm:w-auto`. Кнопка «Отправить агенту» = **Action (mono)** с иконкой `solar:play-circle-linear`; «Скопировать» = Action с `solar:copy-linear`.
Disabled: `opacity-50 cursor-not-allowed`, без hover-эффектов.

### 3.2 Панель («Chat Interface Mockup» из эталона = базовая карточка)

```html
<div class="w-full bg-[#fbfaf6] border border-[#e0dcd0] shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col relative ring-1 ring-white/50">
  <!-- Hardware Brackets: 4 уголка w-2 h-2 border-2 border-zinc-300 -->
  <div class="absolute -top-px -left-px w-2 h-2 border-t-2 border-l-2 border-zinc-300"></div>
  <div class="absolute -top-px -right-px w-2 h-2 border-t-2 border-r-2 border-zinc-300"></div>
  <div class="absolute -bottom-px -left-px w-2 h-2 border-b-2 border-l-2 border-zinc-300"></div>
  <div class="absolute -bottom-px -right-px w-2 h-2 border-b-2 border-r-2 border-zinc-300"></div>

  <!-- Header -->
  <div class="bg-[#f6f5ef] px-4 py-3 flex items-center justify-between border-b border-[#e0dcd0]">
    <span class="font-mono text-[10px] uppercase tracking-widest text-zinc-500">Заголовок // Статус</span>
    <!-- StatusPill -->
  </div>
  <!-- Body -->
  <!-- Footer: p-3 bg-[#f6f5ef] border-t border-[#e0dcd0] flex items-center justify-between -->
</div>
```

Компонент `<Panel title status footer>`. Все карточки контента (скилл, юзкейс, урок, тариф, строка лидерборда-блок, виджет прогресса) строятся на нём.

### 3.3 StatusPill

```html
<div class="flex items-center gap-2 bg-white px-2.5 py-1 border border-[#e0dcd0] text-[10px] font-mono text-zinc-500 shadow-sm">
  <span class="w-1.5 h-1.5 bg-[#d95321] rounded-none animate-pulse"></span>
  Текст статуса
  <div class="flex items-center gap-1 ml-2 border-l border-[#e0dcd0] pl-2"><!-- иконки --></div>
</div>
```

Без `animate-pulse` и с `bg-zinc-300` для неактивного статуса. Использовать для: тариф, статус оплаты, «сдал/внедрил», «Live».

### 3.4 «Линованная бумага» (для терминальных блоков)

Блоки промпта, команд, транскрипта, заметок куратора и пустых состояний:

```html
<div class="p-6 md:p-8 relative overflow-hidden"
     style="background-image: linear-gradient(transparent 27px, #e0dcd0 28px); background-size: 100% 28px;">
  <span class="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block mb-1">Prompt</span>
  <p class="text-zinc-800 text-sm font-mono leading-[28px]">…</p>
</div>
```

Высота строки текста строго `leading-[28px]`, чтобы текст ложился на линии. Это компонент `<LinedBlock label>`.

### 3.5 Kicker + заголовок секции

```html
<div class="mb-6 font-mono text-xs tracking-widest text-[#d95321] uppercase flex items-center gap-3">
  <span class="w-6 h-px bg-[#d95321]"></span> Название раздела
</div>
<h1 class="… js-masked-reveal">Заголовок страницы</h1>
```

Каждый экран начинается с Kicker + H1 (масочная анимация, см. раздел 5).

### 3.6 Список с иконками (features list)

`ul.space-y-4 text-zinc-700`, `li.flex.items-start.gap-4.text-sm.md:text-base.font-light`, иконка `text-lg mt-0.5`: **активная** `text-[#d95321]`, **неактивная** `text-zinc-400` (текст `text-zinc-500`). Так же выглядит чек-лист Маршрута: выполненный шаг активный (акцент), невыполненный неактивный.

### 3.7 Аватары/социальное доказательство

`h-7 w-7 ring-2 ring-[#f6f5ef] object-cover grayscale sepia-[.2] opacity-90 border border-zinc-300`, стопка `flex -space-x-2`. Аватары студентов на Главной/в лидерборде: те же фильтры (`filter grayscale sepia-[.2]`). Рейтинг: `text-[#d95321] text-[10px]` + `solar:star-linear`.

### 3.8 Формы (расширение по токенам эталона)

- Input/Textarea/Select: `w-full bg-white border border-[#e0dcd0] px-4 py-3 text-sm font-light text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-[#d95321]/50 focus:ring-0`, шрифт `font-mono` для технических полей (промпт, команда, id видео).
- Label: микро-лейбл `text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-1 block`.
- Ошибка поля: `text-[11px] font-mono text-[#d95321] mt-1`, граница `border-[#d95321]`.
- Checkbox/radio: квадратные, `w-4 h-4 border border-zinc-300 bg-white`, checked: заливка `bg-zinc-800` c inner-квадратом (как логотип), фокус `border-[#d95321]`.

### 3.9 Табы

Моно-табы: `font-mono text-xs px-4 py-2 border border-[#e0dcd0] -ml-px`, неактивный `bg-transparent text-zinc-500 hover:bg-[#eae7df]`, активный `bg-white text-zinc-900 border-b-[#d95321]`. Прямоугольные, без скруглений.

### 3.10 Таблицы (админка/лидерборд)

`w-full text-sm`, шапка `bg-[#f6f5ef] font-mono text-[10px] uppercase tracking-widest text-zinc-500 border-b border-[#e0dcd0]`, строки `border-b border-[#e0dcd0]/60 hover:bg-[#eae7df]/40`, ячейки `px-4 py-3 font-light`. Числа `font-mono`.

### 3.11 Теги

`inline-flex font-mono text-[10px] uppercase tracking-widest px-2 py-1 border border-[#e0dcd0] bg-white text-zinc-500`. Активный фильтр: `border-[#d95321]/30 text-[#d95321]`.

### 3.12 Замок (закрытый контент)

Карточка `Panel` с содержимым под `opacity-60`, поверх иконка `solar:lock-linear` (`text-zinc-400 text-lg`) и Action-кнопка «Открыть на тарифе {X}». Без размытия и градиентов.

### 3.13 Прогресс-бар

Высота `h-1.5`, фон `bg-[#e0dcd0]`, заполнение `bg-[#d95321]`, без скруглений. Сегментированный вариант: ряд квадратов `w-2 h-2 border border-zinc-300`, заполненные `bg-zinc-800` (стиль логотипа).

### 3.14 Уведомления (toast)

Мини-панель по 3.2 без brackets: `bg-[#fbfaf6] border border-[#e0dcd0] shadow-sm`, слева StatusPill-индикатор, текст `font-mono text-xs`. Позиция: справа снизу.

### 3.15 Модальное окно

Оверлей `bg-[#111110]/60`, окно = Panel с уголками, `max-w-lg`. Закрытие крестиком `solar:close-circle-linear` в шапке.

## 4. Иконки

Библиотека **Iconify, набор Solar, стиль Linear** (`solar:*-linear`), `stroke-width="1.5"`. Использованные в эталоне: `alt-arrow-down`, `arrow-right`, `server-square`, `pen-new-square`, `graph-up`, `power`, `star`, `programming`, `database`, `paperclip`, `play-circle`.

Соответствия для нужд платформы (все `-linear`): маршрут `route`, скиллы `bolt`/`programming`, юзкейсы `chart-2`, уроки `videocamera-record`, эфиры `microphone-3`, лидерборд `cup-first`, профиль `user`, оплата `card`, замок `lock`, копировать `copy`, скачать `download-minimalistic`, отметка `check-circle`, файл `document-text`, telegram `plain`, настройки `settings`, поиск `magnifer`, время `clock-circle`.

Подключение: пакет `iconify-icon` (web-component, как в эталоне). Для CSP и приватности **офлайн-набор**: `@iconify-json/solar` + `addCollection`, без запросов на `api.iconify.design`/CDN.

## 5. Анимации и мотион

- **Masked word reveal** для H1 (и H2 крупных секций) переносится из эталона без изменений: слова оборачиваются в `inline-block overflow-hidden align-bottom pb-1 -mb-1`, внутренний `.word` стартует с `translate-y-[120%]`; GSAP: `y: 0, duration: 0.8, ease: 'power4.out', stagger: 0.04, scrollTrigger: { trigger: heading, start: 'top 90%' }`. Оформить хуком `useMaskedReveal(ref)`, уважать `prefers-reduced-motion` (без анимации, сразу видимый текст).
- Hover-переходы: `transition-colors` / `transition-all` (стандартная длительность Tailwind), иконка `group-hover:scale-110`.
- Индикатор `animate-pulse` только на StatusPill.
- Никаких других анимаций (без параллакса, без появления карточек каскадом, без спиннеров-кругов). Загрузка: моно-текст `Загрузка…` + пульсирующий квадрат.

## 6. Состояния, которых нет в эталоне (собираем из токенов)

| Состояние | Решение |
|---|---|
| Ошибка | Акцент `#d95321` для текста/границы + иконка `solar:danger-triangle-linear` |
| Успех | `text-zinc-900` + `solar:check-circle-linear` в `text-[#d95321]`, без зелёного |
| Предупреждение | Тот же акцент, микро-лейбл `WARN //` |
| Пустое состояние | `LinedBlock` с моно-текстом, crosshair `+` в углах |
| Disabled | `opacity-50` |
| Skeleton | Блоки `bg-[#e0dcd0]/50 animate-pulse rounded-none` |

Новых цветов (зелёный, синий, золотой) не вводим.

## 7. Изображения и фон

- Фото/аватары: `grayscale sepia-[.2] opacity-90`.
- Декоративная фоновая картинка в визуальных колонках: `opacity-[0.06] grayscale sepia-[0.3] contrast-150 mix-blend-multiply` поверх `bg-[#efede6]/40`.
- Технической сетки-оверлей: `opacity-[0.03]`, `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`, `background-size: 40px 40px`. Использовать на hero-блоках (Главная, Маршрут, страница оплаты).
- Все внешние Unsplash-картинки из эталона заменить на локальные ассеты в `/public`, визуальная обработка та же.

## 8. Сетка и отступы

- Контейнер `max-w-[1440px]`, внутри страницы: `p-8 md:p-14 lg:p-20` для hero-блоков, `px-6 md:px-10 py-8 md:py-12` для рабочих экранов.
- Двухколоночный layout: `grid grid-cols-1 lg:grid-cols-2`, правая колонка отделена `border-t lg:border-t-0 lg:border-l border-[#e0dcd0]/70`.
- Внутренняя рамка занимает `inset-2 sm:inset-4`: не размещай интерактивные элементы вплотную к краю (минимум 24 px отступа).
- Брейкпоинты Tailwind по умолчанию: `sm 640`, `md 768`, `lg 1024`. Проверка: 375, 768, 1024, 1440.

## 9. Мобильная навигация

Нижняя навигация (5 табов: Главная · Маршрут · Скиллы · Юзкейсы · Профиль) на `<md`. Стиль: фикс. панель внутри рамы `h-14 bg-[#f6f5ef] border-t border-[#e0dcd0]`, 5 равных ячеек, иконка `solar:*-linear` + подпись `font-mono text-[9px] uppercase tracking-widest`. Активная: иконка и подпись `text-[#d95321]`, остальные `text-zinc-400`. Над панелью остаётся мерная лента (2.4), нижний отступ контента `pb-20`. Уроки и Эфиры доступны из Главной и внутри разделов (по ТЗ).

## 10. Чек-лист соответствия эталону (проверять на каждом экране)

- [ ] Тёмная подложка `#111110` + рама `#f6f5ef` со штриховкой и `shadow-2xl`
- [ ] Внутренняя рамка с 4 уголками и лейблами `sys_*` / `end_frame`
- [ ] Nav как в эталоне (логотип-квадрат, моно-ссылки, ghost-кнопка)
- [ ] Kicker с линией + H1 `font-normal` с masked reveal
- [ ] Только Inter 300/400 и JetBrains Mono 400
- [ ] Нет скруглений у контента, нет цветов кроме токенов
- [ ] Панели с hardware-brackets, моно-шапка `Label // Status`
- [ ] Терминальный текст на «линованной бумаге» (`leading-[28px]`)
- [ ] Иконки Solar Linear, акцентные `#d95321`, неактивные `zinc-400`
- [ ] Мерная лента внизу
- [ ] Проверено на 375 / 768 / 1024 / 1440
