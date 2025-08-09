"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Download, Printer, X, Receipt, User, Hash } from "lucide-react"
import type { Payment } from "@/lib/supabase"

interface InvoiceDialogProps {
  payment: Payment
  open: boolean
  onClose: () => void
}

export function InvoiceDialog({ payment, open, onClose }: InvoiceDialogProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      // Create HTML content for download
      const invoiceContent = document.getElementById("invoice-content")?.innerHTML
      const fullHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice ${payment.invoice_number}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .invoice-header { text-align: center; margin-bottom: 30px; }
            .invoice-details { margin-bottom: 20px; }
            .invoice-table { width: 100%; border-collapse: collapse; }
            .invoice-table th, .invoice-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .invoice-table th { background-color: #f2f2f2; }
            .total-section { margin-top: 20px; text-align: right; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          ${invoiceContent}
        </body>
        </html>
      `

      const blob = new Blob([fullHTML], { type: "text/html" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `invoice-${payment.invoice_number}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error downloading invoice:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header - Fixed */}
        <DialogHeader className="px-6 py-4 border-b bg-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center text-xl">
              <Receipt className="h-6 w-6 mr-2 text-blue-600" />
              Invoice #{payment.invoice_number}
            </DialogTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handlePrint} className="hidden sm:flex bg-transparent">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload} disabled={isDownloading}>
                <Download className="h-4 w-4 mr-2" />
                {isDownloading ? "Downloading..." : "Download"}
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Invoice Content */}
        <div id="invoice-content" className="p-6 bg-white">
          {/* Company Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">RWPay System</h1>
            <p className="text-gray-600">Sistem Pembayaran Iuran RT/RW</p>
            <p className="text-sm text-gray-500">Jl. Contoh No. 123, Jakarta</p>
          </div>

          {/* Invoice Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Tagihan Kepada:
                </h3>
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{payment.resident?.name}</p>
                  <p className="text-gray-600">RT {payment.resident?.rt}</p>
                  <p className="text-gray-600">Rumah {payment.resident?.house_number}</p>
                  {payment.resident?.address && <p className="text-gray-600">{payment.resident.address}</p>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Hash className="h-4 w-4 mr-2" />
                  Detail Invoice:
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">No. Invoice:</span>
                    <span className="font-medium">{payment.invoice_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tanggal:</span>
                    <span className="font-medium">{formatDate(payment.invoice_date || payment.payment_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Jatuh Tempo:</span>
                    <span className="font-medium">{formatDate(payment.due_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <Badge
                      className={
                        payment.status === "paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                      }
                    >
                      {payment.status === "paid" ? "Lunas" : "Pending"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Details */}
          <Card className="mb-6">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Deskripsi</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Qty</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Harga</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            {payment.payment_type === "LPS"
                              ? "Limbah Padat Sampah (LPS)"
                              : "Pemakaian Air Bersih (PAB)"}
                          </p>
                          <p className="text-sm text-gray-600">{payment.notes}</p>
                          {payment.payment_type === "PAB" && payment.cubic_meters && (
                            <p className="text-sm text-gray-600">
                              Pemakaian: {payment.cubic_meters} m³ × {formatCurrency(payment.rate_per_cubic || 0)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        {payment.payment_type === "LPS" ? "1 bulan" : `${payment.cubic_meters || 0} m³`}
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        {payment.payment_type === "LPS"
                          ? formatCurrency(payment.amount)
                          : formatCurrency(payment.rate_per_cubic || 0)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(payment.amount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Separator className="my-6" />

          {/* Total Section */}
          <div className="flex justify-end">
            <div className="w-full max-w-sm">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>{formatCurrency(payment.amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Pajak:</span>
                  <span>Rp 0</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-blue-600">{formatCurrency(payment.amount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          {payment.status === "paid" && (
            <Card className="mt-6 bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center mb-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="font-medium text-green-800">Pembayaran Diterima</span>
                </div>
                <div className="text-sm text-green-700 space-y-1">
                  <p>Metode: {payment.payment_method || "Cash"}</p>
                  <p>Tanggal: {formatDate(payment.payment_date)}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t text-center text-sm text-gray-500">
            <p>Terima kasih atas pembayaran Anda!</p>
            <p className="mt-1">Invoice ini dibuat secara otomatis oleh sistem RWPay</p>
          </div>
        </div>

        {/* Mobile Print Button */}
        <div className="sm:hidden px-6 py-4 border-t bg-gray-50">
          <Button onClick={handlePrint} className="w-full">
            <Printer className="h-4 w-4 mr-2" />
            Print Invoice
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
