import fs from 'node:fs'
import path from 'node:path'
import { rootPath } from '../../constants'

const DB_PATH = path.join(rootPath, 'jump.json')
const DB_TMP_PATH = path.join(rootPath, 'jump.json.tmp')
const MAX_TOTAL_WEIGHT = 10_000
const DECAY_FACTOR = 0.9

/**
 * Patterns for paths that should be excluded from jump database.
 * These are typically toolchain binary directories, not user work directories.
 */
const EXCLUDED_PATTERNS = [
  // Version managers
  /[/\\]\.nvm[/\\]/, // Node Version Manager
  /[/\\]\.pyenv[/\\]/, // Python Version Manager
  /[/\\]\.rbenv[/\\]/, // Ruby Version Manager
  /[/\\]\.sdkman[/\\]/, // SDK Manager
  /[/\\]\.cargo[/\\]bin[/\\]/, // Rust Cargo bin
  /[/\\]\.goenv[/\\]/, // Go Version Manager
  /[/\\]\.jenv[/\\]/, // Java Version Manager

  // Binary directories (usually not user's working directories)
  /[/\\]bin[/\\]$/, // Any path ending with /bin/
  /[/\\]sbin[/\\]$/, // System binary directories

  // System paths
  /^[/\\]usr[/\\]local[/\\]bin$/,
  /^[/\\]usr[/\\]bin$/,
  /^[/\\]bin$/,
  /^[/\\]sbin$/,

  // User-local binary directories
  /[/\\]\.local[/\\]bin$/, // ~/.local/bin
]

/**
 * Check if a path should be excluded from the jump database.
 */
function shouldExclude(dirPath: string): boolean {
  return EXCLUDED_PATTERNS.some(pattern => pattern.test(dirPath))
}

export interface Entry {
  weight: number
  lastVisited: number
}

export interface Database {
  entries: Record<string, Entry>
}

function validate(db: unknown): db is Database {
  if (!db || typeof db !== 'object')
    return false
  const d = db as Record<string, unknown>
  if (!d.entries || typeof d.entries !== 'object')
    return false
  // Validate each entry has weight (number) and lastVisited (number)
  for (const [key, value] of Object.entries(d.entries)) {
    if (typeof key !== 'string')
      return false
    if (!value || typeof value !== 'object')
      return false
    const entry = value as Record<string, unknown>
    if (typeof entry.weight !== 'number' || typeof entry.lastVisited !== 'number')
      return false
  }
  return true
}

function load(): Database {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf-8')
      const parsed = JSON.parse(raw)
      if (validate(parsed))
        return parsed
    }
  }
  catch {
    // Corrupted db, start fresh
  }
  return { entries: {} }
}

/**
 * Atomic write: write to temp file then rename.
 * Prevents corruption from concurrent writes.
 */
function save(db: Database): void {
  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir))
    fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(DB_TMP_PATH, JSON.stringify(db, null, 2), 'utf-8')
  fs.renameSync(DB_TMP_PATH, DB_PATH)
}

export function add(dirPath: string): void {
  const normalized = path.resolve(dirPath)

  // Skip paths that are not useful for directory jumping
  if (shouldExclude(normalized))
    return

  const db = load()

  if (!db.entries[normalized])
    db.entries[normalized] = { weight: 1, lastVisited: Date.now() }
  else
    db.entries[normalized].weight += 1

  db.entries[normalized].lastVisited = Date.now()

  // Decay if total weight exceeds threshold
  const total = Object.values(db.entries).reduce((sum, e) => sum + e.weight, 0)
  if (total > MAX_TOTAL_WEIGHT) {
    for (const key of Object.keys(db.entries))
      db.entries[key].weight = Math.max(1, Math.floor(db.entries[key].weight * DECAY_FACTOR))
  }

  save(db)
}

export function query(): Database {
  return load()
}

export function purge(): number {
  const db = load()
  let removed = 0

  for (const dirPath of Object.keys(db.entries)) {
    if (!fs.existsSync(dirPath)) {
      delete db.entries[dirPath]
      removed++
    }
  }

  if (removed > 0)
    save(db)

  return removed
}

export function decay(): void {
  const db = load()
  for (const key of Object.keys(db.entries))
    db.entries[key].weight = Math.max(1, Math.floor(db.entries[key].weight * DECAY_FACTOR))
  save(db)
}
