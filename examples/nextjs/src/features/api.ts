import { Ctx } from '@reatom/framework'

export async function fetchIssuesApi(
  query: string,
  { signal }: { signal: AbortSignal },
) {
  const response = await fetch(
    `https://api.github.com/search/issues?q=${query}&page=${1}&per_page=10`,
    { signal },
  )

  if (!response.ok) throw new Error(await response.text())

  const data: { items: Array<Record<string, string>> } = await response.json()

  return data.items.map(({ title, html_url, id }) => ({
    title,
    url: html_url,
    id,
  }))
}

export const isRateLimitError = (thing: unknown) =>
  thing instanceof Error && thing.message.includes('rate limit')
export const getErrorMessage = (ctx: Ctx, thing: unknown) =>
  isRateLimitError(thing)
    ? undefined
    : thing instanceof Error
    ? thing.message
    : String(thing)
