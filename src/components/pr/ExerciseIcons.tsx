'use client'

// 백스쿼트 - 정면, 바벨 어깨 위, ATG 딥스쿼트 (고관절 < 무릎)
export function BackSquatIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="32" cy="10" r="5" strokeWidth="3" />
      {/* Barbell */}
      <line x1="8" y1="20" x2="56" y2="20" strokeWidth="3" />
      <rect x="4" y="15" width="4" height="10" rx="1" strokeWidth="2.5" />
      <rect x="9" y="16" width="3" height="8" rx="0.5" strokeWidth="2" />
      <rect x="56" y="15" width="4" height="10" rx="1" strokeWidth="2.5" />
      <rect x="52" y="16" width="3" height="8" rx="0.5" strokeWidth="2" />
      {/* Arms */}
      <path d="M22 20 C22 24, 26 28, 28 26" strokeWidth="3" fill="none" />
      <path d="M42 20 C42 24, 38 28, 36 26" strokeWidth="3" fill="none" />
      {/* Torso - drops lower */}
      <path d="M28 26 L25 44" strokeWidth="3.5" />
      <path d="M36 26 L39 44" strokeWidth="3.5" />
      {/* Hips at 44 - below knee level */}
      <path d="M25 44 Q32 48, 39 44" strokeWidth="3" />
      {/* Thigh goes UP from hip to knee (knee at ~38) */}
      <path d="M25 44 C20 44, 14 40, 12 38" strokeWidth="3.5" />
      {/* Shin from knee down */}
      <path d="M12 38 C12 46, 14 52, 16 56" strokeWidth="3.5" />
      <line x1="16" y1="56" x2="10" y2="58" strokeWidth="3" />
      <path d="M39 44 C44 44, 50 40, 52 38" strokeWidth="3.5" />
      <path d="M52 38 C52 46, 50 52, 48 56" strokeWidth="3.5" />
      <line x1="48" y1="56" x2="54" y2="58" strokeWidth="3" />
    </svg>
  )
}

// 프론트스쿼트 - 프론트랙, ATG (고관절 < 무릎)
export function FrontSquatIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="32" cy="10" r="5" strokeWidth="3" />
      {/* Barbell front rack */}
      <line x1="10" y1="24" x2="54" y2="24" strokeWidth="3" />
      <rect x="4" y="19" width="4" height="10" rx="1" strokeWidth="2.5" />
      <rect x="9" y="20" width="3" height="8" rx="0.5" strokeWidth="2" />
      <rect x="56" y="19" width="4" height="10" rx="1" strokeWidth="2.5" />
      <rect x="52" y="20" width="3" height="8" rx="0.5" strokeWidth="2" />
      {/* Arms - elbows up */}
      <path d="M26 24 L22 20 L24 16" strokeWidth="3" fill="none" />
      <path d="M38 24 L42 20 L40 16" strokeWidth="3" fill="none" />
      {/* Torso drops low */}
      <path d="M28 24 L25 44" strokeWidth="3.5" />
      <path d="M36 24 L39 44" strokeWidth="3.5" />
      {/* Hips at 44 */}
      <path d="M25 44 Q32 48, 39 44" strokeWidth="3" />
      {/* Thigh UP to knee (~38), shin down */}
      <path d="M25 44 C20 44, 14 40, 12 38" strokeWidth="3.5" />
      <path d="M12 38 C12 46, 14 52, 16 56" strokeWidth="3.5" />
      <line x1="16" y1="56" x2="10" y2="58" strokeWidth="3" />
      <path d="M39 44 C44 44, 50 40, 52 38" strokeWidth="3.5" />
      <path d="M52 38 C52 46, 50 52, 48 56" strokeWidth="3.5" />
      <line x1="48" y1="56" x2="54" y2="58" strokeWidth="3" />
    </svg>
  )
}

