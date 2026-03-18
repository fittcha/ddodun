'use client'

export interface WeightSet {
  weight: number | null
}

export interface WeightSetsData {
  weight_unit: 'lb' | 'kg'
  sets: WeightSet[]
}

interface Props {
  data: WeightSetsData
  onChange: (data: WeightSetsData) => void
}

export default function WeightSetsInput({ data, onChange }: Props) {
  const { weight_unit, sets } = data

  function toggleUnit() {
    onChange({ ...data, weight_unit: weight_unit === 'lb' ? 'kg' : 'lb' })
  }

  function updateSet(idx: number, weight: number | null) {
    const next = [...sets]
    next[idx] = { weight }
    onChange({ ...data, sets: next })
  }

  function adjustSet(idx: number, delta: number) {
    const current = sets[idx]?.weight ?? 0
    const next = Math.max(0, current + delta)
    updateSet(idx, next === 0 ? null : next)
  }

  function addSet() {
    const lastWeight = sets.length > 0 ? sets[sets.length - 1].weight : null
    onChange({ ...data, sets: [...sets, { weight: lastWeight }] })
  }

  function removeSet(idx: number) {
    if (sets.length <= 1) return
    onChange({ ...data, sets: sets.filter((_, i) => i !== idx) })
  }

  return (
    <div className="space-y-1">
      {sets.map((s, i) => (
        <div key={i} className="flex items-center gap-1 justify-end">
          {i === sets.length - 1 && (
            <button onClick={addSet} className="text-[10px] text-accent/70 font-medium mr-auto">+ 세트</button>
          )}
          <span className="text-[10px] text-text-secondary/60 w-3 text-right shrink-0">{i + 1}</span>
          <button
            onClick={() => adjustSet(i, -5)}
            className="w-6 h-6 rounded border border-border bg-background flex items-center justify-center text-text-secondary/60 text-xs active:bg-accent/10"
          >
            −
          </button>
          <input
            type="number"
            inputMode="decimal"
            value={s.weight ?? ''}
            onChange={e => updateSet(i, e.target.value ? parseFloat(e.target.value) : null)}
            placeholder="—"
            className="w-14 text-center text-xs font-bold rounded border border-border bg-background py-1 text-foreground placeholder:text-text-secondary/20 focus:outline-none focus:border-accent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            onClick={() => adjustSet(i, 5)}
            className="w-6 h-6 rounded border border-border bg-background flex items-center justify-center text-text-secondary/60 text-xs active:bg-accent/10"
          >
            +
          </button>
          <button
            onClick={toggleUnit}
            className="text-[10px] font-bold text-accent w-5"
          >
            {weight_unit}
          </button>
          {sets.length > 1 && (
            <button onClick={() => removeSet(i)} className="text-text-secondary/30 text-[10px]">✕</button>
          )}
        </div>
      ))}
    </div>
  )
}
