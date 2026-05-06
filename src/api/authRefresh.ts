const TOKEN_ISSUING_PATHS = new Set(['/auth/login', '/auth/register', '/auth/refresh'])

export function shouldRefreshAfterUnauthorized(path: string): boolean {
  const [pathname] = path.split('?')
  return !TOKEN_ISSUING_PATHS.has(pathname)
}
