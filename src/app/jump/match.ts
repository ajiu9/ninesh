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

  // Boost: consecutive character match (higher density = better)
  let consecutiveBonus = 0
  let consecutiveCount = 0
  let pi = 0
  for (let si = 0; si < lowerPath.length && pi < query.length; si++) {
    if (lowerPath[si] === query[pi]) {
      consecutiveCount++
      pi++
    }
    else {
      if (consecutiveCount > 1)
        consecutiveBonus += consecutiveCount
      consecutiveCount = 0
    }
  }
  if (consecutiveCount > 1)
    consecutiveBonus += consecutiveCount
  quality += consecutiveBonus * 0.02

  // Boost: deeper directory paths are usually more specific
  quality += Math.min(segments.length, 10) * 0.01

  return Math.min(quality, 1)
}

/**
 * Calculate CWD proximity bonus based on common prefix segments.
 * Paths under the same project tree as CWD get a significant boost.
 * Returns a value in [0, 0.5].
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

  // No proximity bonus for unrelated paths
  if (common === 0)
    return 0

  // Bonus: log-scale to avoid penalizing deep hierarchies too much,
  // but still reward more shared segments.
  // 1 common → 0.05, 3 → 0.15, 5 → 0.22, 10 → 0.30
  return Math.min(0.5, Math.log2(common + 1) * 0.15)
}

/**
 * Search the database for directories matching the query.
 * Returns results sorted by score (highest first).
 *
 * @param cwd - Current working directory, used to boost results
 *              within the same project/prefix tree.
 */
export function search(query: string, db: Database, maxResults = 10, cwd?: string): MatchResult[] {
  const lowerQuery = query.toLowerCase()
  const results: MatchResult[] = []

  for (const [dirPath, entry] of Object.entries(db.entries)) {
    if (!isSubsequence(lowerQuery, dirPath.toLowerCase()))
      continue

    const quality = matchQuality(lowerQuery, dirPath.toLowerCase())
    const proxBonus = cwd ? proximityBonus(cwd, dirPath.toLowerCase()) : 0
    // Proximity bonus is additive to quality, so same-project entries
    // can overcome moderate weight disadvantages from other projects.
    const score = entry.weight * (1 + quality + proxBonus)

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
