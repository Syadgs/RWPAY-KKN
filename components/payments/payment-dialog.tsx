"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Droplets, Calculator, X } from "lucide-react"
import type { Resident } from "@/lib/supabase"

interface PaymentDialogProps {
  resident: Resident
  paymentType: "LPS" | "PAB"
  rate: number
  open: boolean
  onClose: () => void
  onSuccess: (meterReading?: number) => void
}

export function PaymentDialog({ resident, paymentType, rate, open, onClose, onSuccess }: PaymentDialogProps) {
  const [meterReading, setMeterReading] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState("")

  const calculateTotal = () => {
    if (paymentType === "LPS") return rate
    const reading = Number.parseFloat(meterReading) || 0
    return reading * rate
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (paymentType === "PAB") {
      const reading = Number.parseFloat(meterReading)
      if (!reading || reading <= 0) {
        setError("Meteran harus diisi dengan angka yang valid")
        return
      }
      if (reading > 1000) {
        setError("Meteran tidak boleh lebih dari 1000 m³")
        return
      }
    }

    setIsProcessing(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate processing
      onSuccess(paymentType === "PAB" ? Number.parseFloat(meterReading) : undefined)
      handleClose()
    } catch (error) {
      setError("Gagal memproses pembayaran")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    setMeterReading("")
    setError("")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-md sm:max-w-lg mx-4 max-h-[95vh] overflow-hidden flex flex-col p-0">
        {/* Header - Fixed */}
        <DialogHeader className="px-4 sm:px-6 py-4 border-b bg-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center text-lg sm:text-xl">
              <Droplets className="h-5 w-5 mr-2 text-purple-600" />
              Pembayaran {paymentType}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
          <div className="space-y-4 sm:space-y-6">
            {/* Resident Info */}
            <Card className="bg-gray-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">Detail Warga</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                  <span className="text-gray-600 text-sm">Nama:</span>
                  <span className="font-medium text-sm sm:text-base">{resident.name}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                  <span className="text-gray-600 text-sm">RT:</span>
                  <Badge variant="outline" className="w-fit">
                    RT {resident.rt}
                  </Badge>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                  <span className="text-gray-600 text-sm">Rumah:</span>
                  <span className="font-medium text-sm sm:text-base">{resident.house_number}</span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg flex items-center">
                    <Calculator className="h-4 w-4 mr-2" />
                    Kalkulasi Pembayaran
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                    <span className="text-gray-600 text-sm">Jenis Pembayaran:</span>
                    <Badge variant={paymentType === "LPS" ? "default" : "secondary"} className="w-fit">
                      {paymentType === "LPS" ? "LPS - Limbah Padat Sampah" : "PAB - Pemakaian Air Bersih"}
                    </Badge>
                  </div>

                  {paymentType === "LPS" ? (
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                      <span className="text-gray-600 text-sm">Tarif Bulanan:</span>
                      <span className="font-medium text-sm">Rp {rate.toLocaleString("id-ID")}</span>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="meterReading" className="text-sm font-medium">
                          Meteran Air (m³) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="meterReading"
                          type="number"
                          step="0.1"
                          min="0"
                          max="1000"
                          value={meterReading}
                          onChange={(e) => setMeterReading(e.target.value)}
                          placeholder="Masukkan meteran air..."
                          className="w-full"
                          required
                        />
                        <p className="text-xs text-gray-500">Masukkan angka meteran air dalam meter kubik (m³)</p>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                        <span className="text-gray-600 text-sm">Tarif per m³:</span>
                        <span className="font-medium text-sm">Rp {rate.toLocaleString("id-ID")}</span>
                      </div>

                      {meterReading && (
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                          <span className="text-gray-600 text-sm">Pemakaian:</span>
                          <span className="font-medium text-sm">{Number.parseFloat(meterReading) || 0} m³</span>
                        </div>
                      )}
                    </>
                  )}

                  <Separator />

                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
                      <span className="text-base font-semibold">Total Pembayaran:</span>
                      <span className="text-lg sm:text-xl font-bold text-blue-600">
                        Rp {calculateTotal().toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </form>
          </div>
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="px-4 sm:px-6 py-4 border-t bg-white flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 bg-transparent"
              disabled={isProcessing}
            >
              Batal
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              className="flex-1"
              disabled={isProcessing || (paymentType === "PAB" && !meterReading)}
            >
              {isProcessing ? "Memproses..." : `Bayar ${paymentType}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
