"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  DollarSign,
  Plus,
  Search,
  Edit,
  Trash2,
  ArrowLeft,
  CheckCircle,
  Download,
  FileSpreadsheet,
  FileText,
  Menu,
} from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Link from "next/link"
import { getPayments, deletePayment, markPaymentAsPaid } from "@/lib/payments"
import { exportPaymentsToExcel, exportPaymentsToPDF } from "@/lib/export"
import { PaymentForm } from "@/components/payments/payment-form"
import type { Payment } from "@/lib/supabase"

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "paid" | "overdue">("all")
  const [showForm, setShowForm] = useState(false)
  const [editingPayment, setEditingPayment] = useState<Payment | undefined>()

  useEffect(() => {
    loadPayments()
  }, [])

  useEffect(() => {
    filterPayments()
  }, [payments, searchTerm, statusFilter])

  const loadPayments = async () => {
    try {
      const data = await getPayments()
      setPayments(data)
    } catch (error) {
      console.error("Error loading payments:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterPayments = () => {
    let filtered = payments

    if (statusFilter !== "all") {
      filtered = filtered.filter((payment) => payment.status === statusFilter)
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (payment) =>
          payment.resident?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.resident?.house_number.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    setFilteredPayments(filtered)
  }

  const handleDelete = async (id: string) => {
    try {
      await deletePayment(id)
      await loadPayments()
    } catch (error) {
      console.error("Error deleting payment:", error)
    }
  }

  const handleMarkAsPaid = async (id: string) => {
    try {
      await markPaymentAsPaid(id, "cash", "Pembayaran dikonfirmasi")
      await loadPayments()
    } catch (error) {
      console.error("Error marking payment as paid:", error)
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingPayment(undefined)
    loadPayments()
  }

  const handleExportExcel = async () => {
    setIsExporting(true)
    try {
      const filters = statusFilter !== "all" ? { status: statusFilter } : undefined
      await exportPaymentsToExcel(filters)
      alert("Data pembayaran berhasil diekspor ke Excel!")
    } catch (error) {
      alert("Gagal mengekspor data ke Excel")
      console.error("Export error:", error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportPDF = async () => {
    setIsExporting(true)
    try {
      const filters = statusFilter !== "all" ? { status: statusFilter } : undefined
      await exportPaymentsToPDF(filters)
      alert("Data pembayaran berhasil diekspor ke PDF!")
    } catch (error) {
      alert("Gagal mengekspor data ke PDF")
      console.error("Export error:", error)
    } finally {
      setIsExporting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-100 text-green-800">Lunas</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Belum Bayar</Badge>
      case "overdue":
        return <Badge className="bg-red-100 text-red-800">Terlambat</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const ActionMenu = () => (
    <div className="flex flex-col space-y-3 p-4 w-full">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={isExporting} className="w-full justify-start bg-transparent">
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Mengekspor..." : "Export"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={handleExportExcel}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export Excel
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExportPDF}>
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogTrigger asChild>
          <Button onClick={() => setEditingPayment(undefined)} className="w-full justify-start">
            <Plus className="h-4 w-4 mr-2" />
            Input Pembayaran
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPayment ? "Edit Pembayaran" : "Input Pembayaran Baru"}</DialogTitle>
          </DialogHeader>
          <PaymentForm payment={editingPayment} onSuccess={handleFormSuccess} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Memuat data pembayaran...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            {/* Left side */}
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="flex-shrink-0 p-2 sm:px-3">
                  <ArrowLeft className="h-4 w-4 mr-0 sm:mr-2" />
                  <span className="hidden sm:inline">Kembali</span>
                </Button>
              </Link>
              <div className="flex items-center space-x-2 min-w-0">
                <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
                <h1 className="text-base sm:text-lg lg:text-2xl font-bold text-gray-900 truncate">
                  <span className="hidden lg:inline">Manajemen Pembayaran</span>
                  <span className="lg:hidden">Pembayaran</span>
                </h1>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-2 flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" disabled={isExporting} size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    {isExporting ? "Mengekspor..." : "Export"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={handleExportExcel}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportPDF}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingPayment(undefined)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="hidden lg:inline">Input Pembayaran</span>
                    <span className="lg:hidden">Input</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingPayment ? "Edit Pembayaran" : "Input Pembayaran Baru"}</DialogTitle>
                  </DialogHeader>
                  <PaymentForm
                    payment={editingPayment}
                    onSuccess={handleFormSuccess}
                    onCancel={() => setShowForm(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>

            {/* Mobile Actions */}
            <div className="md:hidden flex-shrink-0">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="p-2 bg-transparent">
                    <Menu className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64">
                  <div className="mt-6">
                    <ActionMenu />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pembayaran</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{payments.length}</div>
              <p className="text-xs text-muted-foreground">Semua periode</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sudah Lunas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {payments.filter((p) => p.status === "paid").length}
              </div>
              <p className="text-xs text-muted-foreground">Pembayaran selesai</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Belum Bayar</CardTitle>
              <DollarSign className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {payments.filter((p) => p.status === "pending").length}
              </div>
              <p className="text-xs text-muted-foreground">Menunggu pembayaran</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Terlambat</CardTitle>
              <DollarSign className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {payments.filter((p) => p.status === "overdue").length}
              </div>
              <p className="text-xs text-muted-foreground">Perlu tindak lanjut</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filter & Pencarian</CardTitle>
            <CardDescription>Cari dan filter data pembayaran</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Cari nama warga atau nomor rumah..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value: "all" | "pending" | "paid" | "overdue") => setStatusFilter(value)}
              >
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="paid">Lunas</SelectItem>
                  <SelectItem value="pending">Belum Bayar</SelectItem>
                  <SelectItem value="overdue">Terlambat</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Pembayaran</CardTitle>
            <CardDescription>
              Menampilkan {filteredPayments.length} dari {payments.length} pembayaran
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Desktop Table */}
            <div className="hidden lg:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Warga</TableHead>
                    <TableHead>No. Rumah</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Tanggal Bayar</TableHead>
                    <TableHead>Jatuh Tempo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.resident?.name}</TableCell>
                      <TableCell>{payment.resident?.house_number}</TableCell>
                      <TableCell>Rp {payment.amount.toLocaleString("id-ID")}</TableCell>
                      <TableCell>{new Date(payment.payment_date).toLocaleDateString("id-ID")}</TableCell>
                      <TableCell>{new Date(payment.due_date).toLocaleDateString("id-ID")}</TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          {payment.status === "pending" && (
                            <Button variant="outline" size="sm" onClick={() => handleMarkAsPaid(payment.id)}>
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingPayment(payment)
                              setShowForm(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Pembayaran</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Apakah Anda yakin ingin menghapus data pembayaran ini? Tindakan ini tidak dapat
                                  dibatalkan.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(payment.id)}>Hapus</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4">
              {filteredPayments.map((payment) => (
                <Card key={payment.id} className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-base truncate">{payment.resident?.name}</h3>
                      <p className="text-sm text-gray-600">Rumah {payment.resident?.house_number}</p>
                    </div>
                    <div className="ml-2 flex-shrink-0">{getStatusBadge(payment.status)}</div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Jumlah:</span>
                      <span className="font-medium">Rp {payment.amount.toLocaleString("id-ID")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tanggal Bayar:</span>
                      <span>{new Date(payment.payment_date).toLocaleDateString("id-ID")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Jatuh Tempo:</span>
                      <span>{new Date(payment.due_date).toLocaleDateString("id-ID")}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2 mt-4 pt-3 border-t">
                    {payment.status === "pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-transparent"
                        onClick={() => handleMarkAsPaid(payment.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Lunas
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-transparent"
                      onClick={() => {
                        setEditingPayment(payment)
                        setShowForm(true)
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Hapus
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="mx-4">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus Pembayaran</AlertDialogTitle>
                          <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus data pembayaran ini? Tindakan ini tidak dapat dibatalkan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(payment.id)}>Hapus</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </Card>
              ))}
            </div>

            {filteredPayments.length === 0 && (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm || statusFilter !== "all"
                    ? "Tidak ada pembayaran yang sesuai dengan filter"
                    : "Belum ada data pembayaran"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
