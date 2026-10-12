'use client'

import { useRef, useEffect, useCallback } from 'react'
import { Undo2, Eraser } from 'lucide-react'

/**
 * 메모칸 손글씨. 애플펜슬/손가락으로 그리고, 획을 좌표 배열로 JSON 에 저장한다.
 * PNG dataURL 대신 벡터로 두는 이유: 한 획이 수십 바이트라 sets_detail 에 그냥 들어가고
 * (Storage 버킷·마이그레이션 불필요), 화면 폭이 달라져도 다시 그리면 선명하다.
 * 좌표는 둘 다 '폭' 기준으로 정규화한다 — 높이로 나누면 기기마다 가로세로가 찌그러진다.
 */
export type Stroke = number[] // [x,y,x,y,…] 0~1 (폭 기준)

const LINE_WIDTH = 2
const MIN_STEP = 1.5 // px. 이보다 가까운 점은 버려서 JSON 을 줄인다.

export default function MemoSketch({
  value,
  onChange,
}: {
  value: Stroke[]
  onChange: (strokes: Stroke[]) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const strokesRef = useRef<Stroke[]>(value)
  const drawingRef = useRef<{ id: number; last: [number, number] } | null>(null)
  // 펜슬을 한 번이라도 쓴 캔버스에서는 손바닥(touch)을 무시한다 — 팜 리젝션.
  const sawPenRef = useRef(false)

  // 그리는 중에는 서버 응답이 되돌아와도 ref 를 덮지 않는다 (진행 중인 획이 날아간다).
  if (!drawingRef.current) strokesRef.current = value

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    if (!w || !h) return
    const dpr = window.devicePixelRatio || 1
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)
    ctx.strokeStyle = getComputedStyle(canvas).color
    ctx.lineWidth = LINE_WIDTH
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    for (const s of strokesRef.current) {
      if (s.length < 2) continue
      ctx.beginPath()
      ctx.moveTo(s[0] * w, s[1] * w)
      for (let i = 2; i < s.length; i += 2) ctx.lineTo(s[i] * w, s[i + 1] * w)
      if (s.length === 2) ctx.lineTo(s[0] * w + 0.01, s[1] * w) // 점 하나도 보이게
      ctx.stroke()
    }
  }, [])

  // 폭이 바뀌면(회전, 넓은 화면 배율) 다시 그린다.
  useEffect(() => {
    redraw()
    const canvas = canvasRef.current
    if (!canvas || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(redraw)
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [redraw, value])

  /** 클라이언트 좌표 → 캔버스 CSS px. getBoundingClientRect 가 body zoom 까지 반영하므로 배율에 안전. */
  function toLocal(e: { clientX: number; clientY: number }): [number, number] {
    const r = canvasRef.current!.getBoundingClientRect()
    const scale = canvasRef.current!.clientWidth / r.width
    return [(e.clientX - r.left) * scale, (e.clientY - r.top) * scale]
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (e.pointerType === 'pen') sawPenRef.current = true
    else if (sawPenRef.current && e.pointerType === 'touch') return
    e.currentTarget.setPointerCapture(e.pointerId)
    const p = toLocal(e)
    const w = canvasRef.current!.clientWidth
    drawingRef.current = { id: e.pointerId, last: p }
    strokesRef.current = [...strokesRef.current, [p[0] / w, p[1] / w]]
    redraw()
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const d = drawingRef.current
    if (!d || d.id !== e.pointerId) return
    const w = canvasRef.current!.clientWidth
    const stroke = strokesRef.current[strokesRef.current.length - 1]
    // 펜슬은 240Hz 로 쌓인 중간 샘플을 돌려준다 — 쓰면 선이 훨씬 매끄럽다.
    for (const ev of e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent]) {
      const p = toLocal(ev)
      if (Math.hypot(p[0] - d.last[0], p[1] - d.last[1]) < MIN_STEP) continue
      stroke.push(round(p[0] / w), round(p[1] / w))
      d.last = p
    }
    redraw()
  }

  function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current || drawingRef.current.id !== e.pointerId) return
    drawingRef.current = null
    onChange(strokesRef.current) // 획이 끝날 때만 저장 → 디바운스 1회
  }

  const empty = value.length === 0

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        // touch-action:none 이 없으면 획 대신 페이지가 스크롤된다.
        className="w-full aspect-[5/2] touch-none rounded border border-border bg-background text-foreground"
      />
      {empty && (
        <span className="pointer-events-none absolute left-2 top-1.5 text-xs text-text-secondary/40">
          여기에 손글씨
        </span>
      )}
      {!empty && (
        <div className="absolute right-1 top-1 flex gap-1">
          <button
            onClick={() => onChange(value.slice(0, -1))}
            className="w-6 h-6 flex items-center justify-center rounded text-text-secondary/60 active:text-foreground"
            aria-label="한 획 지우기"
          >
            <Undo2 size={13} />
          </button>
          <button
            onClick={() => onChange([])}
            className="w-6 h-6 flex items-center justify-center rounded text-text-secondary/60 active:text-danger"
            aria-label="전체 지우기"
          >
            <Eraser size={13} />
          </button>
        </div>
      )}
    </div>
  )
}

const round = (n: number) => Math.round(n * 1000) / 1000
