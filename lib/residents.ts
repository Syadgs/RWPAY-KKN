import { supabase } from "./supabase"
import type { Resident } from "./supabase"

// Create a new resident
export async function createResident(resident: Omit<Resident, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase.from("residents").insert([resident]).select().single()

  if (error) throw error
  return data
}

// Get all residents with optional filtering
export async function getResidents(filters?: {
  status?: "active" | "inactive"
  search?: string
}) {
  let query = supabase.from("residents").select("*").order("name")

  if (filters?.status) {
    query = query.eq("status", filters.status)
  }

  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,house_number.ilike.%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

// Get a single resident by ID
export async function getResident(id: string) {
  const { data, error } = await supabase.from("residents").select("*").eq("id", id).single()

  if (error) throw error
  return data
}

// Update a resident
export async function updateResident(id: string, updates: Partial<Resident>) {
  const { data, error } = await supabase.from("residents").update(updates).eq("id", id).select().single()

  if (error) throw error
  return data
}

// Delete a resident
export async function deleteResident(id: string) {
  const { error } = await supabase.from("residents").delete().eq("id", id)

  if (error) throw error
}

// Get resident payment summary
export async function getResidentPaymentSummary() {
  const { data, error } = await supabase.from("resident_payment_summary").select("*").order("name")

  if (error) throw error
  return data
}

// Check if house number is available
export async function isHouseNumberAvailable(houseNumber: string, excludeId?: string) {
  let query = supabase.from("residents").select("id").eq("house_number", houseNumber)

  if (excludeId) {
    query = query.neq("id", excludeId)
  }

  const { data, error } = await query

  if (error) throw error
  return data.length === 0
}
