"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  FileText,
  Download,
  ArrowLeft,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  FileSpreadsheet,
  Menu,
} from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Link from "next/link"
import { getMonthlyStats, getDashboardStats } from "@/lib/dashboard"
import { exportFinancialReportToExcel, exportFinancialReportToPDF } from "@/lib/export"

export default function ReportsPage() {
  const [monthlyStats, setMonthlyStats] = useState<any[]>([])
  const [dashboardStats, setDashboardStats] = useState<any>(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    loadReportsData()
  }, [])

  const loadReportsData = async () => {
    try {
      const [monthlyData, dashData] = await Promise.all([getMonthlyStats(12), getDashboardStats()])

      setMonthlyStats(monthlyData)
      setDashboardStats(dashData)
    } catch (error) {
      console.error("Error loading reports data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportExcel = async () => {
    setIsExporting(true)
    try {
      await exportFinancialReportToExcel()
      alert("Laporan keuangan berhasil diekspor ke Excel!")
    } catch (error) {
      alert("Gagal mengekspor laporan ke Excel")
      console.error("Export error:", error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportPDF = async () => {
    setIsExporting(true)
    try {
      await exportFinancialReportToPDF()
      alert("Laporan keuangan berhasil diekspor ke PDF!")
    } catch (error) {
      alert("Gagal mengekspor laporan ke PDF")
      console.error("Export error:", error)
    } finally {
      setIsExporting(false)
    }
  }

  const ExportMenu = () => (
    <div className="flex flex-col space-y-3 p-4 w-full">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button disabled={isExporting} className="w-full justify-start">
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Mengekspor..." : "Export Laporan"}
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
    </div>
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Memuat laporan...</p>
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
                <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
                <h1 className="text-base sm:text-lg lg:text-2xl font-bold text-gray-900 truncate">
                  <span className="hidden sm:inline">Laporan Keuangan</span>
                  <span className="sm:hidden">Laporan</span>
                </h1>
              </div>
            </div>

            {/* Desktop Export */}
            <div className="hidden sm:flex items-center flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button disabled={isExporting} size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    <span className="hidden md:inline">{isExporting ? "Mengekspor..." : "Export Laporan"}</span>
                    <span className="md:hidden">{isExporting ? "Export..." : "Export"}</span>
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
            </div>

            {/* Mobile Export */}
            <div className="sm:hidden flex-shrink-0">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="p-2 bg-transparent">
                    <Menu className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64">
                  <div className="mt-6">
                    <ExportMenu />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Warga</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats?.total_residents || 0}</div>
              <p className="text-xs text-muted-foreground">Kepala keluarga</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pemasukan Bulan Ini</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-green-600">
                Rp {(dashboardStats?.total_income_this_month || 0).toLocaleString("id-ID")}
              </div>
              <p className="text-xs text-muted-foreground">Dari iuran warga</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Target Bulanan</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-blue-600">
                Rp {(dashboardStats?.target_monthly_income || 0).toLocaleString("id-ID")}
              </div>
              <p className="text-xs text-muted-foreground">Target pemasukan</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pencapaian</CardTitle>
              <Calendar className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-purple-600">
                {dashboardStats
                  ? Math.round((dashboardStats.total_income_this_month / dashboardStats.target_monthly_income) * 100)
                  : 0}
                %
              </div>
              <p className="text-xs text-muted-foreground">Dari target</p>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Report */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-lg sm:text-xl">Laporan Bulanan</CardTitle>
                <CardDescription className="text-sm">Ringkasan pemasukan dan pembayaran per bulan</CardDescription>
              </div>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => {
                    const date = new Date()
                    date.setMonth(date.getMonth() - i)
                    const value = date.toISOString().slice(0, 7)
                    const label = date.toLocaleDateString("id-ID", { year: "numeric", month: "long" })
                    return (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bulan</TableHead>
                    <TableHead>Total Pembayaran</TableHead>
                    <TableHead>Lunas</TableHead>
                    <TableHead>Belum Bayar</TableHead>
                    <TableHead>Terlambat</TableHead>
                    <TableHead className="text-right">Total Pemasukan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyStats.map((stat, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {new Date(stat.month).toLocaleDateString("id-ID", { year: "numeric", month: "long" })}
                      </TableCell>
                      <TableCell>{stat.total_payments}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">{stat.paid_count}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-yellow-100 text-yellow-800">{stat.pending_count}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-red-100 text-red-800">{stat.overdue_count}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        Rp {(stat.paid_amount || 0).toLocaleString("id-ID")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {monthlyStats.map((stat, index) => (
                <Card key={index} className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-medium text-base">
                      {new Date(stat.month).toLocaleDateString("id-ID", { year: "numeric", month: "long" })}
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {stat.total_payments} Total
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="text-center">
                      <Badge className="bg-green-100 text-green-800 text-xs mb-1">{stat.paid_count}</Badge>
                      <p className="text-xs text-gray-600">Lunas</p>
                    </div>
                    <div className="text-center">
                      <Badge className="bg-yellow-100 text-yellow-800 text-xs mb-1">{stat.pending_count}</Badge>
                      <p className="text-xs text-gray-600">Belum Bayar</p>
                    </div>
                    <div className="text-center">
                      <Badge className="bg-red-100 text-red-800 text-xs mb-1">{stat.overdue_count}</Badge>
                      <p className="text-xs text-gray-600">Terlambat</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Pemasukan:</span>
                      <span className="font-medium text-sm">Rp {(stat.paid_amount || 0).toLocaleString("id-ID")}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {monthlyStats.length === 0 && (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Belum ada data laporan bulanan</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Ringkasan Keuangan</CardTitle>
            <CardDescription>Analisis keuangan RW secara keseluruhan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-base sm:text-lg">Pemasukan</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Iuran Bulanan:</span>
                    <span className="font-medium">
                      Rp {(dashboardStats?.total_income_this_month || 0).toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Target Bulanan:</span>
                    <span className="font-medium">
                      Rp {(dashboardStats?.target_monthly_income || 0).toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2 text-sm">
                    <span className="font-semibold">Selisih:</span>
                    <span
                      className={`font-semibold ${
                        (dashboardStats?.total_income_this_month || 0) >= (dashboardStats?.target_monthly_income || 0)
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      Rp{" "}
                      {Math.abs(
                        (dashboardStats?.total_income_this_month || 0) - (dashboardStats?.target_monthly_income || 0),
                      ).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-base sm:text-lg">Status Pembayaran</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Sudah Bayar:</span>
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      {dashboardStats?.paid_this_month || 0} warga
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Belum Bayar:</span>
                    <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                      {dashboardStats?.unpaid_this_month || 0} warga
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tingkat Kepatuhan:</span>
                    <span className="font-medium">
                      {dashboardStats
                        ? Math.round((dashboardStats.paid_this_month / dashboardStats.total_residents) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