// 데드리프트
export function DeadliftIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="12" r="5" strokeWidth="3" />
      <path d="M20 17 L34 32" strokeWidth="4" />
      <path d="M18 17 L20 17" strokeWidth="3" />
      <path d="M24 22 L26 42" strokeWidth="3" />
      <path d="M28 26 L30 42" strokeWidth="3" />
      <line x1="14" y1="42" x2="50" y2="42" strokeWidth="3" />
      <rect x="8" y="36" width="4" height="12" rx="1" strokeWidth="2.5" />
      <rect x="13" y="37" width="3" height="10" rx="0.5" strokeWidth="2" />
      <rect x="52" y="36" width="4" height="12" rx="1" strokeWidth="2.5" />
      <rect x="49" y="37" width="3" height="10" rx="0.5" strokeWidth="2" />
      <path d="M34 32 L36 34" strokeWidth="3" />
      <path d="M36 34 L38 46" strokeWidth="3.5" />
      <path d="M38 46 L40 56" strokeWidth="3.5" />
      <line x1="40" y1="56" x2="44" y2="56" strokeWidth="3" />
      <path d="M34 32 L32 44" strokeWidth="3.5" />
      <path d="M32 44 L32 56" strokeWidth="3.5" />
      <line x1="32" y1="56" x2="36" y2="56" strokeWidth="3" />
    </svg>
  )
}

// 벤치프레스
export function BenchIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <rect x="10" y="38" width="36" height="4" rx="2" strokeWidth="2.5" />
      <line x1="14" y1="42" x2="14" y2="54" strokeWidth="3" />
      <line x1="42" y1="42" x2="42" y2="54" strokeWidth="3" />
      <circle cx="14" cy="30" r="4" strokeWidth="3" />
      <path d="M18 31 L40 31" strokeWidth="4" />
      <path d="M24 31 L24 22" strokeWidth="3" />
      <path d="M32 31 L32 22" strokeWidth="3" />
      <path d="M24 22 L28 14" strokeWidth="3" />
      <path d="M32 22 L36 14" strokeWidth="3" />
      <line x1="22" y1="14" x2="44" y2="14" strokeWidth="3" />
      <rect x="16" y="10" width="4" height="8" rx="1" strokeWidth="2.5" />
      <rect x="21" y="11" width="3" height="6" rx="0.5" strokeWidth="2" />
      <rect x="46" y="10" width="4" height="8" rx="1" strokeWidth="2.5" />
      <rect x="43" y="11" width="3" height="6" rx="0.5" strokeWidth="2" />
      <path d="M40 33 L46 42" strokeWidth="3" />
      <path d="M46 42 L48 54" strokeWidth="3" />
      <line x1="48" y1="54" x2="52" y2="54" strokeWidth="3" />
    </svg>
  )
}

// 숄더프레스 - 정면, 서서 스트릭트 프레스, 다리 곧게
export function OverheadIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="32" cy="18" r="5" strokeWidth="3" />
      <line x1="8" y1="6" x2="56" y2="6" strokeWidth="3" />
      <rect x="4" y="2" width="4" height="8" rx="1" strokeWidth="2.5" />
      <rect x="9" y="3" width="3" height="6" rx="0.5" strokeWidth="2" />
      <rect x="56" y="2" width="4" height="8" rx="1" strokeWidth="2.5" />
      <rect x="52" y="3" width="3" height="6" rx="0.5" strokeWidth="2" />
      <path d="M26 24 L22 16 L20 6" strokeWidth="3" fill="none" />
      <path d="M38 24 L42 16 L44 6" strokeWidth="3" fill="none" />
      <path d="M28 24 L28 42" strokeWidth="3.5" />
      <path d="M36 24 L36 42" strokeWidth="3.5" />
      <path d="M28 42 Q32 44, 36 42" strokeWidth="3" />
      <path d="M28 42 L26 54" strokeWidth="3.5" />
      <line x1="26" y1="54" x2="22" y2="58" strokeWidth="3" />
      <line x1="22" y1="58" x2="18" y2="58" strokeWidth="3" />
      <path d="M36 42 L38 54" strokeWidth="3.5" />
      <line x1="38" y1="54" x2="42" y2="58" strokeWidth="3" />
      <line x1="42" y1="58" x2="46" y2="58" strokeWidth="3" />
    </svg>
  )
}

