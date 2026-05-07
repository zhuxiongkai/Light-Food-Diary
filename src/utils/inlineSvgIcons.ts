export const semanticInlineIconNames = [
  'meal-breakfast',
  'meal-lunch',
  'meal-dinner',
  'meal-snack',
  'macro-protein',
  'macro-carbs',
  'macro-fat',
] as const

export type InlineSvgIconName = (typeof semanticInlineIconNames)[number]

export const inlineSvgIcons: Record<InlineSvgIconName, string> = {
  'meal-breakfast':
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="M5 15h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M7 15a5 5 0 0 1 10 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M4.5 19.5h15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M12 2.8v2.1M5.8 5.4l1.5 1.5M18.2 5.4l-1.5 1.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  'meal-lunch':
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="M5 13.5h14l-1.1 3.2a4 4 0 0 1-3.8 2.8H9.9a4 4 0 0 1-3.8-2.8L5 13.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8 10c1.2-1 2.5-1 4 0s2.8 1 4 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M7 5h10M7 8h10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  'meal-dinner':
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="M16.8 4.2a6.8 6.8 0 1 0 3 9.8 5.2 5.2 0 0 1-6.8-6.8 6 6 0 0 1 3.8-3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M5.5 18.5h8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  'meal-snack':
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="M7 9h10l-1 11H8L7 9Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8 9c.3-2.9 1.7-5 4-5s3.7 2.1 4 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M10 13h4M10 16h3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  'macro-protein':
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="M6.5 14.2c-1.9-2-1.8-5.2.2-7.1s5.2-1.8 7.1.2l3.5 3.7c1.9 2 1.8 5.2-.2 7.1s-5.2 1.8-7.1-.2l-3.5-3.7Z" stroke="currentColor" stroke-width="1.8"/><path d="M9 8.5 15.5 15M7.8 12.1l3-2.9M12.8 17.2l3-2.9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  'macro-carbs':
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="M5.5 18.5c3.2-5.1 3.2-10.1 0-13.8 4.2 1 7.3 5.1 7.3 9.4 0 2.7-1.5 4.4-4 4.4H5.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 18.5c2.8-3.5 3.5-7.7 2.2-12.2 2.9 1.8 4.8 4.7 4.8 8.2 0 2.4-1.4 4-3.8 4H12Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  'macro-fat':
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="M12 3.5s6 6.4 6 10.8a6 6 0 0 1-12 0c0-4.4 6-10.8 6-10.8Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9.3 14.4a2.7 2.7 0 0 0 2.7 2.7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
}

export function getInlineSvgIcon(name: InlineSvgIconName): string {
  return inlineSvgIcons[name]
}
