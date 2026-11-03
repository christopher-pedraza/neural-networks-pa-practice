import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Question } from '../types'

function shuffle<T>(items: readonly T[]): T[] {
  const a = items.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Infinite practice queue over `pool`: shuffled pass through every question,
 * then reshuffle and repeat. Rebuilds whenever the set of questions changes
 * (i.e. the category filter changed).
 */
export function usePractice(pool: Question[]) {
  const poolKey = pool.map((q) => q.id).join('|')
  const [round, setRound] = useState(0)
  const [pos, setPos] = useState(0)

  const order = useMemo(() => shuffle(pool), [poolKey, round])

  useEffect(() => setPos(0), [poolKey])

  const next = useCallback(() => {
    if (pos + 1 >= order.length) {
      setRound((r) => r + 1)
      setPos(0)
    } else {
      setPos(pos + 1)
    }
  }, [pos, order.length])

  const current = order.length ? order[pos % order.length] : undefined
  return { current, next, instanceKey: `${round}:${pos}:${current?.id}` }
}
