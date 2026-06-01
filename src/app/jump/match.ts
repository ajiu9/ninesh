import type { Database } from './database'

export interface MatchResult {
  path: string
  score: number
  weight: number
}

/**
 * Check if all characters of `pattern` appear in `str` in order (subsequence match).
 */
function isSubsequence(pattern: string, str: string): boolean {
  let pi = 0
  for (let si = 0; si < str.length && pi < pattern.length; si++) {
    if (str[si] === pattern[pi])
      pi++
  }
  return pi === pattern.length
}

/**
 * Check if `pattern` matches any directory segment in the path.
 * Like z.sh/zoxide, matching is constrained to individual path components
 * to prevent false positives like "notes" matching "node_test".
 */
function matchesAnySegment(pattern: string, dirPath: string): boolean {
  const segments = dirPath.split('/').filter(Boolean)
  return segments.some(seg => isSubsequence(pattern, seg))
}

/**
 * Calculate match quality bonus for a given path against the query.
 * Returns a value in [0, 1] — higher is better.
 */
function matchQuality(query: string, dirPath: string): number {
  const lowerPath = dirPath.toLowerCase()
  const segments = lowerPath.split('/').filter(Boolean)

  if (segments.length === 0)
    return 0

  let quality = 0

  // Boost: exact match on the last directory segment
  const lastSegment = segments[segments.length - 1]
  if (lastSegment === query)
    quality += 0.4
  else if (lastSegment.startsWith(query))
    quality += 0.3
  else if (lastSegment.includes(query))
    quality += 0.15

  // Boost: match on any full directory segment
  for (const seg of segments) {
    if (seg === query) {
      quality += 0.3
      break
    }
  }

  // Boost: best consecutive character match within a single segment
  // (z.sh-style: penalize matches scattered across segments)
  let bestConsecutive = 0
  for (const seg of segments) {
    let count = 0
    let pi = 0
    for (let si = 0; si < seg.length && pi < query.length; si++) {
      if (seg[si] === query[pi]) {
        count++
        pi++
      }
      else {
        if (count > bestConsecutive)
          bestConsecutive = count
        count = 0
      }
    }
    if (count > bestConsecutive)
      bestConsecutive = count
  }
  quality += Math.min(bestConsecutive, query.length) * 0.04

  // Boost: deeper directory paths are usually more specific
  quality += Math.min(segments.length, 10) * 0.01

  return Math.min(quality, 1)
}

/**
 * Calculate CWD proximity bonus based on common prefix segments.
 * Paths under the same project tree as CWD get a significant boost.
 */
function proximityBonus(cwd: string, dirPath: string): number {
  const cwdSegs = cwd.toLowerCase().split('/').filter(Boolean)
  const pathSegs = dirPath.toLowerCase().split('/').filter(Boolean)

  let common = 0
  for (let i = 0; i < Math.min(cwdSegs.length, pathSegs.length); i++) {
    if (cwdSegs[i] === pathSegs[i])
      common++
    else
      break
  }

  if (common === 0)
    return 0

  return Math.min(0.5, Math.log2(common + 1) * 0.15)
}

/**
 * Search the database for directories matching the query.
 *
 * Matching algorithm (inspired by z.sh/zoxide):
 * 1. Filter: query must match at least one path segment (not the full path)
 * 2. Score: weight × recency × (1 + quality + proximityBonus)
 *
 * @param cwd - Current working directory for proximity boost
 */
export function search(query: string, db: Database, maxResults = 10, cwd?: string): MatchResult[] {
  const lowerQuery = query.toLowerCase()
  const results: MatchResult[] = []

  for (const [dirPath, entry] of Object.entries(db.entries)) {
    // Filter: query must match within a single directory segment
    // (prevents "notes" from matching "node_test" across segments)
    if (!matchesAnySegment(lowerQuery, dirPath.toLowerCase()))
      continue

    const quality = matchQuality(lowerQuery, dirPath.toLowerCase())
    const proxBonus = cwd ? proximityBonus(cwd, dirPath.toLowerCase()) : 0

    // Recency decay: directories visited recently score higher (z.sh-style)
    const ageDays = (Date.now() - entry.lastVisited) / (1000 * 60 * 60 * 24)
    const recency = 1 / (1 + ageDays * 0.05)

    const score = entry.weight * recency * (1 + quality + proxBonus)

    results.push({
      path: dirPath,
      score: Math.round(score * 100) / 100,
      weight: entry.weight,
    })
  }

  // Sort by score descending, then by weight descending
  results.sort((a, b) => b.score - a.score || b.weight - a.weight)

  return results.slice(0, maxResults)
}
