"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  DollarSign,
  Settings,
  User,
  Bell,
  Shield,
  Database,
  FileText,
  Save,
  ArrowLeft,
  CheckCircle,
} from "lucide-react"
import Link from "next/link"
import { getRWInfo, getPaymentSettings, getNotificationSettings, updateSettings } from "@/lib/settings"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general")
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Form states
  const [rwInfo, setRwInfo] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
  })

  const [paymentSettings, setPaymentSettings] = useState({
    monthlyDues: 100000,
    dueDate: 10,
    lateFee: 5000,
    currency: "IDR",
  })

  const [notifications, setNotifications] = useState({
    emailReminders: true,
    smsReminders: false,
    reminderDays: 3,
    overdueReminders: true,
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const [rwData, paymentData, notificationData] = await Promise.all([
        getRWInfo(),
        getPaymentSettings(),
        getNotificationSettings(),
      ])

      setRwInfo(rwData)
      setPaymentSettings(paymentData)
      setNotifications(notificationData)
    } catch (error) {
      console.error("Error loading settings:", error)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const settingsToUpdate = [
        { key: "rw_name", value: rwInfo.name },
        { key: "rw_address", value: rwInfo.address },
        { key: "rw_phone", value: rwInfo.phone },
        { key: "rw_email", value: rwInfo.email },
        { key: "monthly_dues", value: paymentSettings.monthlyDues.toString() },
        { key: "due_date", value: paymentSettings.dueDate.toString() },
        { key: "late_fee", value: paymentSettings.lateFee.toString() },
        { key: "currency", value: paymentSettings.currency },
        { key: "email_reminders", value: notifications.emailReminders.toString() },
        { key: "sms_reminders", value: notifications.smsReminders.toString() },
        { key: "reminder_days", value: notifications.reminderDays.toString() },
        { key: "overdue_reminders", value: notifications.overdueReminders.toString() },
      ]

      await updateSettings(settingsToUpdate)

      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error) {
      console.error("Error saving settings:", error)
    } finally {
      setIsSaving(false)
    }
  }

  // Rest of the component remains the same...
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Kembali
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <Settings className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline">RW 08 - Sambiroto</Badge>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Alert */}
        {showSuccess && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">Pengaturan berhasil disimpan!</AlertDescription>
          </Alert>
        )}

        {/* Rest of the tabs and content remain the same but use the state variables */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">Umum</TabsTrigger>
            <TabsTrigger value="payment">Pembayaran</TabsTrigger>
            <TabsTrigger value="notifications">Notifikasi</TabsTrigger>
            <TabsTrigger value="security">Keamanan</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Informasi RW
                </CardTitle>
                <CardDescription>Kelola informasi dasar RW dan data kontak</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rw-name">Nama RW</Label>
                    <Input
                      id="rw-name"
                      value={rwInfo.name}
                      onChange={(e) => setRwInfo({ ...rwInfo, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rw-phone">Nomor Telepon</Label>
                    <Input
                      id="rw-phone"
                      value={rwInfo.phone}
                      onChange={(e) => setRwInfo({ ...rwInfo, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rw-email">Email RW</Label>
                  <Input
                    id="rw-email"
                    type="email"
                    value={rwInfo.email}
                    onChange={(e) => setRwInfo({ ...rwInfo, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rw-address">Alamat Lengkap</Label>
                  <Textarea
                    id="rw-address"
                    value={rwInfo.address}
                    onChange={(e) => setRwInfo({ ...rwInfo, address: e.target.value })}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Informasi Sistem
                </CardTitle>
                <CardDescription>Detail teknis dan status sistem</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Versi Aplikasi</h4>
                    <p className="text-sm text-gray-600">RWPay v1.0.0</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Terakhir Diperbarui</h4>
                    <p className="text-sm text-gray-600">15 Januari 2025</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Total Warga</h4>
                    <p className="text-sm text-gray-600">156 Kepala Keluarga</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Status Database</h4>
                    <Badge variant="outline" className="text-green-600">
                      Aktif
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Settings */}
          <TabsContent value="payment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Pengaturan Iuran
                </CardTitle>
                <CardDescription>Kelola nominal iuran dan aturan pembayaran</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="monthly-dues">Iuran Bulanan (Rp)</Label>
                    <Input
                      id="monthly-dues"
                      type="number"
                      value={paymentSettings.monthlyDues}
                      onChange={(e) =>
                        setPaymentSettings({ ...paymentSettings, monthlyDues: Number.parseInt(e.target.value) })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due-date">Tanggal Jatuh Tempo</Label>
                    <Input
                      id="due-date"
                      type="number"
                      min="1"
                      max="31"
                      value={paymentSettings.dueDate}
                      onChange={(e) =>
                        setPaymentSettings({ ...paymentSettings, dueDate: Number.parseInt(e.target.value) })
                      }
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="late-fee">Denda Keterlambatan (Rp)</Label>
                    <Input
                      id="late-fee"
                      type="number"
                      value={paymentSettings.lateFee}
                      onChange={(e) =>
                        setPaymentSettings({ ...paymentSettings, lateFee: Number.parseInt(e.target.value) })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Mata Uang</Label>
                    <Input
                      id="currency"
                      value={paymentSettings.currency}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, currency: e.target.value })}
                      disabled
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ringkasan Pengaturan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Aturan Pembayaran Saat Ini:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Iuran bulanan: Rp {paymentSettings.monthlyDues.toLocaleString("id-ID")}</li>
                    <li>• Jatuh tempo setiap tanggal {paymentSettings.dueDate}</li>
                    <li>• Denda keterlambatan: Rp {paymentSettings.lateFee.toLocaleString("id-ID")}</li>
                    <li>• Target bulanan: Rp {(paymentSettings.monthlyDues * 156).toLocaleString("id-ID")}</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Pengaturan Notifikasi
                </CardTitle>
                <CardDescription>Kelola pengingat dan notifikasi pembayaran</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Pengingat Email</Label>
                    <p className="text-sm text-gray-600">Kirim pengingat pembayaran via email</p>
                  </div>
                  <Switch
                    checked={notifications.emailReminders}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, emailReminders: checked })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Pengingat SMS</Label>
                    <p className="text-sm text-gray-600">Kirim pengingat pembayaran via SMS</p>
                  </div>
                  <Switch
                    checked={notifications.smsReminders}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, smsReminders: checked })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notifikasi Tunggakan</Label>
                    <p className="text-sm text-gray-600">Kirim notifikasi untuk pembayaran yang terlambat</p>
                  </div>
                  <Switch
                    checked={notifications.overdueReminders}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, overdueReminders: checked })}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="reminder-days">Kirim Pengingat (hari sebelum jatuh tempo)</Label>
                  <Input
                    id="reminder-days"
                    type="number"
                    min="1"
                    max="10"
                    value={notifications.reminderDays}
                    onChange={(e) =>
                      setNotifications({ ...notifications, reminderDays: Number.parseInt(e.target.value) })
                    }
                    className="w-32"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Keamanan Akun
                </CardTitle>
                <CardDescription>Kelola keamanan dan akses sistem</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Password Saat Ini</Label>
                  <Input id="current-password" type="password" placeholder="Masukkan password saat ini" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Password Baru</Label>
                  <Input id="new-password" type="password" placeholder="Masukkan password baru" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Konfirmasi Password Baru</Label>
                  <Input id="confirm-password" type="password" placeholder="Konfirmasi password baru" />
                </div>
                <Button variant="outline">Ubah Password</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Backup & Restore
                </CardTitle>
                <CardDescription>Kelola backup data dan pemulihan sistem</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">Backup Terakhir</h4>
                    <p className="text-sm text-gray-600">15 Januari 2025, 10:30 WIB</p>
                  </div>
                  <Badge variant="outline" className="text-green-600">
                    Berhasil
                  </Badge>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline">Buat Backup</Button>
                  <Button variant="outline">Restore Data</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Log Aktivitas</CardTitle>
                <CardDescription>Riwayat aktivitas sistem terbaru</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Login admin berhasil</span>
                    <span className="text-gray-500">15 Jan 2025, 09:15</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Data warga diperbarui</span>
                    <span className="text-gray-500">14 Jan 2025, 16:30</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Laporan bulanan dibuat</span>
                    <span className="text-gray-500">14 Jan 2025, 14:20</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Pengaturan iuran diubah</span>
                    <span className="text-gray-500">13 Jan 2025, 11:45</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
