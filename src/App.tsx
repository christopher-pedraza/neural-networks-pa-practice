import { useCallback, useEffect, useMemo, useState } from 'react'
import { loadAll, type LoadedData } from './lib/data'
import { usePractice } from './hooks/usePractice'
import { CategoryFilter } from './components/CategoryFilter'
import { QuestionView } from './components/QuestionView'
import { ReferencePanel } from './components/ReferencePanel'

const STORAGE_KEY = 'pa-practice:categories'

function loadSavedCategories(available: string[]): Set<string> {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as string[] | null
    if (Array.isArray(saved)) {
      const valid = saved.filter((c) => available.includes(c))
      if (valid.length > 0 || saved.length === 0) return new Set(valid)
    }
  } catch {
    /* ignore corrupt storage */
  }
  return new Set(available)
}

export default function App() {
  const [data, setData] = useState<LoadedData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAll().then(setData, (e: Error) => setError(e.message))
  }, [])

  if (error) return <div className="status error">Could not load data: {error}</div>
  if (!data) return <div className="status">Loading…</div>
  return <Practice data={data} />
}

function Practice({ data }: { data: LoadedData }) {
  const counts = useMemo(() => {
    const m = new Map<string, number>()
    for (const q of data.questions) m.set(q.category, (m.get(q.category) ?? 0) + 1)
    return m
  }, [data.questions])

  const [selected, setSelected] = useState(() => loadSavedCategories([...counts.keys()]))
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...selected]))
  }, [selected])

  const pool = useMemo(
    () => data.questions.filter((q) => selected.has(q.category)),
    [data.questions, selected],
  )
  const { current, next, instanceKey } = usePractice(pool)

  const [stats, setStats] = useState({ attempted: 0, firstTry: 0 })
  const onGraded = useCallback(
    (correct: boolean) =>
      setStats((s) => ({ attempted: s.attempted + 1, firstTry: s.firstTry + (correct ? 1 : 0) })),
    [],
  )

  const [refOpen, setRefOpen] = useState(false)
  const [refRequest, setRefRequest] = useState<{ name: string; nonce: number } | null>(null)
  const openReference = useCallback((name: string) => {
    setRefOpen(true)
    setRefRequest((r) => ({ name, nonce: (r?.nonce ?? 0) + 1 }))
  }, [])

  return (
    <div className={`app ${refOpen ? 'with-ref' : ''}`}>
      <header className="topbar">
        <h1>Programming Assignments Practice</h1>
        <div className="topbar-right">
          <span className="stats" title="Questions answered correctly on the first check">
            First-try correct: <strong>{stats.firstTry}</strong> / {stats.attempted}
          </span>
          <button type="button" className={`btn ${refOpen ? 'primary' : ''}`} onClick={() => {
              if (!refOpen) setRefRequest(null)
              setRefOpen(!refOpen)
            }}
          >
            📖 PyTorch reference
          </button>
        </div>
      </header>

      <CategoryFilter counts={counts} selected={selected} onChange={setSelected} />

      <main className="main">
        {current ? (
          <QuestionView
            key={instanceKey}
            q={current}
            onGraded={onGraded}
            onNext={next}
            onOpenReference={openReference}
          />
        ) : (
          <div className="status">
            {counts.size === 0
              ? 'No questions found. Add files to public/data/questions and list them in manifest.json.'
              : 'Select at least one category to start practising.'}
          </div>
        )}
      </main>

      {refOpen && (
        <ReferencePanel
          entries={data.reference.entries}
          request={refRequest}
          onClose={() => setRefOpen(false)}
        />
      )}
    </div>
  )
}