// 클린 - 정면, 프론트랙 캐치, ATG (고관절 < 무릎)
export function CleanIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="32" cy="8" r="5" strokeWidth="3" />
      {/* Barbell at front rack */}
      <line x1="8" y1="20" x2="56" y2="20" strokeWidth="3" />
      <rect x="4" y="15" width="4" height="10" rx="1" strokeWidth="2.5" />
      <rect x="9" y="16" width="3" height="8" rx="0.5" strokeWidth="2" />
      <rect x="56" y="15" width="4" height="10" rx="1" strokeWidth="2.5" />
      <rect x="52" y="16" width="3" height="8" rx="0.5" strokeWidth="2" />
      {/* Arms - elbows forward */}
      <path d="M26 20 L22 16 L24 13" strokeWidth="3" fill="none" />
      <path d="M38 20 L42 16 L40 13" strokeWidth="3" fill="none" />
      {/* Torso drops low */}
      <path d="M28 22 L25 44" strokeWidth="3.5" />
      <path d="M36 22 L39 44" strokeWidth="3.5" />
      {/* Hips at 44 */}
      <path d="M25 44 Q32 48, 39 44" strokeWidth="3" />
      {/* Thigh UP to knee (~38), shin down */}
      <path d="M25 44 C20 44, 14 40, 12 38" strokeWidth="3.5" />
      <path d="M12 38 C12 46, 14 52, 16 56" strokeWidth="3.5" />
      <line x1="16" y1="56" x2="10" y2="58" strokeWidth="3" />
      <path d="M39 44 C44 44, 50 40, 52 38" strokeWidth="3.5" />
      <path d="M52 38 C52 46, 50 52, 48 56" strokeWidth="3.5" />
      <line x1="48" y1="56" x2="54" y2="58" strokeWidth="3" />
      {/* Motion lines */}
      <line x1="6" y1="48" x2="6" y2="40" strokeWidth="1.5" strokeDasharray="2 3" />
      <line x1="58" y1="48" x2="58" y2="40" strokeWidth="1.5" strokeDasharray="2 3" />
    </svg>
  )
}

// 파워클린 - 정면, 프론트랙 캐치, 하이캐치(쿼터스쿼트)
export function PowerCleanIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="32" cy="8" r="5" strokeWidth="3" />
      {/* Barbell at front rack */}
      <line x1="8" y1="20" x2="56" y2="20" strokeWidth="3" />
      <rect x="4" y="15" width="4" height="10" rx="1" strokeWidth="2.5" />
      <rect x="9" y="16" width="3" height="8" rx="0.5" strokeWidth="2" />
      <rect x="56" y="15" width="4" height="10" rx="1" strokeWidth="2.5" />
      <rect x="52" y="16" width="3" height="8" rx="0.5" strokeWidth="2" />
      {/* Arms - elbows forward */}
      <path d="M26 20 L22 16 L24 13" strokeWidth="3" fill="none" />
      <path d="M38 20 L42 16 L40 13" strokeWidth="3" fill="none" />
      {/* Torso - more upright than full clean */}
      <path d="M28 22 L28 38" strokeWidth="3.5" />
      <path d="M36 22 L36 38" strokeWidth="3.5" />
      <path d="M28 38 Q32 40, 36 38" strokeWidth="3" />
      {/* Legs - quarter squat (higher catch) */}
      <path d="M28 38 L24 48" strokeWidth="3.5" />
      <path d="M24 48 L24 56" strokeWidth="3.5" />
      <line x1="24" y1="56" x2="20" y2="58" strokeWidth="3" />
      <line x1="20" y1="58" x2="16" y2="58" strokeWidth="3" />
      <path d="M36 38 L40 48" strokeWidth="3.5" />
      <path d="M40 48 L40 56" strokeWidth="3.5" />
      <line x1="40" y1="56" x2="44" y2="58" strokeWidth="3" />
      <line x1="44" y1="58" x2="48" y2="58" strokeWidth="3" />
      {/* Motion lines */}
      <line x1="10" y1="46" x2="10" y2="38" strokeWidth="1.5" strokeDasharray="2 3" />
      <line x1="54" y1="46" x2="54" y2="38" strokeWidth="1.5" strokeDasharray="2 3" />
    </svg>
  )
}

