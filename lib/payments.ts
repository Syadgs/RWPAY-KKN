import { supabase } from "./supabase"
import type { Payment } from "./supabase"

// Create a new payment
export async function createPayment(payment: Omit<Payment, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase
    .from("payments")
    .insert([payment])
    .select(`
      *,
      resident:residents(*)
    `)
    .single()

  if (error) throw error
  return data
}

// Get all payments with optional filtering
export async function getPayments(filters?: {
  resident_id?: string
  status?: "pending" | "paid" | "overdue"
  month?: string
  year?: string
}) {
  let query = supabase
    .from("payments")
    .select(`
      *,
      resident:residents(*)
    `)
    .order("payment_date", { ascending: false })

  if (filters?.resident_id) {
    query = query.eq("resident_id", filters.resident_id)
  }

  if (filters?.status) {
    query = query.eq("status", filters.status)
  }

  if (filters?.month && filters?.year) {
    const startDate = `${filters.year}-${filters.month.padStart(2, "0")}-01`
    const endDate = `${filters.year}-${filters.month.padStart(2, "0")}-31`
    query = query.gte("due_date", startDate).lte("due_date", endDate)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

// Get a single payment by ID
export async function getPayment(id: string) {
  const { data, error } = await supabase
    .from("payments")
    .select(`
      *,
      resident:residents(*)
    `)
    .eq("id", id)
    .single()

  if (error) throw error
  return data
}

// Update a payment
export async function updatePayment(id: string, updates: Partial<Payment>) {
  const { data, error } = await supabase
    .from("payments")
    .update(updates)
    .eq("id", id)
    .select(`
      *,
      resident:residents(*)
    `)
    .single()

  if (error) throw error
  return data
}

// Delete a payment
export async function deletePayment(id: string) {
  const { error } = await supabase.from("payments").delete().eq("id", id)

  if (error) throw error
}

// Mark payment as paid
export async function markPaymentAsPaid(id: string, paymentMethod?: string, notes?: string) {
  const updates: Partial<Payment> = {
    status: "paid",
    payment_date: new Date().toISOString().split("T")[0],
  }

  if (paymentMethod) updates.payment_method = paymentMethod
  if (notes) updates.notes = notes

  return updatePayment(id, updates)
}

// Get recent payments
export async function getRecentPayments(limit = 10) {
  const { data, error } = await supabase
    .from("payments")
    .select(`
      *,
      resident:residents(name, house_number)
    `)
    .eq("status", "paid")
    .order("payment_date", { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

// Get unpaid residents for current month
export async function getUnpaidResidents() {
  const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format

  const { data, error } = await supabase
    .from("payments")
    .select(`
      *,
      resident:residents(*)
    `)
    .gte("due_date", `${currentMonth}-01`)
    .lte("due_date", `${currentMonth}-31`)
    .in("status", ["pending", "overdue"])
    .order("due_date")

  if (error) throw error
  return data
}

// Create monthly payments for all active residents
export async function createMonthlyPayments(targetMonth: string) {
  const { data, error } = await supabase.rpc("create_monthly_payments", { target_month: targetMonth })

  if (error) throw error
  return data
}

// Update overdue payments
export async function updateOverduePayments() {
  const { data, error } = await supabase.rpc("update_overdue_payments")

  if (error) throw error
  return data
}

// Get payment statistics
export async function getPaymentStatistics(startDate: string, endDate: string) {
  const { data, error } = await supabase.rpc("get_payment_statistics", {
    start_date: startDate,
    end_date: endDate,
  })

  if (error) throw error
  return data[0]
}
