// Pure, dependency-free so it can be imported by both the app and
// scripts/validate-data.mjs (Node strips the types natively).

/**
 * Canonical form used to compare learner input to accepted answers.
 * Whitespace is only significant where it separates two word-ish tokens
 * (`not x`, `for i in`), so `x=a+b` equals `x = a + b`. Quote style is ignored.
 * Case is significant (Python).
 */
export function normalize(input: string): string {
  return collapse(input)
    .replace(/\s*([()[\]{},:;=+\-*/%<>!&|^~.@])\s*/g, '$1')
    .replace(/'/g, '"')
}

/** Trim + collapse whitespace runs (including newlines) to a single space. */
export function collapse(input: string): string {
  return input
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .join(' ')
    .replace(/\s+/g, ' ')
}

/** Does `input` match any accepted answer or accepted regex pattern? */
export function matchesAny(
  input: string,
  answers: readonly string[],
  patterns: readonly string[] = [],
): boolean {
  const n = normalize(input)
  if (answers.some((a) => normalize(a) === n)) return true
  if (patterns.length === 0) return false
  const c = collapse(input)
  return patterns.some((p) => {
    try {
      return new RegExp(`^(?:${p})$`).test(c)
    } catch {
      return false
    }
  })
}