// 클린앤저크 - 정면, 오버헤드 록아웃 + 스플릿 스탠스
export function CleanAndJerkIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="32" cy="14" r="5" strokeWidth="3" />
      {/* Barbell overhead */}
      <line x1="8" y1="6" x2="56" y2="6" strokeWidth="3" />
      <rect x="4" y="2" width="4" height="8" rx="1" strokeWidth="2.5" />
      <rect x="9" y="3" width="3" height="6" rx="0.5" strokeWidth="2" />
      <rect x="56" y="2" width="4" height="8" rx="1" strokeWidth="2.5" />
      <rect x="52" y="3" width="3" height="6" rx="0.5" strokeWidth="2" />
      {/* Arms pressing up */}
      <path d="M26 20 L22 14 L20 6" strokeWidth="3" fill="none" />
      <path d="M38 20 L42 14 L44 6" strokeWidth="3" fill="none" />
      {/* Torso */}
      <path d="M28 22 L29 38" strokeWidth="3.5" />
      <path d="M36 22 L35 38" strokeWidth="3.5" />
      <path d="M29 38 Q32 40, 35 38" strokeWidth="3" />
      {/* Split jerk stance - front leg bent, back leg extended */}
      <path d="M29 38 L18 50" strokeWidth="3.5" />
      <path d="M18 50 L16 56" strokeWidth="3.5" />
      <line x1="16" y1="56" x2="10" y2="58" strokeWidth="3" />
      <line x1="10" y1="58" x2="6" y2="58" strokeWidth="3" />
      <path d="M35 38 L46 50" strokeWidth="3.5" />
      <path d="M46 50 L50 56" strokeWidth="3.5" />
      <line x1="50" y1="56" x2="54" y2="58" strokeWidth="3" />
      <line x1="54" y1="58" x2="58" y2="58" strokeWidth="3" />
    </svg>
  )
}

// 스내치 - 정면, 와이드그립 오버헤드, ATG (고관절 < 무릎)
export function SnatchIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="32" cy="12" r="5" strokeWidth="3" />
      {/* Wide barbell overhead */}
      <line x1="4" y1="4" x2="60" y2="4" strokeWidth="3" />
      <rect x="0" y="0" width="4" height="8" rx="1" strokeWidth="2.5" />
      <rect x="60" y="0" width="4" height="8" rx="1" strokeWidth="2.5" />
      {/* Arms wide V */}
      <path d="M26 18 L16 10 L12 4" strokeWidth="3" fill="none" />
      <path d="M38 18 L48 10 L52 4" strokeWidth="3" fill="none" />
      {/* Torso drops low */}
      <path d="M28 20 L25 44" strokeWidth="3.5" />
      <path d="M36 20 L39 44" strokeWidth="3.5" />
      {/* Hips at 44 */}
      <path d="M25 44 Q32 48, 39 44" strokeWidth="3" />
      {/* Thigh UP to knee (~38), shin down */}
      <path d="M25 44 C20 44, 14 40, 12 38" strokeWidth="3.5" />
      <path d="M12 38 C12 46, 14 52, 16 56" strokeWidth="3.5" />
      <line x1="16" y1="56" x2="10" y2="58" strokeWidth="3" />
      <path d="M39 44 C44 44, 50 40, 52 38" strokeWidth="3.5" />
      <path d="M52 38 C52 46, 50 52, 48 56" strokeWidth="3.5" />
      <line x1="48" y1="56" x2="54" y2="58" strokeWidth="3" />
    </svg>
  )
}

