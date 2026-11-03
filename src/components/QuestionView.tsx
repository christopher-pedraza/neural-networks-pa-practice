import type { Question } from '../types'
import { FillBlank } from './FillBlank'
import { FindFix } from './FindFix'
import { Hints } from './Hints'

interface Props {
  q: Question
  onGraded: (correct: boolean) => void
  onNext: () => void
  onOpenReference: (name: string) => void
  /** Show the per-blank placeholder text (a hint). Defaults to true. */
  showPlaceholders?: boolean
}

const TYPE_LABEL = { fill_blank: 'Fill in the blanks', find_fix: 'Identify & correct' } as const

export function QuestionView({ q, onGraded, onNext, onOpenReference, showPlaceholders = true }: Props) {
  return (
    <article className="question">
      <header className="q-header">
        <div className="chips">
          <span className="chip category">{q.category}</span>
          <span className="chip">{TYPE_LABEL[q.type]}</span>
          {q.difficulty && <span className={`chip diff-${q.difficulty}`}>{q.difficulty}</span>}
          {q.source?.lines && <span className="chip muted">lines {q.source.lines}</span>}
        </div>
        <h2>{q.title}</h2>
      </header>

      <section className="description">
        <h3>What this code does</h3>
        <p>{q.description}</p>
      </section>

      {q.related_reference && q.related_reference.length > 0 && (
        <div className="related">
          Related:
          {q.related_reference.map((name) => (
            <button key={name} type="button" className="chip link" onClick={() => onOpenReference(name)}>
              {name}
            </button>
          ))}
        </div>
      )}

      <Hints hints={q.hints} />

      {q.type === 'fill_blank' ? (
        <FillBlank q={q} onGraded={onGraded} onNext={onNext} showPlaceholders={showPlaceholders} />
      ) : (
        <FindFix q={q} onGraded={onGraded} onNext={onNext} />
      )}
    </article>
  )
}
