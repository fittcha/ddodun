'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Undo2, Eraser, Trash2 } from 'lucide-react'

/**
 * 메모칸 손글씨. 애플펜슬/손가락으로 그리고, 획을 좌표 배열로 JSON 에 저장한다.
 * PNG dataURL 대신 벡터로 두는 이유: 한 획이 수십 바이트라 sets_detail 에 그냥 들어가고
 * (Storage 버킷·마이그레이션 불필요), 화면 폭이 달라져도 다시 그리면 선명하다.
 * 좌표는 둘 다 '폭' 기준으로 정규화한다 — 높이로 나누면 기기마다 가로세로가 찌그러진다.
 */
export type Stroke = { c: number; p: number[] } // c=색 인덱스, p=[x,y,x,y,…] 0~1 (폭 기준)

/** 색은 테마 변수 인덱스로 저장한다 — 1바이트면 되고 테마를 바꿔도 같이 따라간다. */
const PALETTE = ['--foreground', '--danger', '--success']
const LINE_WIDTH = 2
const MIN_STEP = 1.5 // px. 이보다 가까운 점은 버려서 JSON 을 줄인다.
const ERASE_R = 10 // px. 이 안에 들어온 획을 통째로 지운다 (벡터라 픽셀 지우개가 필요 없다).

/** 색이 없던 옛 저장본(number[])을 지금 모양으로 올린다. */
const normalize = (v: (Stroke | number[])[]): Stroke[] =>
  v.map(s => (Array.isArray(s) ? { c: 0, p: s } : s))

export default function MemoSketch({
  value,
  onChange,
}: {
  value: (Stroke | number[])[]
  onChange: (strokes: Stroke[]) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const strokesRef = useRef<Stroke[]>(normalize(value))
  const drawingRef = useRef<{ id: number; last: [number, number]; dirty: boolean } | null>(null)
  // 펜슬을 한 번이라도 쓴 캔버스에서는 손바닥(touch)을 무시한다 — 팜 리젝션.
  const sawPenRef = useRef(false)
  const [color, setColor] = useState(0)
  const [erasing, setErasing] = useState(false)
  const erasingRef = useRef(false)
  erasingRef.current = erasing

  // 그리는 중에는 서버 응답이 되돌아와도 ref 를 덮지 않는다 (진행 중인 획이 날아간다).
  if (!drawingRef.current) strokesRef.current = normalize(value)

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
    const cs = getComputedStyle(canvas)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)
    ctx.lineWidth = LINE_WIDTH
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    for (const s of strokesRef.current) {
      if (s.p.length < 2) continue
      ctx.strokeStyle = cs.getPropertyValue(PALETTE[s.c] ?? PALETTE[0]).trim() || cs.color
      ctx.beginPath()
      ctx.moveTo(s.p[0] * w, s.p[1] * w)
      for (let i = 2; i < s.p.length; i += 2) ctx.lineTo(s.p[i] * w, s.p[i + 1] * w)
      if (s.p.length === 2) ctx.lineTo(s.p[0] * w + 0.01, s.p[1] * w) // 점 하나도 보이게
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

  /** 지우개: 커서 반경 안에 점이 하나라도 걸린 획을 통째로 뺀다. */
  function eraseAt([x, y]: [number, number]): boolean {
    const w = canvasRef.current!.clientWidth
    const before = strokesRef.current.length
    strokesRef.current = strokesRef.current.filter(s => {
      for (let i = 0; i < s.p.length; i += 2)
        if (Math.hypot(s.p[i] * w - x, s.p[i + 1] * w - y) < ERASE_R) return false
      return true
    })
    return strokesRef.current.length !== before
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (e.pointerType === 'pen') sawPenRef.current = true
    else if (sawPenRef.current && e.pointerType === 'touch') return
    e.currentTarget.setPointerCapture(e.pointerId)
    const p = toLocal(e)
    drawingRef.current = { id: e.pointerId, last: p, dirty: false }
    if (erasingRef.current) {
      drawingRef.current.dirty = eraseAt(p)
    } else {
      const w = canvasRef.current!.clientWidth
      strokesRef.current = [...strokesRef.current, { c: color, p: [round(p[0] / w), round(p[1] / w)] }]
      drawingRef.current.dirty = true
    }
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
      d.last = p
      if (erasingRef.current) d.dirty = eraseAt(p) || d.dirty
      else stroke.p.push(round(p[0] / w), round(p[1] / w))
    }
    redraw()
  }

  function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    const d = drawingRef.current
    if (!d || d.id !== e.pointerId) return
    drawingRef.current = null
    if (d.dirty) onChange(strokesRef.current) // 획이 끝날 때만 저장 → 디바운스 1회
  }

  const strokes = normalize(value)
  const empty = strokes.length === 0
  const btn = 'w-7 h-7 flex items-center justify-center rounded disabled:opacity-25'

  return (
    <div>
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
      </div>
      <div className="mt-1 flex items-center gap-1">
        {PALETTE.map((v, i) => (
          <button
            key={v}
            onClick={() => { setColor(i); setErasing(false) }}
            aria-label={`색 ${i + 1}`}
            className={`w-5 h-5 rounded-full border-2 ${
              color === i && !erasing ? 'border-text-secondary' : 'border-transparent'
            }`}
          >
            <span className="block w-full h-full rounded-full" style={{ background: `var(${v})` }} />
          </button>
        ))}
        <button
          onClick={() => setErasing(v => !v)}
          aria-label="지우개"
          className={`${btn} ml-1 ${erasing ? 'bg-highlight text-highlight-text' : 'text-text-secondary/60'}`}
        >
          <Eraser size={14} />
        </button>
        <div className="flex-1" />
        <button
          onClick={() => onChange(strokes.slice(0, -1))}
          disabled={empty}
          aria-label="한 획 되돌리기"
          className={`${btn} text-text-secondary/60`}
        >
          <Undo2 size={14} />
        </button>
        <button
          onClick={() => onChange([])}
          disabled={empty}
          aria-label="전체 지우기"
          className={`${btn} text-text-secondary/60`}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

const round = (n: number) => Math.round(n * 1000) / 1000
