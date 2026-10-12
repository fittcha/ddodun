'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Undo2, Redo2, Eraser, Trash2, PaintBucket, PenLine } from 'lucide-react'

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
const ERASE_R = 9 // px. 닿은 점만 걷어내고 남은 토막은 각자 획이 된다.
const GUIDE_ALPHA = 0.06

/**
 * 빈 캔버스 바탕에 옅게 깔리는 안내 — 가운데 작게 흘려 쓴 필기체 l 한 바퀴.
 * 베지어를 이어붙이면 이음새마다 접선이 안 맞아 뾰족해진다. 매개변수 곡선으로 뽑으면
 * 이음새 자체가 없다: y 가 sin² 이라 바닥에서 접선이 수평 → U 로 둥글게 넘어가고,
 * x 의 sin 항이 꼭대기에서 잠깐 뒤로 밀어 선이 제 몸을 감는다(= l 의 고리).
 * 위치는 손으로 맞추지 않고 그린 점들의 바운딩박스를 캔버스 중앙에 맞춘다.
 */
function drawGuide(ctx: CanvasRenderingContext2D, w: number, h: number, color: string) {
  const seg = h * 0.6, amp = h * 0.26
  const loopW = seg * 0.3 // loopW > seg/4 라야 고리가 실제로 교차한다
  const ang = (-12 * Math.PI) / 180
  const cos = Math.cos(ang), sin = Math.sin(ang)
  const pts: [number, number][] = []
  const T0 = -0.15, T1 = 1.3, STEPS = 90 // 앞뒤로 조금 더 돌려 들임·날림 획을 만든다
  for (let i = 0; i <= STEPS; i++) {
    const t = T0 + ((T1 - T0) * i) / STEPS
    const x = seg * t + loopW * Math.sin(2 * Math.PI * t)
    const y = -amp * Math.sin(Math.PI * t) ** 2
    pts.push([x * cos - y * sin, x * sin + y * cos])
  }
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1])
  const dx = w / 2 - (Math.min(...xs) + Math.max(...xs)) / 2
  const dy = h / 2 - (Math.min(...ys) + Math.max(...ys)) / 2
  ctx.save()
  ctx.globalAlpha = GUIDE_ALPHA
  ctx.strokeStyle = color
  ctx.lineWidth = Math.max(1.5, h * 0.022)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x + dx, y + dy) : ctx.moveTo(x + dx, y + dy)))
  ctx.stroke()
  ctx.restore()
}

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
  const [paletteOpen, setPaletteOpen] = useState(false)
  const erasingRef = useRef(false)
  erasingRef.current = erasing

  // 되돌리기는 '마지막 획 빼기'가 아니라 스냅샷 스택이다 — 부분 지우개가 생긴 뒤로는
  // 지운 것도 한 턴이라 획 개수만 봐서는 되돌릴 수 없다. 세션 한정(저장 안 함).
  const [hist, setHist] = useState<Stroke[][]>([normalize(value)])
  const [hi, setHi] = useState(0)

  // 그리는 중에는 서버 응답이 되돌아와도 ref 를 덮지 않는다 (진행 중인 획이 날아간다).
  if (!drawingRef.current) strokesRef.current = normalize(value)

  function commit(next: Stroke[]) {
    setHist(h => [...h.slice(0, hi + 1), next])
    setHi(hi + 1)
    onChange(next)
  }
  function step(to: number) {
    setHi(to)
    strokesRef.current = hist[to]
    onChange(hist[to])
  }

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
    if (strokesRef.current.length === 0) drawGuide(ctx, w, h, cs.color)
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
  }, [redraw, value, hi])

  /** 클라이언트 좌표 → 캔버스 CSS px. getBoundingClientRect 가 body zoom 까지 반영하므로 배율에 안전. */
  function toLocal(e: { clientX: number; clientY: number }): [number, number] {
    const r = canvasRef.current!.getBoundingClientRect()
    const scale = canvasRef.current!.clientWidth / r.width
    return [(e.clientX - r.left) * scale, (e.clientY - r.top) * scale]
  }

  /** 지우개: 반경에 닿은 점만 걷어내고, 끊긴 양쪽 토막을 각자 획으로 남긴다. */
  function eraseAt([x, y]: [number, number]): boolean {
    const w = canvasRef.current!.clientWidth
    const out: Stroke[] = []
    let changed = false
    for (const s of strokesRef.current) {
      let run: number[] = []
      let hit = false
      for (let i = 0; i < s.p.length; i += 2) {
        if (Math.hypot(s.p[i] * w - x, s.p[i + 1] * w - y) < ERASE_R) {
          hit = true
          if (run.length >= 4) out.push({ c: s.c, p: run }) // 점 하나만 남은 토막은 버린다
          run = []
        } else run.push(s.p[i], s.p[i + 1])
      }
      if (!hit) { out.push(s); continue }
      changed = true
      if (run.length >= 4) out.push({ c: s.c, p: run })
    }
    if (changed) strokesRef.current = out
    return changed
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
    if (d.dirty) commit(strokesRef.current) // 획이 끝날 때만 저장 → 디바운스 1회
  }

  const empty = normalize(value).length === 0
  const btn = 'w-7 h-7 flex items-center justify-center rounded disabled:opacity-25'

  return (
    <div>
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        // touch-action:none 이 없으면 획 대신 페이지가 스크롤된다.
        className="w-full aspect-[5/2] touch-none rounded border border-border bg-background text-foreground"
      />
      <div className="mt-1 flex items-center gap-1">
        {/* 펜·지우개는 둘 다 늘 보이고, 고른 쪽만 진하다 (토글보다 지금 뭘 쥐었는지가 명확하다). */}
        <button
          onClick={() => setErasing(false)}
          aria-label="펜"
          aria-pressed={!erasing}
          className={`${btn} ${erasing ? 'text-text-secondary/35' : 'text-foreground'}`}
        >
          <PenLine size={15} />
        </button>
        <button
          onClick={() => setErasing(true)}
          aria-label="지우개"
          aria-pressed={erasing}
          className={`${btn} ${erasing ? 'text-foreground' : 'text-text-secondary/35'}`}
        >
          <Eraser size={15} />
        </button>
        <div className="relative">
          {/* 칩은 평소 접어둔다 — 툴바에 늘 펼쳐두면 지우개/되돌리기와 섞여 무거워진다. */}
          {paletteOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setPaletteOpen(false)} />
              <div className="absolute bottom-full left-0 z-50 mb-1 flex gap-1.5 rounded-full border border-border bg-surface px-2 py-1.5 shadow-lg">
                {PALETTE.map((v, i) => (
                  <button
                    key={v}
                    onClick={() => { setColor(i); setErasing(false); setPaletteOpen(false) }}
                    aria-label={`색 ${i + 1}`}
                    className={`w-5 h-5 rounded-full border-2 ${
                      color === i ? 'border-text-secondary' : 'border-transparent'
                    }`}
                  >
                    <span className="block w-full h-full rounded-full" style={{ background: `var(${v})` }} />
                  </button>
                ))}
              </div>
            </>
          )}
          <button
            onClick={() => setPaletteOpen(v => !v)}
            aria-label="색상"
            aria-expanded={paletteOpen}
            className={btn}
            style={{ color: `var(${PALETTE[color]})` }}
          >
            <PaintBucket size={15} />
          </button>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => step(hi - 1)}
          disabled={hi === 0}
          aria-label="되돌리기"
          className={`${btn} text-text-secondary/60`}
        >
          <Undo2 size={14} />
        </button>
        <button
          onClick={() => step(hi + 1)}
          disabled={hi >= hist.length - 1}
          aria-label="다시 실행"
          className={`${btn} text-text-secondary/60`}
        >
          <Redo2 size={14} />
        </button>
        <button
          onClick={() => commit([])}
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
