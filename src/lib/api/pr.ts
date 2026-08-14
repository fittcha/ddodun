import { apiFetch } from './http'

// --- 1RM ---
export interface OneRM {
  id: string
  user_id: string
  exercise_name: string
  weight: number | null
  weight_unit: string
  updated_at: string
}

export async function getAll1RM(): Promise<OneRM[]> {
  const res = await apiFetch('/api/pr/onerm')
  if (!res.ok) throw new Error(`getAll1RM: ${res.status}`)
  const { records } = await res.json()
  return records
}

export async function upsert1RM(exerciseName: string, weight: number | null, weightUnit: string): Promise<OneRM> {
  const res = await apiFetch('/api/pr/onerm', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ exerciseName, weight, weightUnit }),
  })
  if (!res.ok) throw new Error(`upsert1RM: ${res.status}`)
  const { record } = await res.json()
  return record
}

export async function delete1RM(id: string): Promise<void> {
  const res = await apiFetch(`/api/pr/onerm?id=${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`delete1RM: ${res.status}`)
}

// --- nRM ---
export interface NRM {
  id: string
  user_id: string
  exercise_name: string
  rep_max: number
  weight: number | null
  weight_unit: string
  updated_at: string
}

export async function getAllNRM(): Promise<NRM[]> {
  const res = await apiFetch('/api/pr/nrm')
  if (!res.ok) throw new Error(`getAllNRM: ${res.status}`)
  const { records } = await res.json()
  return records
}

export async function upsertNRM(exerciseName: string, repMax: number, weight: number | null, weightUnit: string): Promise<NRM> {
  const res = await apiFetch('/api/pr/nrm', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ exerciseName, repMax, weight, weightUnit }),
  })
  if (!res.ok) throw new Error(`upsertNRM: ${res.status}`)
  const { record } = await res.json()
  return record
}

export async function deleteNRM(id: string): Promise<void> {
  const res = await apiFetch(`/api/pr/nrm?id=${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`deleteNRM: ${res.status}`)
}

// --- Pace Records ---
export interface PaceRecord {
  id: string
  user_id: string
  equipment: string
  distance: string
  time_seconds: number | null
  updated_at: string
}

export async function getAllPaceRecords(): Promise<PaceRecord[]> {
  const res = await apiFetch('/api/pr/pace')
  if (!res.ok) throw new Error(`getAllPaceRecords: ${res.status}`)
  const { records } = await res.json()
  return records
}

export async function upsertPaceRecord(equipment: string, distance: string, timeSeconds: number | null): Promise<PaceRecord> {
  const res = await apiFetch('/api/pr/pace', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ equipment, distance, timeSeconds }),
  })
  if (!res.ok) throw new Error(`upsertPaceRecord: ${res.status}`)
  const { record } = await res.json()
  return record
}

export async function deletePaceRecord(id: string): Promise<void> {
  const res = await apiFetch(`/api/pr/pace?id=${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`deletePaceRecord: ${res.status}`)
}
