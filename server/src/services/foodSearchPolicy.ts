const KEYWORD_SEARCH_LIMIT = 100

export function resolveFoodSearchLimit(keyword?: string): number | undefined {
  return keyword?.trim() ? KEYWORD_SEARCH_LIMIT : undefined
}