// 파워스내치 - 정면, 와이드그립 오버헤드, 하이캐치(쿼터스쿼트)
export function PowerSnatchIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="32" cy="14" r="5" strokeWidth="3" />
      {/* Wide barbell overhead */}
      <line x1="4" y1="6" x2="60" y2="6" strokeWidth="3" />
      <rect x="0" y="2" width="4" height="8" rx="1" strokeWidth="2.5" />
      <rect x="60" y="2" width="4" height="8" rx="1" strokeWidth="2.5" />
      {/* Arms wide V */}
      <path d="M26 20 L18 12 L14 6" strokeWidth="3" fill="none" />
      <path d="M38 20 L46 12 L50 6" strokeWidth="3" fill="none" />
      {/* Torso - more upright */}
      <path d="M28 22 L28 38" strokeWidth="3.5" />
      <path d="M36 22 L36 38" strokeWidth="3.5" />
      <path d="M28 38 Q32 40, 36 38" strokeWidth="3" />
      {/* Quarter squat legs (higher catch) */}
      <path d="M28 38 L24 48" strokeWidth="3.5" />
      <path d="M24 48 L24 56" strokeWidth="3.5" />
      <line x1="24" y1="56" x2="20" y2="58" strokeWidth="3" />
      <line x1="20" y1="58" x2="16" y2="58" strokeWidth="3" />
      <path d="M36 38 L40 48" strokeWidth="3.5" />
      <path d="M40 48 L40 56" strokeWidth="3.5" />
      <line x1="40" y1="56" x2="44" y2="58" strokeWidth="3" />
      <line x1="44" y1="58" x2="48" y2="58" strokeWidth="3" />
    </svg>
  )
}

// 푸시프레스 - 정면, 무릎 딥 + 오버헤드 드라이브
export function PushPressIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="32" cy="16" r="5" strokeWidth="3" />
      {/* Barbell overhead - slightly lower than strict press */}
      <line x1="8" y1="8" x2="56" y2="8" strokeWidth="3" />
      <rect x="4" y="4" width="4" height="8" rx="1" strokeWidth="2.5" />
      <rect x="9" y="5" width="3" height="6" rx="0.5" strokeWidth="2" />
      <rect x="56" y="4" width="4" height="8" rx="1" strokeWidth="2.5" />
      <rect x="52" y="5" width="3" height="6" rx="0.5" strokeWidth="2" />
      {/* Arms pressing - slight bend showing drive */}
      <path d="M26 22 L22 16 L20 8" strokeWidth="3" fill="none" />
      <path d="M38 22 L42 16 L44 8" strokeWidth="3" fill="none" />
      {/* Torso */}
      <path d="M28 24 L28 40" strokeWidth="3.5" />
      <path d="M36 24 L36 40" strokeWidth="3.5" />
      <path d="M28 40 Q32 42, 36 40" strokeWidth="3" />
      {/* Legs - slight knee bend (dip drive) */}
      <path d="M28 40 L25 50" strokeWidth="3.5" />
      <path d="M25 50 L26 58" strokeWidth="3.5" />
      <line x1="26" y1="58" x2="22" y2="58" strokeWidth="3" />
      <path d="M36 40 L39 50" strokeWidth="3.5" />
      <path d="M39 50 L38 58" strokeWidth="3.5" />
      <line x1="38" y1="58" x2="42" y2="58" strokeWidth="3" />
      {/* Upward motion lines */}
      <line x1="14" y1="30" x2="14" y2="22" strokeWidth="1.5" strokeDasharray="2 3" />
      <line x1="50" y1="30" x2="50" y2="22" strokeWidth="1.5" strokeDasharray="2 3" />
    </svg>
  )
}

