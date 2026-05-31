# 벤치마크 WOD 기록 기능 설계

## 개요
PR 탭에 WOD 서브탭을 추가하여 Named WOD / Open WOD 기록을 히스토리로 관리한다.

## PR 탭 구조 변경
```
PR 탭 상단: [기록] [WOD] ← 서브탭
  기록 탭: 1RM / nRM / 페이스 (기존 그대로)
  WOD 탭: Named WOD / Open WOD
```

## DB 테이블: `wod_records`
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK, default gen_random_uuid() |
| user_id | UUID | FK → users |
| wod_type | text | `named` / `open` |
| wod_name | text | "Fran", "25.1" 등 |
| score_type | text | `time` / `amrap` / `reps` |
| time_seconds | int | For Time 결과 (초) |
| rounds | int | AMRAP 라운드 |
| extra_reps | int | AMRAP 잔여 렙 |
| reps | int | 총 렙 (타임캡 초과 시) |
| memo | text | 메모 |
| recorded_at | date | 기록 날짜 |
| created_at | timestamptz | default now() |

## Named WOD 프리셋 (14개, 코드 상수)

### Girl WODs (11개)
| 이름 | 타입 | 설명 |
|------|------|------|
| Fran | time | 21-15-9: Thrusters (95/65lb) & Pull-ups |
| Grace | time | 30 Clean & Jerks (135/95lb) |
| Isabel | time | 30 Snatches (135/95lb) |
| Diane | time | 21-15-9: Deadlifts (225/155lb) & HSPU |
| Helen | time | 3 Rds: 400m Run, 21 KB Swings, 12 Pull-ups |
| Jackie | time | 1000m Row, 50 Thrusters (45/35lb), 30 Pull-ups |
| Karen | time | 150 Wall Ball Shots (20/14lb) |
| Annie | time | 50-40-30-20-10: DU & Sit-ups |
| Nancy | time | 5 Rds: 400m Run, 15 OHS (95/65lb) |
| Cindy | amrap | AMRAP 20: 5 Pull-ups, 10 Push-ups, 15 Squats |
| Mary | amrap | AMRAP 20: 5 HSPU, 10 Pistols, 15 Pull-ups |

### Hero WODs (3개)
| 이름 | 타입 | 설명 |
|------|------|------|
| Murph | time | 1mi Run, 100 PU, 200 Push-ups, 300 Squats, 1mi Run |
| DT | time | 5 Rds: 12 DL, 9 HPC, 6 PJ (155/105lb) |
| JT | time | 21-15-9: HSPU, Ring Dips, Push-ups |

+ 직접 추가: 이름 + 결과타입(time/amrap/reps) 선택

## Open WOD
- 프리셋 없음, 유저가 직접 입력
- WOD 이름 (예: "25.1") + 결과타입 선택 + 결과 입력

## WOD 탭 UI

### 목록 화면
- **Named WOD 섹션**: 프리셋 그리드, 기록 있으면 최고기록(PR) 표시, + 커스텀 추가 버튼
- **Open WOD 섹션**: 기록된 것만 리스트 + 추가 버튼

### 기록 추가 (모달)
- WOD 정보 표시 (이름, 설명)
- 결과타입에 따른 입력 UI:
  - time: mm:ss 입력
  - amrap: rounds + extra_reps 입력
  - reps: 숫자 입력
- 날짜 선택 (기본 오늘)
- 메모 (선택)

### 히스토리
- WOD 이름 탭 → 해당 WOD 전체 기록 목록
- PR(최고기록) 하이라이트 표시
- 삭제 가능

## Rx/Scaled 구분
- 불필요, 넣지 않음
