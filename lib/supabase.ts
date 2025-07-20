import { createClient } from "@supabase/supabase-js"

// Get environment variables with fallbacks and validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Validate required environment variables
if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable")
}

if (!supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable")
}

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client with service role (for admin operations)
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : supabase // Fallback to regular client if service key is not available

// Types for our database tables
export interface Resident {
  id: string
  name: string
  house_number: string
  address?: string
  phone?: string
  email?: string
  status: "active" | "inactive"
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  resident_id: string
  amount: number
  payment_date: string
  due_date: string
  status: "pending" | "paid" | "overdue"
  payment_method?: string
  notes?: string
  created_at: string
  updated_at: string
  resident?: Resident
}

export interface Setting {
  id: string
  key: string
  value: string
  description?: string
  created_at: string
  updated_at: string
}

export interface AdminUser {
  id: string
  email: string
  name: string
  role: "admin" | "super_admin"
  is_active: boolean
  last_login?: string
  created_at: string
  updated_at: string
}

export interface ActivityLog {
  id: string
  user_id?: string
  action: string
  table_name?: string
  record_id?: string
  old_values?: any
  new_values?: any
  ip_address?: string
  user_agent?: string
  created_at: string
}

export interface DashboardStats {
  total_residents: number
  paid_this_month: number
  unpaid_this_month: number
  total_income_this_month: number
  target_monthly_income: number
}
