'use client'

export type ResultType = 'rounds' | 'reps' | 'time' | 'cal'

export interface ResultEntry {
  rounds?: number | null
  extra_reps?: number | null
  reps?: number | null
  cal?: number | null
  minutes?: number | null
  seconds?: number | null
}

export interface ResultData {
  result_type: ResultType
  // Legacy single-value fields (kept for backward compat reading)
  rounds?: number | null
  extra_reps?: number | null
  reps?: number | null
  cal?: number | null
  minutes?: number | null
  seconds?: number | null
  // Multi-set
  result_sets?: ResultEntry[]
}

interface Props {
  data: ResultData
  onChange: (data: ResultData) => void
}

function getSets(data: ResultData): ResultEntry[] {
  if (data.result_sets && data.result_sets.length > 0) return data.result_sets
  // Migrate legacy single value to one-element array
  return [{
    rounds: data.rounds,
    extra_reps: data.extra_reps,
    reps: data.reps,
    cal: data.cal,
    minutes: data.minutes,
    seconds: data.seconds,
  }]
}

function emitChange(data: ResultData, sets: ResultEntry[], onChange: (d: ResultData) => void) {
  // Keep first set values in top-level for backward compat
  const first = sets[0] || {}
  onChange({
    ...data,
    rounds: first.rounds,
    extra_reps: first.extra_reps,
    reps: first.reps,
    cal: first.cal,
    minutes: first.minutes,
    seconds: first.seconds,
    result_sets: sets,
  })
}

export default function ResultInput({ data, onChange }: Props) {
  const inputCls = "w-10 text-center text-xs font-bold rounded border border-border bg-background py-1 text-foreground placeholder:text-text-secondary/20 focus:outline-none focus:border-accent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"

  const sets = getSets(data)

  function updateSet(idx: number, patch: Partial<ResultEntry>) {
    const next = [...sets]
    next[idx] = { ...next[idx], ...patch }
    emitChange(data, next, onChange)
  }

  function addSet() {
    emitChange(data, [...sets, {}], onChange)
  }

  function removeSet(idx: number) {
    if (sets.length <= 1) return
    emitChange(data, sets.filter((_, i) => i !== idx), onChange)
  }

  if (data.result_type === 'rounds') {
    return (
      <div className="space-y-1">
        {sets.map((s, i) => (
          <div key={i} className="flex items-center gap-1 justify-end">
            {i === sets.length - 1 && (
              <button onClick={addSet} className="text-[10px] text-accent/70 font-medium mr-auto">+ 세트</button>
            )}
            <span className="text-[10px] text-text-secondary/60 w-3 text-right shrink-0">{i + 1}</span>
            <input
              type="number"
              inputMode="numeric"
              value={s.rounds ?? ''}
              onChange={e => updateSet(i, { rounds: e.target.value ? parseInt(e.target.value) : null })}
              placeholder="0"
              className={inputCls}
            />
            <span className="text-[10px] font-bold text-text-secondary">R +</span>
            <input
              type="number"
              inputMode="numeric"
              value={s.extra_reps ?? ''}
              onChange={e => updateSet(i, { extra_reps: e.target.value ? parseInt(e.target.value) : null })}
              placeholder="0"
              className={inputCls}
            />
            {sets.length > 1 && (
              <button onClick={() => removeSet(i)} className="text-text-secondary/30 text-[10px]">✕</button>
            )}
          </div>
        ))}
      </div>
    )
  }

  if (data.result_type === 'reps') {
    return (
      <div className="space-y-1">
        {sets.map((s, i) => (
          <div key={i} className="flex items-center gap-1 justify-end">
            {i === sets.length - 1 && (
              <button onClick={addSet} className="text-[10px] text-accent/70 font-medium mr-auto">+ 세트</button>
            )}
            <span className="text-[10px] text-text-secondary/60 w-3 text-right shrink-0">{i + 1}</span>
            <input
              type="number"
              inputMode="numeric"
              value={s.reps ?? ''}
              onChange={e => updateSet(i, { reps: e.target.value ? parseInt(e.target.value) : null })}
              placeholder="0"
              className={`${inputCls} w-14`}
            />
            <span className="text-[10px] text-text-secondary">reps</span>
            {sets.length > 1 && (
              <button onClick={() => removeSet(i)} className="text-text-secondary/30 text-[10px]">✕</button>
            )}
          </div>
        ))}
      </div>
    )
  }

  if (data.result_type === 'cal') {
    return (
      <div className="space-y-1">
        {sets.map((s, i) => (
          <div key={i} className="flex items-center gap-1 justify-end">
            {i === sets.length - 1 && (
              <button onClick={addSet} className="text-[10px] text-accent/70 font-medium mr-auto">+ 세트</button>
            )}
            <span className="text-[10px] text-text-secondary/60 w-3 text-right shrink-0">{i + 1}</span>
            <input
              type="number"
              inputMode="numeric"
              value={s.cal ?? ''}
              onChange={e => updateSet(i, { cal: e.target.value ? parseInt(e.target.value) : null })}
              placeholder="0"
              className={`${inputCls} w-14`}
            />
            <span className="text-[10px] text-text-secondary">cal</span>
            {sets.length > 1 && (
              <button onClick={() => removeSet(i)} className="text-text-secondary/30 text-[10px]">✕</button>
            )}
          </div>
        ))}
      </div>
    )
  }

  // time
  return (
    <div className="space-y-1">
      {sets.map((s, i) => (
        <div key={i} className="flex items-center gap-1 justify-end">
          {i === sets.length - 1 && (
            <button onClick={addSet} className="text-[10px] text-accent/70 font-medium mr-auto">+ 세트</button>
          )}
          <span className="text-[10px] text-text-secondary/60 w-3 text-right shrink-0">{i + 1}</span>
          <input
            type="number"
            inputMode="numeric"
            value={s.minutes ?? ''}
            onChange={e => updateSet(i, { minutes: e.target.value ? parseInt(e.target.value) : null })}
            placeholder="00"
            className={inputCls}
          />
          <span className="text-xs font-bold text-text-secondary">:</span>
          <input
            type="number"
            inputMode="numeric"
            value={s.seconds ?? ''}
            onChange={e => updateSet(i, { seconds: e.target.value ? parseInt(e.target.value) : null })}
            placeholder="00"
            className={inputCls}
          />
          {sets.length > 1 && (
            <button onClick={() => removeSet(i)} className="text-text-secondary/30 text-[10px]">✕</button>
          )}
        </div>
      ))}
    </div>
  )
}
