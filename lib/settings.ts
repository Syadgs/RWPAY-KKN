import { supabase } from "./supabase"

// Get all settings
export async function getSettings() {
  const { data, error } = await supabase.from("settings").select("*").order("key")

  if (error) throw error
  return data
}

// Get a single setting by key
export async function getSetting(key: string) {
  const { data, error } = await supabase.from("settings").select("*").eq("key", key).single()

  if (error) throw error
  return data
}

// Update or create a setting
export async function updateSetting(key: string, value: string, description?: string) {
  const { data, error } = await supabase.from("settings").upsert([{ key, value, description }]).select().single()

  if (error) throw error
  return data
}

// Update multiple settings at once
export async function updateSettings(settings: Array<{ key: string; value: string; description?: string }>) {
  const { data, error } = await supabase.from("settings").upsert(settings).select()

  if (error) throw error
  return data
}

// Delete a setting
export async function deleteSetting(key: string) {
  const { error } = await supabase.from("settings").delete().eq("key", key)

  if (error) throw error
}

// Get settings as key-value object
export async function getSettingsObject() {
  const settings = await getSettings()
  return settings.reduce(
    (acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    },
    {} as Record<string, string>,
  )
}

// Helper functions for specific settings
export async function getRWInfo() {
  const settings = await getSettingsObject()
  return {
    name: settings.rw_name || "RW 08 Sambiroto",
    address: settings.rw_address || "",
    phone: settings.rw_phone || "",
    email: settings.rw_email || "",
  }
}

export async function getPaymentSettings() {
  const settings = await getSettingsObject()
  return {
    monthlyDues: Number.parseInt(settings.monthly_dues || "100000"),
    dueDate: Number.parseInt(settings.due_date || "10"),
    lateFee: Number.parseInt(settings.late_fee || "5000"),
    currency: settings.currency || "IDR",
  }
}

export async function getNotificationSettings() {
  const settings = await getSettingsObject()
  return {
    emailReminders: settings.email_reminders === "true",
    smsReminders: settings.sms_reminders === "true",
    reminderDays: Number.parseInt(settings.reminder_days || "3"),
    overdueReminders: settings.overdue_reminders === "true",
  }
}
