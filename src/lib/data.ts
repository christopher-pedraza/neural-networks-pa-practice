import type { Manifest, Question, ReferenceFile } from '../types'

// import.meta.env.BASE_URL is './' (see vite.config.ts), so these resolve
// relative to the page and work under any GitHub Pages sub-path.
const DATA_ROOT = `${import.meta.env.BASE_URL}data/`

async function fetchText(path: string): Promise<string> {
  const res = await fetch(DATA_ROOT + path, { cache: 'no-cache' })
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status} ${res.statusText}`)
  return res.text()
}

export function parseQuestions(text: string, path: string): Question[] {
  if (path.endsWith('.jsonl')) {
    return text
      .split('\n')
      .map((l, i) => ({ l: l.trim(), n: i + 1 }))
      .filter(({ l }) => l.length > 0)
      .map(({ l, n }) => {
        try {
          return JSON.parse(l) as Question
        } catch (e) {
          throw new Error(`${path}:${n} is not valid JSON (${(e as Error).message})`)
        }
      })
  }
  const parsed: unknown = JSON.parse(text)
  if (!Array.isArray(parsed)) throw new Error(`${path} must contain a JSON array`)
  return parsed as Question[]
}

export interface LoadedData {
  questions: Question[]
  reference: ReferenceFile
}

export async function loadAll(): Promise<LoadedData> {
  const manifest = JSON.parse(await fetchText('manifest.json')) as Manifest
  const [questionLists, reference] = await Promise.all([
    Promise.all(
      manifest.questionFiles.map(async (f) => parseQuestions(await fetchText(f), f)),
    ),
    fetchText(manifest.reference).then((t) => JSON.parse(t) as ReferenceFile),
  ])
  return { questions: questionLists.flat(), reference }
}
