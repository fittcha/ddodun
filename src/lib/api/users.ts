import { supabase } from '@/lib/supabase'

export interface User {
  id: string
  username: string
  pin_hash: string | null
  created_by: string | null
  created_at: string
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single()
  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function setUserPin(userId: string, pin: string) {
  const { error } = await supabase
    .from('users')
    .update({ pin_hash: pin })
    .eq('id', userId)
  if (error) throw error
}

export async function verifyPin(userId: string, pin: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('users')
    .select('pin_hash')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data.pin_hash === pin
}
