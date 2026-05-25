import fs from 'node:fs'
import path from 'node:path'
import { rootPath } from '../../constants'

const DB_PATH = path.join(rootPath, 'jump.json')
const MAX_TOTAL_WEIGHT = 10_000
const DECAY_FACTOR = 0.9

export interface Entry {
  weight: number
  lastVisited: number
}

export interface Database {
  entries: Record<string, Entry>
}

function load(): Database {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf-8')
      return JSON.parse(raw)
    }
  }
  catch {
    // Corrupted db, start fresh
  }
  return { entries: {} }
}

function save(db: Database): void {
  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir))
    fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8')
}

export function add(dirPath: string): void {
  const db = load()
  const normalized = path.resolve(dirPath)

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

export function decay(_force = false): void {
  const db = load()
  for (const key of Object.keys(db.entries))
    db.entries[key].weight = Math.max(1, Math.floor(db.entries[key].weight * DECAY_FACTOR))
  save(db)
}
