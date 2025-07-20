import { supabase } from "./supabase"
import type { DashboardStats } from "./supabase"

// Get current month dashboard statistics
export async function getDashboardStats(): Promise<DashboardStats> {
  const { data, error } = await supabase.from("current_month_stats").select("*").single()

  if (error) throw error
  return data
}

// Get monthly payment statistics
export async function getMonthlyStats(limit = 12) {
  const { data, error } = await supabase.from("monthly_payment_stats").select("*").limit(limit)

  if (error) throw error
  return data
}

// Get payment trends for charts
export async function getPaymentTrends(months = 6) {
  const { data, error } = await supabase
    .from("monthly_payment_stats")
    .select("*")
    .limit(months)
    .order("month", { ascending: true })

  if (error) throw error
  return data
}

// Get resident status distribution
export async function getResidentStatusDistribution() {
  const { data, error } = await supabase.from("residents").select("status")

  if (error) throw error

  const distribution = data.reduce(
    (acc, resident) => {
      acc[resident.status] = (acc[resident.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return distribution
}

// Get payment status distribution for current month
export async function getCurrentMonthPaymentDistribution() {
  const currentMonth = new Date().toISOString().slice(0, 7)

  const { data, error } = await supabase
    .from("payments")
    .select("status")
    .gte("due_date", `${currentMonth}-01`)
    .lte("due_date", `${currentMonth}-31`)

  if (error) throw error

  const distribution = data.reduce(
    (acc, payment) => {
      acc[payment.status] = (acc[payment.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return distribution
}
