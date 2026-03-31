'use client'

import { Search, Youtube, X } from 'lucide-react'

interface ExerciseSearchModalProps {
  exerciseName: string | null
  onClose: () => void
}

export default function ExerciseSearchModal({ exerciseName, onClose }: ExerciseSearchModalProps) {
  if (!exerciseName) return null

  const query = encodeURIComponent(exerciseName)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-surface rounded-t-2xl p-6 pb-8 animate-slide-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-text-secondary"
        >
          <X size={20} />
        </button>

        <h3 className="text-base font-semibold mb-6 pr-8">{exerciseName}</h3>

        <div className="flex gap-3">
          <a
            href={`https://www.youtube.com/results?search_query=${query}+exercise+form`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 text-white font-medium text-sm active:scale-95 transition-transform"
          >
            <Youtube size={20} />
            YouTube
          </a>
          <a
            href={`https://www.google.com/search?q=${query}+exercise+form`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white font-medium text-sm active:scale-95 transition-transform"
          >
            <Search size={20} />
            Google
          </a>
        </div>
      </div>
    </div>
  )
}
