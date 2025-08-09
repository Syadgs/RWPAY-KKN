"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createPayment, updatePayment } from "@/lib/payments"
import { getResidents } from "@/lib/residents"
import { getPaymentSettings } from "@/lib/settings"
import type { Payment, Resident } from "@/lib/supabase"

interface PaymentFormProps {
  payment?: Payment
  onSuccess: () => void
  onCancel: () => void
}

export function PaymentForm({ payment, onSuccess, onCancel }: PaymentFormProps) {
  const [residents, setResidents] = useState<Resident[]>([])
  const [formData, setFormData] = useState({
    resident_id: payment?.resident_id || "",
    payment_type: payment?.payment_type || ("LPS" as "LPS" | "PAB"),
    amount: payment?.amount || 0,
    payment_date: payment?.payment_date || new Date().toISOString().split("T")[0],
    due_date: payment?.due_date || "",
    status: payment?.status || ("pending" as "pending" | "paid" | "overdue"),
    payment_method: payment?.payment_method || "",
    notes: payment?.notes || "",
    cubic_meters: payment?.cubic_meters || 0,
    rate_per_cubic: payment?.rate_per_cubic || 0,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [lpsRate, setLpsRate] = useState(0)
  const [pabRate, setPabRate] = useState(0)

  useEffect(() => {
    loadResidents()
    loadRates()
  }, [])

  useEffect(() => {
    calculateAmount()
  }, [formData.payment_type, formData.cubic_meters, lpsRate, pabRate])

  const loadResidents = async () => {
    try {
      const data = await getResidents({ status: "active" })
      setResidents(data)
    } catch (err) {
      console.error("Error loading residents:", err)
    }
  }

  const loadRates = async () => {
    try {
      const settings = await getPaymentSettings()
      setLpsRate(settings.monthlyDues) // LPS rate
      setPabRate(settings.pabRate || 5000) // PAB rate per cubic meter

      if (!payment) {
        setFormData((prev) => ({
          ...prev,
          rate_per_cubic: settings.pabRate || 5000,
        }))
      }
    } catch (err) {
      console.error("Error loading rates:", err)
    }
  }

  const calculateAmount = () => {
    if (formData.payment_type === "LPS") {
      setFormData((prev) => ({ ...prev, amount: lpsRate }))
    } else if (formData.payment_type === "PAB") {
      const amount = formData.cubic_meters * (formData.rate_per_cubic || pabRate)
      setFormData((prev) => ({ ...prev, amount }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const paymentData = {
        ...formData,
        // Generate invoice number for paid payments
        invoice_number: formData.status === "paid" ? `INV-${Date.now()}` : undefined,
        invoice_date: formData.status === "paid" ? new Date().toISOString().split("T")[0] : undefined,
      }

      if (payment) {
        await updatePayment(payment.id, paymentData)
      } else {
        await createPayment(paymentData)
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{payment ? "Edit Pembayaran" : "Input Pembayaran Baru"}</CardTitle>
        <CardDescription>
          {payment ? "Perbarui data pembayaran" : "Masukkan data pembayaran LPS atau PAB"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="resident_id">Warga *</Label>
              <Select
                value={formData.resident_id}
                onValueChange={(value) => setFormData({ ...formData, resident_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih warga" />
                </SelectTrigger>
                <SelectContent>
                  {residents.map((resident) => (
                    <SelectItem key={resident.id} value={resident.id}>
                      {resident.name} - RT {resident.rt} - Rumah {resident.house_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_type">Jenis Pembayaran *</Label>
              <Select
                value={formData.payment_type}
                onValueChange={(value: "LPS" | "PAB") => setFormData({ ...formData, payment_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LPS">LPS (Limbah Padat Sampah)</SelectItem>
                  <SelectItem value="PAB">PAB (Pemakaian Air Bersih)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.payment_type === "PAB" && (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cubic_meters">Volume (m³) *</Label>
                <Input
                  id="cubic_meters"
                  type="number"
                  step="0.1"
                  value={formData.cubic_meters}
                  onChange={(e) => setFormData({ ...formData, cubic_meters: Number(e.target.value) })}
                  required={formData.payment_type === "PAB"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rate_per_cubic">Tarif per m³ (Rp) *</Label>
                <Input
                  id="rate_per_cubic"
                  type="number"
                  value={formData.rate_per_cubic}
                  onChange={(e) => setFormData({ ...formData, rate_per_cubic: Number(e.target.value) })}
                  required={formData.payment_type === "PAB"}
                />
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Total Jumlah (Rp) *</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                required
                readOnly={formData.payment_type === "PAB"}
                className={formData.payment_type === "PAB" ? "bg-gray-50" : ""}
              />
              {formData.payment_type === "PAB" && (
                <p className="text-sm text-gray-500">
                  Otomatis dihitung: {formData.cubic_meters} m³ × Rp {formData.rate_per_cubic?.toLocaleString("id-ID")}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "pending" | "paid" | "overdue") => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Belum Bayar</SelectItem>
                  <SelectItem value="paid">Sudah Bayar</SelectItem>
                  <SelectItem value="overdue">Terlambat</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment_date">Tanggal Pembayaran *</Label>
              <Input
                id="payment_date"
                type="date"
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_date">Tanggal Jatuh Tempo *</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_method">Metode Pembayaran</Label>
            <Select
              value={formData.payment_method}
              onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih metode pembayaran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Tunai</SelectItem>
                <SelectItem value="transfer">Transfer Bank</SelectItem>
                <SelectItem value="e-wallet">E-Wallet</SelectItem>
                <SelectItem value="other">Lainnya</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Catatan</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Catatan tambahan..."
            />
          </div>

          <div className="flex space-x-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Menyimpan..." : payment ? "Perbarui" : "Simpan"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Batal
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
