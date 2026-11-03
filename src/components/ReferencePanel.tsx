import { useEffect, useMemo, useRef, useState } from 'react'
import type { RefEntry } from '../types'

interface Props {
  entries: RefEntry[]
  /** Change `nonce` to make the panel jump to `name` (used by question chips). */
  request: { name: string; nonce: number } | null
  onClose: () => void
}

function score(e: RefEntry, tokens: string[]): number {
  const name = e.name.toLowerCase()
  const aliases = (e.aliases ?? []).map((a) => a.toLowerCase())
  const rest = [e.summary, e.module ?? '', e.kind, ...(e.tags ?? [])].join(' ').toLowerCase()
  let total = 0
  for (const t of tokens) {
    if (name === t || aliases.includes(t)) total += 100
    else if (name.endsWith('.' + t)) total += 60
    else if (name.includes(t)) total += 40
    else if (aliases.some((a) => a.includes(t))) total += 30
    else if (rest.includes(t)) total += 10
    else return 0 // every token must match something
  }
  return total
}

export function ReferencePanel({ entries, request, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (request) {
      setQuery('')
      setSelected(request.name)
    }
  }, [request])

  useEffect(() => {
    if (!request) searchRef.current?.focus()
  }, [request])

  const results = useMemo(() => {
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean)
    if (tokens.length === 0) return [...entries].sort((a, b) => a.name.localeCompare(b.name))
    return entries
      .map((e) => ({ e, s: score(e, tokens) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s || a.e.name.localeCompare(b.e.name))
      .map((x) => x.e)
  }, [entries, query])

  const byName = useMemo(() => {
    const m = new Map<string, RefEntry>()
    for (const e of entries) {
      m.set(e.name, e)
      for (const a of e.aliases ?? []) if (!m.has(a)) m.set(a, e)
    }
    return m
  }, [entries])

  const detail = selected ? byName.get(selected) : undefined

  return (
    <aside className="ref-panel" aria-label="PyTorch reference">
      <div className="ref-head">
        <h2>PyTorch reference</h2>
        <button type="button" className="btn" onClick={onClose} aria-label="Close reference">
          ✕
        </button>
      </div>
      <input
        ref={searchRef}
        className="search"
        type="search"
        placeholder="Search functions, classes, tags…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <ul className="ref-list">
        {results.length === 0 && <li className="muted pad">No matches.</li>}
        {results.map((e) => (
          <li key={e.name}>
            <button
              type="button"
              className={`ref-item ${detail?.name === e.name ? 'active' : ''}`}
              onClick={() => setSelected(e.name)}
            >
              <span className="ref-name">{e.name}</span>
              <span className="chip small">{e.kind}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="ref-detail">
        {!detail && <p className="muted">Select an entry to see its details.</p>}
        {detail && (
          <>
            <h3>{detail.name}</h3>
            {detail.signature && <pre className="sig">{detail.signature}</pre>}
            <p>{detail.summary}</p>
            {detail.parameters && detail.parameters.length > 0 && (
              <>
                <h4>Parameters</h4>
                <dl>
                  {detail.parameters.map((p) => (
                    <div key={p.name} className="param">
                      <dt>
                        <code>{p.name}</code>
                        {p.type && <span className="muted"> {p.type}</span>}
                        {p.default !== undefined && <span className="muted"> = {p.default}</span>}
                      </dt>
                      <dd>{p.description}</dd>
                    </div>
                  ))}
                </dl>
              </>
            )}
            {detail.returns && (
              <>
                <h4>Returns</h4>
                <p>{detail.returns}</p>
              </>
            )}
            {detail.example && (
              <>
                <h4>Example</h4>
                <pre className="sig">{detail.example}</pre>
              </>
            )}
            {detail.notes && detail.notes.length > 0 && (
              <>
                <h4>Notes</h4>
                <ul>
                  {detail.notes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              </>
            )}
            {detail.see_also && detail.see_also.length > 0 && (
              <div className="related">
                See also:
                {detail.see_also.map((n) =>
                  byName.has(n) ? (
                    <button key={n} type="button" className="chip link" onClick={() => setSelected(n)}>
                      {n}
                    </button>
                  ) : (
                    <span key={n} className="chip">
                      {n}
                    </span>
                  ),
                )}
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  )
}