// 푸시저크 - 정면, 오버헤드 + 스플릿 스탠스
export function JerkIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="32" cy="14" r="5" strokeWidth="3" />
      <line x1="8" y1="6" x2="56" y2="6" strokeWidth="3" />
      <rect x="4" y="2" width="4" height="8" rx="1" strokeWidth="2.5" />
      <rect x="9" y="3" width="3" height="6" rx="0.5" strokeWidth="2" />
      <rect x="56" y="2" width="4" height="8" rx="1" strokeWidth="2.5" />
      <rect x="52" y="3" width="3" height="6" rx="0.5" strokeWidth="2" />
      <path d="M26 20 L20 12 L18 6" strokeWidth="3" fill="none" />
      <path d="M38 20 L44 12 L46 6" strokeWidth="3" fill="none" />
      <path d="M28 22 L28 38" strokeWidth="3.5" />
      <path d="M36 22 L36 38" strokeWidth="3.5" />
      <path d="M28 38 Q32 40, 36 38" strokeWidth="3" />
      {/* Split stance - wide, front knee bent */}
      <path d="M28 38 L18 50" strokeWidth="3.5" />
      <path d="M18 50 L16 56" strokeWidth="3.5" />
      <line x1="16" y1="56" x2="10" y2="58" strokeWidth="3" />
      <line x1="10" y1="58" x2="6" y2="58" strokeWidth="3" />
      <path d="M36 38 L46 50" strokeWidth="3.5" />
      <path d="M46 50 L50 56" strokeWidth="3.5" />
      <line x1="50" y1="56" x2="54" y2="58" strokeWidth="3" />
      <line x1="54" y1="58" x2="58" y2="58" strokeWidth="3" />
    </svg>
  )
}

// 기본 아이콘 (덤벨)
export function DefaultExerciseIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <line x1="20" y1="32" x2="44" y2="32" strokeWidth="4" />
      <rect x="8" y="24" width="12" height="16" rx="3" strokeWidth="3" />
      <rect x="44" y="24" width="12" height="16" rx="3" strokeWidth="3" />
    </svg>
  )
}

// 로잉 - 옆모습, 에르고미터에 앉아 핸들 당기기
export function RowingIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      {/* Head */}
      <circle cx="22" cy="16" r="5" strokeWidth="3" />
      {/* Torso - leaning back slightly */}
      <path d="M24 21 L30 38" strokeWidth="3.5" />
      {/* Arms pulling handle */}
      <path d="M24 24 L16 28" strokeWidth="3" />
      <path d="M16 28 L10 26" strokeWidth="3" />
      {/* Handle + chain */}
      <line x1="10" y1="24" x2="10" y2="28" strokeWidth="2.5" />
      <line x1="10" y1="26" x2="46" y2="26" strokeWidth="1.5" strokeDasharray="2 2" />
      {/* Seat */}
      <rect x="27" y="38" width="8" height="3" rx="1.5" strokeWidth="2" />
      {/* Rail */}
      <line x1="16" y1="44" x2="56" y2="44" strokeWidth="2.5" />
      {/* Legs - bent, feet on footplate */}
      <path d="M30 38 L36 32" strokeWidth="3" />
      <path d="M36 32 L42 38" strokeWidth="3" />
      {/* Footplate */}
      <line x1="42" y1="34" x2="42" y2="42" strokeWidth="2.5" />
      {/* Flywheel housing */}
      <circle cx="50" cy="34" r="6" strokeWidth="2.5" />
      <circle cx="50" cy="34" r="2" strokeWidth="2" />
      {/* Front leg */}
      <line x1="54" y1="44" x2="56" y2="54" strokeWidth="2.5" />
      {/* Rear leg */}
      <line x1="18" y1="44" x2="16" y2="54" strokeWidth="2.5" />
    </svg>
  )
}

