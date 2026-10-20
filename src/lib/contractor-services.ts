export const CONTRACTOR_SERVICES = [
  { value: 'strategy', label: 'Стратегия' },
  { value: 'consulting', label: 'Консалтинг' },
  { value: 'branding', label: 'Брендинг' },
  { value: 'content', label: 'Контент' },
  { value: 'smm', label: 'SMM' },
  { value: 'video', label: 'Видеокреативы' },
  { value: 'creative', label: 'Креативы' },
  { value: 'paid-traffic', label: 'Платный трафик' },
  { value: 'seo', label: 'SEO' },
  { value: 'organic', label: 'Органическое продвижение' },
  { value: 'web-development', label: 'Разработка сайтов' },
  { value: 'crm-integrations', label: 'CRM и интеграции' },
  { value: 'agents-automation', label: 'AI-агенты и автоматизация' },
] as const;

export type ContractorServiceValue = (typeof CONTRACTOR_SERVICES)[number]['value'];

export function contractorServiceLabel(value: string): string {
  return CONTRACTOR_SERVICES.find((service) => service.value === value)?.label ?? value;
}
