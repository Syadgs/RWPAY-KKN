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
  status?: "pending" | "paid" | "overdue"
  payment_type?: "LPS" | "PAB"
  rt?: string
  resident_id?: string
  month?: string
}) {
  let query = supabase
    .from("payments")
    .select(`
      *,
      resident:residents(*)
    `)
    .order("payment_date", { ascending: false })

  if (filters?.status) {
    query = query.eq("status", filters.status)
  }

  if (filters?.payment_type) {
    query = query.eq("payment_type", filters.payment_type)
  }

  if (filters?.resident_id) {
    query = query.eq("resident_id", filters.resident_id)
  }

  if (filters?.month) {
    // 1. Ambil tahun dan bulan dari string 'YYYY-MM'
    const [year, month] = filters.month.split('-').map(Number);

    // 2. Tentukan tanggal awal bulan (selalu tanggal 1)
    const startDate = new Date(year, month - 1, 1).toISOString();

    // 3. Tentukan tanggal akhir bulan dengan benar
    // Caranya: pergi ke bulan berikutnya (month), lalu ambil hari ke-0 (hari terakhir bulan sebelumnya)
    const endDate = new Date(year, month, 0).toISOString();

    // 4. Terapkan filter ke query Supabase
    query = query.gte("due_date", startDate).lte("due_date", endDate);
}

  const { data, error } = await query

  if (error) throw error

  // Filter by RT if specified
  if (filters?.rt) {
    return data.filter((payment) => payment.resident?.rt === filters.rt)
  }

  return data
}

// Get payments for current month
export async function getCurrentMonthPayments() {
  const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
  return getPayments({ month: currentMonth })
}

// Get payments by month and year
export async function getPaymentsByMonth(year: number, month: number) {
  const monthStr = `${year}-${month.toString().padStart(2, "0")}`
  return getPayments({ month: monthStr })
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
export async function markPaymentAsPaid(id: string, paymentMethod: string, notes?: string) {
  const updates = {
    status: "paid" as const,
    payment_method: paymentMethod,
    notes,
    invoice_number: `INV-${Date.now()}`,
    invoice_date: new Date().toISOString().split("T")[0],
  }

  return updatePayment(id, updates)
}

// Get payment statistics for a specific month
export async function getPaymentStats(filters?: { rt?: string; month?: string }) {
  const month = filters?.month || new Date().toISOString().slice(0, 7)
  const payments = await getPayments({ month, rt: filters?.rt })

  const stats = {
    total: payments.length,
    paid: payments.filter((p) => p.status === "paid").length,
    pending: payments.filter((p) => p.status === "pending").length,
    overdue: payments.filter((p) => p.status === "overdue").length,
    lps_total: payments.filter((p) => p.payment_type === "LPS").length,
    pab_total: payments.filter((p) => p.payment_type === "PAB").length,
    lps_paid: payments.filter((p) => p.payment_type === "LPS" && p.status === "paid").length,
    pab_paid: payments.filter((p) => p.payment_type === "PAB" && p.status === "paid").length,
    total_amount: payments.reduce((sum, p) => sum + p.amount, 0),
    paid_amount: payments.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0),
    pending_amount: payments.filter((p) => p.status === "pending").reduce((sum, p) => sum + p.amount, 0),
    overdue_amount: payments.filter((p) => p.status === "overdue").reduce((sum, p) => sum + p.amount, 0),
  }

  return stats
}

// Get payments by resident
export async function getPaymentsByResident(residentId: string, limit?: number) {
  let query = supabase
    .from("payments")
    .select(`
      *,
      resident:residents(*)
    `)
    .eq("resident_id", residentId)
    .order("payment_date", { ascending: false })

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

// Get recent payments
export async function getRecentPayments(limit = 10) {
  const { data, error } = await supabase
    .from("payments")
    .select(`
      *,
      resident:residents(*)
    `)
    .eq("status", "paid")
    .order("payment_date", { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

// Get unpaid residents for current month
export async function getUnpaidResidents() {
  const currentMonth = new Date().toISOString().slice(0, 7)

  const { data, error } = await supabase
    .from("payments")
    .select(`
      *,
      resident:residents(*)
    `)
    .in("status", ["pending", "overdue"])
    .gte("due_date", `${currentMonth}-01`)
    .lte("due_date", `${currentMonth}-31`)
    .order("due_date", { ascending: true })

  if (error) throw error
  return data
}

// Generate monthly payments for all active residents
export async function generateMonthlyPayments(year: number, month: number) {
  try {
    const monthStr = `${year}-${month.toString().padStart(2, "0")}`

    // Get all active residents
    const { data: residents, error: residentsError } = await supabase
      .from("residents")
      .select("*")
      .eq("status", "active")

    if (residentsError) throw residentsError

    // Check existing payments for this month
    const existingPayments = await getPayments({ month: monthStr })
    const existingPaymentMap = new Set(existingPayments.map((p) => `${p.resident_id}-${p.payment_type}`))

    const newPayments = []
    const dueDate = `${monthStr}-10` // Due on 10th of each month

    for (const resident of residents) {
      // Generate LPS payment if not exists
      if (!existingPaymentMap.has(`${resident.id}-LPS`)) {
        newPayments.push({
          resident_id: resident.id,
          payment_type: "LPS",
          amount: 50000, // Default LPS amount
          payment_date: dueDate,
          due_date: dueDate,
          status: "pending",
          notes: `Iuran LPS bulan ${new Date(monthStr).toLocaleDateString("id-ID", {
            month: "long",
            year: "numeric",
          })}`,
        })
      }

      // Generate PAB payment if not exists
      if (!existingPaymentMap.has(`${resident.id}-PAB`)) {
        newPayments.push({
          resident_id: resident.id,
          payment_type: "PAB",
          amount: 0, // Will be calculated when meter reading is input
          payment_date: dueDate,
          due_date: dueDate,
          status: "pending",
          notes: `Iuran PAB bulan ${new Date(monthStr).toLocaleDateString("id-ID", {
            month: "long",
            year: "numeric",
          })}`,
        })
      }
    }

    if (newPayments.length > 0) {
      const { error: insertError } = await supabase.from("payments").insert(newPayments)
      if (insertError) throw insertError
    }

    return {
      generated: newPayments.length,
      residents: residents.length,
      month: monthStr,
    }
  } catch (error) {
    console.error("Error generating monthly payments:", error)
    throw error
  }
}

// Mark overdue payments
export async function markOverduePayments() {
  try {
    const today = new Date().toISOString().split("T")[0]

    const { error } = await supabase
      .from("payments")
      .update({ status: "overdue" })
      .eq("status", "pending")
      .lt("due_date", today)

    if (error) throw error

    return true
  } catch (error) {
    console.error("Error marking overdue payments:", error)
    throw error
  }
}

// Get payment history for dashboard
export async function getPaymentHistory(months = 6) {
  const history = []
  const currentDate = new Date()

  for (let i = 0; i < months; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
    const monthStr = date.toISOString().slice(0, 7)
    const stats = await getPaymentStats({ month: monthStr })

    history.push({
      month: monthStr,
      monthName: date.toLocaleDateString("id-ID", { month: "long", year: "numeric" }),
      ...stats,
    })
  }

  return history.reverse() // Show oldest first
}
