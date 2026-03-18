'use client'

export interface EmomEntry {
  name: string
  value: number | null
  measure: 'reps' | 'cal'
  weight: number | null
  weight_unit: 'lb' | 'kg'
}

export interface EmomData {
  entries: EmomEntry[]
}

interface Props {
  data: EmomData
  onChange: (data: EmomData) => void
}

function defaultEntry(): EmomEntry {
  return { name: '', value: null, measure: 'reps', weight: null, weight_unit: 'lb' }
}

export default function EmomBuilder({ data, onChange }: Props) {
  const { entries } = data

  function update(idx: number, patch: Partial<EmomEntry>) {
    const next = entries.map((e, i) => i === idx ? { ...e, ...patch } : e)
    onChange({ entries: next })
  }

  function addEntry() {
    onChange({ entries: [...entries, defaultEntry()] })
  }

  function removeEntry(idx: number) {
    if (entries.length <= 1) return
    onChange({ entries: entries.filter((_, i) => i !== idx) })
  }

  return (
    <div className="space-y-1">
      {entries.map((entry, i) => (
        <div key={i} className="flex items-center gap-1">
          <span className="text-[10px] text-accent font-bold w-3 shrink-0">{i + 1}</span>
          <input
            type="number"
            inputMode="numeric"
            value={entry.value ?? ''}
            onChange={e => update(i, { value: e.target.value ? parseInt(e.target.value) : null })}
            placeholder="0"
            className="w-8 text-center text-[11px] font-bold rounded border border-border bg-background py-1 text-foreground placeholder:text-text-secondary/20 focus:outline-none focus:border-accent"
          />
          <button
            onClick={() => update(i, { measure: entry.measure === 'reps' ? 'cal' : 'reps' })}
            className="text-[9px] font-bold text-accent bg-accent/10 rounded px-1 py-0.5 w-7 text-center"
          >
            {entry.measure}
          </button>
          <input
            type="text"
            value={entry.name}
            onChange={e => update(i, { name: e.target.value })}
            placeholder="동작"
            className="flex-1 min-w-0 text-[11px] rounded border border-border bg-background px-1.5 py-1 text-foreground placeholder:text-text-secondary/30 focus:outline-none focus:border-accent"
          />
          {entry.weight !== null ? (
            <div className="flex items-center gap-0.5">
              <input
                type="number"
                inputMode="decimal"
                value={entry.weight ?? ''}
                onChange={e => update(i, { weight: e.target.value ? parseFloat(e.target.value) : null })}
                className="w-9 text-center text-[10px] font-bold rounded border border-border bg-background py-0.5 text-foreground focus:outline-none focus:border-accent"
              />
              <button
                onClick={() => update(i, { weight_unit: entry.weight_unit === 'lb' ? 'kg' : 'lb' })}
                className="text-[9px] text-text-secondary"
              >
                {entry.weight_unit}
              </button>
              <button
                onClick={() => update(i, { weight: null })}
                className="text-text-secondary/30 text-[9px]"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => update(i, { weight: 0 })}
              className="text-[9px] text-text-secondary/40"
              title="무게 추가"
            >
              +wt
            </button>
          )}
          {entries.length > 1 && (
            <button onClick={() => removeEntry(i)} className="text-text-secondary/30 ml-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
              </svg>
            </button>
          )}
        </div>
      ))}
      <button onClick={addEntry} className="text-[10px] text-accent/70 font-medium">+ 분</button>
    </div>
  )
}