// 스키에르그 - 정면, 서서 핸들을 위에서 아래로 당기기
export function SkiErgIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      {/* Head */}
      <circle cx="32" cy="10" r="5" strokeWidth="3" />
      {/* Arms pulling down - V shape */}
      <path d="M26 18 L22 8" strokeWidth="3" />
      <path d="M38 18 L42 8" strokeWidth="3" />
      {/* Handles */}
      <line x1="20" y1="6" x2="24" y2="10" strokeWidth="2.5" />
      <line x1="40" y1="10" x2="44" y2="6" strokeWidth="2.5" />
      {/* Cables up to machine */}
      <line x1="22" y1="8" x2="28" y2="2" strokeWidth="1.5" strokeDasharray="2 2" />
      <line x1="42" y1="8" x2="36" y2="2" strokeWidth="1.5" strokeDasharray="2 2" />
      {/* Torso - slight forward lean */}
      <path d="M28 18 L27 36" strokeWidth="3.5" />
      <path d="M36 18 L37 36" strokeWidth="3.5" />
      {/* Hips */}
      <path d="M27 36 Q32 38, 37 36" strokeWidth="3" />
      {/* Legs - slight bend */}
      <path d="M27 36 L25 48" strokeWidth="3.5" />
      <path d="M25 48 L26 56" strokeWidth="3.5" />
      <line x1="26" y1="56" x2="22" y2="58" strokeWidth="3" />
      <path d="M37 36 L39 48" strokeWidth="3.5" />
      <path d="M39 48 L38 56" strokeWidth="3.5" />
      <line x1="38" y1="56" x2="42" y2="58" strokeWidth="3" />
      {/* Machine base */}
      <rect x="29" y="0" width="6" height="4" rx="1" strokeWidth="2" />
    </svg>
  )
}

// 러닝 - 옆모습, 달리는 자세
export function RunningIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      {/* Head */}
      <circle cx="30" cy="8" r="5" strokeWidth="3" />
      {/* Torso - forward lean */}
      <path d="M30 13 L34 32" strokeWidth="3.5" />
      {/* Front arm - swinging back */}
      <path d="M32 20 L40 28" strokeWidth="3" />
      <path d="M40 28 L44 24" strokeWidth="3" />
      {/* Back arm - swinging forward */}
      <path d="M31 22 L22 18" strokeWidth="3" />
      <path d="M22 18 L18 20" strokeWidth="3" />
      {/* Hips */}
      <path d="M34 32 L36 34" strokeWidth="3" />
      {/* Front leg - extended back */}
      <path d="M34 32 L44 42" strokeWidth="3.5" />
      <path d="M44 42 L50 52" strokeWidth="3.5" />
      <line x1="50" y1="52" x2="54" y2="54" strokeWidth="3" />
      {/* Back leg - knee drive forward */}
      <path d="M36 34 L26 42" strokeWidth="3.5" />
      <path d="M26 42 L28 50" strokeWidth="3.5" />
      <line x1="28" y1="50" x2="24" y2="52" strokeWidth="3" />
      {/* Ground */}
      <line x1="16" y1="56" x2="58" y2="56" strokeWidth="1.5" strokeDasharray="3 3" />
    </svg>
  )
}

const EQUIPMENT_ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  'Rowing': RowingIcon,
  'rowing': RowingIcon,
  '로잉': RowingIcon,
  'Ski-erg': SkiErgIcon,
  'ski-erg': SkiErgIcon,
  'Ski Erg': SkiErgIcon,
  '스키에르그': SkiErgIcon,
  'Running': RunningIcon,
  'running': RunningIcon,
  '러닝': RunningIcon,
}

export function getEquipmentIcon(equipment: string): React.ComponentType<{ size?: number }> | null {
  return EQUIPMENT_ICON_MAP[equipment] ?? null
}

const ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  '백스쿼트': BackSquatIcon,
  '프론트스쿼트': FrontSquatIcon,
  '데드리프트': DeadliftIcon,
  '벤치프레스': BenchIcon,
  '숄더프레스': OverheadIcon,
  '푸시프레스': PushPressIcon,
  '클린': CleanIcon,
  '파워클린': PowerCleanIcon,
  '클린앤저크': CleanAndJerkIcon,
  '푸시저크': JerkIcon,
  '스내치': SnatchIcon,
  '파워스내치': PowerSnatchIcon,
}

export function getExerciseIcon(exerciseName: string): React.ComponentType<{ size?: number }> {
  return ICON_MAP[exerciseName] ?? DefaultExerciseIcon
}
