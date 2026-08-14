import { apiFetch } from './http'

export interface Competition {
  id: string
  date: string
  user_id: string
  name: string
  team_name: string | null
  team_members: string | null
  notes: string | null
  created_at: string
}

export async function getCompetitionsByMonth(year: number, month: number): Promise<Competition[]> {
  const res = await apiFetch(`/api/competitions?year=${year}&month=${month}`)
  if (!res.ok) throw new Error(`getCompetitionsByMonth: ${res.status}`)
  const { competitions } = await res.json()
  return competitions
}

export async function getCompetitionByDate(date: string): Promise<Competition | null> {
  const res = await apiFetch(`/api/competitions?date=${date}`)
  if (!res.ok) throw new Error(`getCompetitionByDate: ${res.status}`)
  const { competition } = await res.json()
  return competition
}

export async function createCompetition(comp: Omit<Competition, 'id' | 'created_at' | 'user_id'>): Promise<Competition> {
  const res = await apiFetch('/api/competitions', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(comp),
  })
  if (!res.ok) throw new Error(`createCompetition: ${res.status}`)
  const { competition } = await res.json()
  return competition
}

export async function updateCompetition(id: string, comp: Partial<Competition>): Promise<Competition> {
  const res = await apiFetch(`/api/competitions?id=${id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(comp),
  })
  if (!res.ok) throw new Error(`updateCompetition: ${res.status}`)
  const { competition } = await res.json()
  return competition
}

export async function deleteCompetition(id: string): Promise<void> {
  const res = await apiFetch(`/api/competitions?id=${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`deleteCompetition: ${res.status}`)
}
