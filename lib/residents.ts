import { supabase } from "./supabase"
import type { Resident } from "./supabase"

// Get all residents with optional filtering
export async function getResidents(filters?: {
  status?: "active" | "inactive"
  rt?: string
  search?: string
}) {
  let query = supabase
    .from("residents")
    .select("*")
    .order("rt", { ascending: true })
    .order("house_number", { ascending: true })

  if (filters?.status) {
    query = query.eq("status", filters.status)
  }

  if (filters?.rt) {
    query = query.eq("rt", filters.rt)
  }

  const { data, error } = await query

  if (error) throw error

  // Apply search filter if provided
  if (filters?.search) {
    const searchTerm = filters.search.toLowerCase()
    return data.filter(
      (resident) =>
        resident.name.toLowerCase().includes(searchTerm) ||
        resident.house_number.toLowerCase().includes(searchTerm) ||
        resident.rt.toLowerCase().includes(searchTerm) ||
        (resident.address && resident.address.toLowerCase().includes(searchTerm)),
    )
  }

  return data
}

// Get a single resident by ID
export async function getResident(id: string) {
  const { data, error } = await supabase.from("residents").select("*").eq("id", id).single()

  if (error) throw error
  return data
}

// Create a new resident
export async function createResident(resident: Omit<Resident, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase.from("residents").insert([resident]).select("*").single()

  if (error) throw error
  return data
}

// Update a resident
export async function updateResident(id: string, updates: Partial<Resident>) {
  const { data, error } = await supabase.from("residents").update(updates).eq("id", id).select("*").single()

  if (error) throw error
  return data
}

// Delete a resident
export async function deleteResident(id: string) {
  const { error } = await supabase.from("residents").delete().eq("id", id)

  if (error) throw error
}

// Get residents by RT
export async function getResidentsByRT(rt: string) {
  return getResidents({ rt, status: "active" })
}

// Get resident statistics
export async function getResidentStats() {
  const { data, error } = await supabase.from("residents").select("status, rt")

  if (error) throw error

  const stats = {
    total: data.length,
    active: data.filter((r) => r.status === "active").length,
    inactive: data.filter((r) => r.status === "inactive").length,
    byRT: data.reduce(
      (acc, resident) => {
        const rt = resident.rt || "Unknown"
        acc[rt] = (acc[rt] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    ),
  }

  return stats
}

// Search residents
export async function searchResidents(searchTerm: string) {
  return getResidents({ search: searchTerm })
}

// Get residents with payment status for current month
export async function getResidentsWithPaymentStatus() {
  const currentMonth = new Date().toISOString().slice(0, 7)

  const { data: residents, error: residentsError } = await supabase
    .from("residents")
    .select("*")
    .eq("status", "active")
    .order("rt", { ascending: true })
    .order("house_number", { ascending: true })

  if (residentsError) throw residentsError

  const { data: payments, error: paymentsError } = await supabase
    .from("payments")
    .select("*")
    .gte("payment_date", `${currentMonth}-01`)
    .lte("payment_date", `${currentMonth}-31`)

  if (paymentsError) throw paymentsError

  // Combine residents with their payment status
  const residentsWithPayments = residents.map((resident) => {
    const lpsPayment = payments.find((p) => p.resident_id === resident.id && p.payment_type === "LPS")
    const pabPayment = payments.find((p) => p.resident_id === resident.id && p.payment_type === "PAB")

    return {
      ...resident,
      lps_payment: lpsPayment,
      pab_payment: pabPayment,
      payment_status: getPaymentStatus(lpsPayment, pabPayment),
    }
  })

  return residentsWithPayments
}

// Helper function to determine payment status
function getPaymentStatus(lpsPayment?: any, pabPayment?: any) {
  const lpsStatus = lpsPayment?.status === "paid"
  const pabStatus = pabPayment?.status === "paid"

  if (lpsStatus && pabStatus) return "paid"
  if (!lpsStatus && !pabStatus) return "unpaid"
  return "partial"
}

// Validate resident data
export function validateResidentData(resident: Partial<Resident>) {
  const errors: string[] = []

  if (!resident.name || resident.name.trim().length < 2) {
    errors.push("Nama harus diisi minimal 2 karakter")
  }

  if (!resident.house_number || resident.house_number.trim().length === 0) {
    errors.push("Nomor rumah harus diisi")
  }

  if (!resident.rt || resident.rt.trim().length === 0) {
    errors.push("RT harus diisi")
  }

  if (resident.email && !isValidEmail(resident.email)) {
    errors.push("Format email tidak valid")
  }

  if (resident.phone && !isValidPhone(resident.phone)) {
    errors.push("Format nomor telepon tidak valid")
  }

  return errors
}

// Helper functions for validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function isValidPhone(phone: string): boolean {
  // Indonesian phone number format
  const phoneRegex = /^(\+62|62|0)[0-9]{8,13}$/
  return phoneRegex.test(phone.replace(/[\s-]/g, ""))
}

// Get residents count by RT
export async function getResidentsCountByRT() {
  const { data, error } = await supabase.from("residents").select("rt").eq("status", "active")

  if (error) throw error

  const countByRT = data.reduce(
    (acc, resident) => {
      const rt = resident.rt || "Unknown"
      acc[rt] = (acc[rt] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return countByRT
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

// Get residents for export
export async function getResidentsForExport() {
  const { data, error } = await supabase
    .from("residents")
    .select("*")
    .order("rt", { ascending: true })
    .order("house_number", { ascending: true })

  if (error) throw error

  return data.map((resident) => ({
    RT: resident.rt,
    "No. Rumah": resident.house_number,
    Nama: resident.name,
    Alamat: resident.address || "-",
    Telepon: resident.phone || "-",
    Email: resident.email || "-",
    Status: resident.status === "active" ? "Aktif" : "Tidak Aktif",
    "Tanggal Daftar": new Date(resident.created_at).toLocaleDateString("id-ID"),
  }))
}
