export interface DaySummaryBlock {
  key: string          // grouping id: coach → section("A"..), extra → extra_group_id
  header?: string      // display header text ("추가운동" for extras, section letter for coach)
  order?: string       // sort key: coach sections first, then extras by extra_order
  template_ids: string[]
  sig: string
  auto_snippet: string
}

export interface DaySummary {
  text: string
  blocks: DaySummaryBlock[]
}

export async function getDaySummary(date: string): Promise<DaySummary | null> {
  const res = await fetch(`/api/summaries/${date}`)
  if (!res.ok) throw new Error(`getDaySummary: ${res.status}`)
  const { summary } = await res.json()
  return summary
}

export async function upsertDaySummary(
  date: string,
  text: string,
  blocks: DaySummaryBlock[],
): Promise<DaySummary> {
  const res = await fetch(`/api/summaries/${date}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text, blocks }),
  })
  if (!res.ok) throw new Error(`upsertDaySummary: ${res.status}`)
  const { summary } = await res.json()
  return summary
}
