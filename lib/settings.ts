import { supabase } from "./supabase"

// Get all settings
export async function getSettings() {
  const { data, error } = await supabase.from("settings").select("*").order("key")
  if (error) throw error
  return data
}

// Get a specific setting by key
export async function getSetting(key: string) {
  const { data, error } = await supabase.from("settings").select("*").eq("key", key).single()
  if (error) {
    if (error.code === "PGRST116") {
      return null // Setting not found, return null
    }
    throw error
  }
  return data
}

// Update or create a single setting
export async function updateSetting(key: string, value: string, description?: string) {
  const { data, error } = await supabase
    .from("settings")
    .upsert({ key, value, description, updated_at: new Date().toISOString() }, { onConflict: "key" })
    .select()
    .single()
  if (error) throw error
  return data
}

// Fungsi generik untuk memperbarui beberapa pengaturan sekaligus
export async function updateSettings(settingsToUpdate: { key: string; value: string; description?: string }[]) {
  const updates = settingsToUpdate.map(s => updateSetting(s.key, s.value, s.description));
  await Promise.all(updates);
}

// Delete a setting
export async function deleteSetting(key: string) {
  const { error } = await supabase.from("settings").delete().eq("key", key)
  if (error) throw error
}

// Menambahkan 'phone' dan 'email' agar cocok dengan state di page.tsx
export async function getRWInfo() {
  const settings = await getSettings();
  const settingsMap = settings.reduce((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {} as Record<string, string>);

  return {
    name: settingsMap.organization_name || "RT/RW",
    address: settingsMap.organization_address || "",
    phone: settingsMap.rw_phone || "",
    email: settingsMap.rw_email || "",
  };
}

// Mengubah properti agar cocok dengan state di page.tsx
export async function getNotificationSettings() {
  const settings = await getSettings();
  const settingsMap = settings.reduce((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {} as Record<string, string>);

  return {
    emailReminders: settingsMap.email_reminders === 'true',
    smsReminders: settingsMap.sms_reminders === 'true',
    reminderDays: Number.parseInt(settingsMap.reminder_days || "3"),
    overdueReminders: settingsMap.overdue_reminders === 'true',
  };
}

// --- PERBAIKAN: Menambahkan 'pabRate' ke dalam return object ---
export async function getPaymentSettings() {
  const settings = await getSettings()
  const settingsMap = settings.reduce((acc, setting) => {
    acc[setting.key] = setting.value
    return acc
  }, {} as Record<string, string>)

  return {
    monthlyDues: Number.parseInt(settingsMap.monthly_dues || "100000"),
    pabRate: Number.parseInt(settingsMap.pab_rate || "5000"), // Ditambahkan
    dueDate: Number.parseInt(settingsMap.due_date || "10"),
    lateFee: Number.parseInt(settingsMap.late_fee || "5000"),
    currency: settingsMap.currency || "IDR",
  }
}

// Fungsi ini mungkin masih digunakan di tempat lain, jadi kita biarkan
export async function updatePaymentSettings(settings: {
  monthlyDues?: number
  pabRate?: number
  lateFee?: number
  dueDate?: number
  organizationName?: string
  organizationAddress?: string
  bankAccount?: string
  bankName?: string
  accountHolder?: string
}) {
  const updates = []
  if (settings.monthlyDues !== undefined) updates.push(updateSetting("monthly_dues", settings.monthlyDues.toString(), "Iuran bulanan LPS"))
  if (settings.pabRate !== undefined) updates.push(updateSetting("pab_rate", settings.pabRate.toString(), "Tarif PAB per meter kubik"))
  if (settings.lateFee !== undefined) updates.push(updateSetting("late_fee", settings.lateFee.toString(), "Denda keterlambatan"))
  if (settings.dueDate !== undefined) updates.push(updateSetting("due_date", settings.dueDate.toString(), "Tanggal jatuh tempo setiap bulan"))
  if (settings.organizationName !== undefined) updates.push(updateSetting("organization_name", settings.organizationName, "Nama organisasi"))
  if (settings.organizationAddress !== undefined) updates.push(updateSetting("organization_address", settings.organizationAddress, "Alamat organisasi"))
  if (settings.bankAccount !== undefined) updates.push(updateSetting("bank_account", settings.bankAccount, "Nomor rekening"))
  if (settings.bankName !== undefined) updates.push(updateSetting("bank_name", settings.bankName, "Nama bank"))
  if (settings.accountHolder !== undefined) updates.push(updateSetting("account_holder", settings.accountHolder, "Nama pemegang rekening"))
  await Promise.all(updates)
}

// Menyesuaikan dan melengkapi semua key yang dibutuhkan
export async function initializeDefaultSettings() {
  const defaultSettings = [
    // Info Umum & Kontak
    { key: "organization_name", value: "RW 08 Sambiroto", description: "Nama organisasi" },
    { key: "organization_address", value: "Jl. Sambiroto Raya, Semarang", description: "Alamat organisasi" },
    { key: "rw_phone", value: "", description: "Nomor telepon kontak RW" },
    { key: "rw_email", value: "", description: "Alamat email kontak RW" },

    // Info Pembayaran (termasuk yang tidak ada di form, seperti pab_rate)
    { key: "monthly_dues", value: "100000", description: "Iuran bulanan" },
    { key: "pab_rate", value: "5000", description: "Tarif PAB per meter kubik" },
    { key: "due_date", value: "10", description: "Tanggal jatuh tempo setiap bulan" },
    { key: "late_fee", value: "5000", description: "Denda keterlambatan" },
    { key: "currency", value: "IDR", description: "Mata uang yang digunakan" },

    // Info Bank
    { key: "bank_account", value: "", description: "Nomor rekening" },
    { key: "bank_name", value: "", description: "Nama bank" },
    { key: "account_holder", value: "", description: "Nama pemegang rekening" },

    // Info Notifikasi
    { key: "email_reminders", value: "true", description: "Aktifkan pengingat via email" },
    { key: "sms_reminders", value: "false", description: "Aktifkan pengingat via SMS" },
    { key: "reminder_days", value: "3", description: "Jumlah hari sebelum jatuh tempo untuk mengirim pengingat" },
    { key: "overdue_reminders", value: "true", description: "Aktifkan pengingat untuk tunggakan" },
  ];

  for (const setting of defaultSettings) {
    const existing = await getSetting(setting.key)
    if (!existing) {
      await updateSetting(setting.key, setting.value, setting.description)
    }
  }
}

// Get system configuration
export async function getSystemConfig() {
  const settings = await getSettings()
  const config = settings.reduce((acc, setting) => {
    acc[setting.key] = {
      value: setting.value,
      description: setting.description,
      updated_at: setting.updated_at,
    }
    return acc
  }, {} as Record<string, { value: string; description?: string; updated_at: string }>)
  return config
}
