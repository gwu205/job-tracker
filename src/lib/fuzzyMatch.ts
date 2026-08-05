export function normalizeForMatch(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

/** Levenshtein edit distance. */
function editDistance(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m

  const prev = new Array(n + 1)
  const curr = new Array(n + 1)
  for (let j = 0; j <= n; j++) prev[j] = j

  for (let i = 1; i <= m; i++) {
    curr[0] = i
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost)
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j]
  }
  return prev[n]
}

/** Similarity ratio in [0, 1], 1 meaning identical. */
export function similarity(a: string, b: string): number {
  const na = normalizeForMatch(a)
  const nb = normalizeForMatch(b)
  if (na === nb) return 1
  const maxLen = Math.max(na.length, nb.length)
  if (maxLen === 0) return 1
  return 1 - editDistance(na, nb) / maxLen
}

const FUZZY_THRESHOLD = 0.88

export function isFuzzyMatch(a: string, b: string): boolean {
  return similarity(a, b) >= FUZZY_THRESHOLD
}
