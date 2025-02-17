export const toError = (thing: unknown) =>
  thing instanceof Error ? thing.message : String(thing ?? 'Unknown error')
