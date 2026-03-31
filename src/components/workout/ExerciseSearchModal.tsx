'use client'

import { Search, Youtube, X } from 'lucide-react'

interface ExerciseSearchModalProps {
  exerciseName: string | null
  onClose: () => void
}

/** Strip leading reps/numbers from exercise name: "30 Hollow Rock" → "Hollow Rock" */
function stripReps(name: string): string {
  return name.replace(/^[\d\/\s\-]+/, '').trim() || name
}

export default function ExerciseSearchModal({ exerciseName, onClose }: ExerciseSearchModalProps) {
  if (!exerciseName) return null

  const cleanName = stripReps(exerciseName)
  const query = encodeURIComponent(cleanName)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-[280px] bg-surface rounded-2xl p-5 shadow-lg">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 text-text-secondary"
        >
          <X size={18} />
        </button>

        <h3 className="text-sm font-semibold mb-4 pr-6">{cleanName}</h3>

        <div className="flex gap-2">
          <a
            href={`https://www.youtube.com/results?search_query=${query}${query}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-red-500 text-red-500 font-medium text-sm active:scale-95 transition-transform"
          >
            <Youtube size={18} />
            YouTube
          </a>
          <a
            href={`https://www.google.com/search?q=${query}${query}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-blue-500 text-blue-500 font-medium text-sm active:scale-95 transition-transform"
          >
            <Search size={18} />
            Google
          </a>
        </div>
      </div>
    </div>
  )
}
