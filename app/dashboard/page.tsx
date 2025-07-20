"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DollarSign, Users, TrendingUp, AlertTriangle, FileText, Settings, LogOut, Plus, Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Link from "next/link"
import { getDashboardStats } from "@/lib/dashboard"
import { getRecentPayments, getUnpaidResidents } from "@/lib/payments"
import type { DashboardStats, Payment } from "@/lib/supabase"

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentPayments, setRecentPayments] = useState<Payment[]>([])
  const [unpaidResidents, setUnpaidResidents] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Test connection first
      const testResponse = await fetch("/api/test-supabase")
      const testResult = await testResponse.json()

      if (!testResult.success) {
        console.error("Supabase connection failed:", testResult.error)
        setIsLoading(false)
        return
      }

      const [statsData, paymentsData, unpaidData] = await Promise.all([
        getDashboardStats().catch((err) => {
          console.error("Error loading dashboard stats:", err)
          return null
        }),
        getRecentPayments(5).catch((err) => {
          console.error("Error loading recent payments:", err)
          return []
        }),
        getUnpaidResidents().catch((err) => {
          console.error("Error loading unpaid residents:", err)
          return []
        }),
      ])

      setStats(statsData)
      setRecentPayments(paymentsData)
      setUnpaidResidents(unpaidData)
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm sm:text-base">Memuat data...</p>
        </div>
      </div>
    )
  }

  const paymentPercentage = stats ? Math.round((stats.paid_this_month / stats.total_residents) * 100) : 0

  const NavigationMenu = () => (
    <div className="flex flex-col space-y-3 p-4 w-full">
      <Badge variant="outline" className="mb-2 text-xs">
        RW 08 - Sambiroto
      </Badge>
      <Link href="/reports" className="w-full">
        <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
          <FileText className="h-4 w-4 mr-2" />
          Laporan
        </Button>
      </Link>
      <Link href="/settings" className="w-full">
        <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
          <Settings className="h-4 w-4 mr-2" />
          Pengaturan
        </Button>
      </Link>
      <Link href="/" className="w-full">
        <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
          <LogOut className="h-4 w-4 mr-2" />
          Keluar
        </Button>
      </Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            {/* Logo */}
            <div className="flex items-center space-x-2 flex-shrink-0 min-w-0">
              <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
              <h1 className="text-base sm:text-lg lg:text-2xl font-bold text-gray-900 truncate">
                <span className="hidden sm:inline">RWPay Dashboard</span>
                <span className="sm:hidden">Dashboard</span>
              </h1>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-3 xl:space-x-4 flex-shrink-0">
              <Badge variant="outline" className="text-xs lg:text-sm whitespace-nowrap">
                RW 08 - Sambiroto
              </Badge>
              <Link href="/reports">
                <Button variant="outline" size="sm" className="text-xs lg:text-sm bg-transparent">
                  <FileText className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
                  <span className="hidden xl:inline">Laporan</span>
                </Button>
              </Link>
              <Link href="/settings">
                <Button variant="outline" size="sm" className="text-xs lg:text-sm bg-transparent">
                  <Settings className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
                  <span className="hidden xl:inline">Pengaturan</span>
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" size="sm" className="text-xs lg:text-sm bg-transparent">
                  <LogOut className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
                  <span className="hidden xl:inline">Keluar</span>
                </Button>
              </Link>
            </div>

            {/* Tablet Navigation */}
            <div className="hidden sm:flex lg:hidden items-center space-x-2 flex-shrink-0">
              <Badge variant="outline" className="text-xs whitespace-nowrap">
                RW 08
              </Badge>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="p-2 bg-transparent">
                    <Menu className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64">
                  <div className="mt-6">
                    <NavigationMenu />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Mobile Navigation */}
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
                    <NavigationMenu />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Warga</CardTitle>
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stats?.total_residents || 0}</div>
              <p className="text-xs text-muted-foreground">Kepala keluarga terdaftar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Sudah Bayar</CardTitle>
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-green-600">{stats?.paid_this_month || 0}</div>
              <p className="text-xs text-muted-foreground">{paymentPercentage}% dari target</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Belum Bayar</CardTitle>
              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-red-600">{stats?.unpaid_this_month || 0}</div>
              <p className="text-xs text-muted-foreground">Perlu tindak lanjut</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Pemasukan</CardTitle>
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">
                Rp {(stats?.total_income_this_month || 0).toLocaleString("id-ID")}
              </div>
              <p className="text-xs text-muted-foreground">Bulan ini</p>
            </CardContent>
          </Card>
        </div>

        {/* Progress Section */}
        <Card className="mb-6 sm:mb-8">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Progress Pembayaran Bulan Ini</CardTitle>
            <CardDescription className="text-sm">
              Target: Rp {(stats?.target_monthly_income || 0).toLocaleString("id-ID")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span>Terkumpul: Rp {(stats?.total_income_this_month || 0).toLocaleString("id-ID")}</span>
                <span>{paymentPercentage}%</span>
              </div>
              <Progress value={paymentPercentage} className="h-2 sm:h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Tabs Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">
              Overview
            </TabsTrigger>
            <TabsTrigger value="payments" className="text-xs sm:text-sm">
              Pembayaran
            </TabsTrigger>
            <TabsTrigger value="residents" className="text-xs sm:text-sm">
              Warga
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Pembayaran Terbaru</CardTitle>
                  <CardDescription className="text-sm">5 pembayaran terakhir</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 sm:space-y-4">
                    {recentPayments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm sm:text-base truncate">{payment.resident?.name}</p>
                          <p className="text-xs sm:text-sm text-gray-500">Rumah {payment.resident?.house_number}</p>
                        </div>
                        <div className="text-right ml-4 flex-shrink-0">
                          <p className="font-medium text-sm sm:text-base">
                            Rp {payment.amount.toLocaleString("id-ID")}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            Lunas
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-base sm:text-lg">
                    <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 mr-2 flex-shrink-0" />
                    Warga Belum Bayar
                  </CardTitle>
                  <CardDescription className="text-sm">Perlu tindak lanjut segera</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 sm:space-y-4">
                    {unpaidResidents.slice(0, 5).map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm sm:text-base truncate">{payment.resident?.name}</p>
                          <p className="text-xs sm:text-sm text-gray-500">Rumah {payment.resident?.house_number}</p>
                        </div>
                        <div className="text-right ml-4 flex-shrink-0">
                          <p className="text-xs sm:text-sm text-red-600">
                            {payment.status === "overdue" ? "Terlambat" : "Belum Bayar"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle className="text-base sm:text-lg">Manajemen Pembayaran</CardTitle>
                    <CardDescription className="text-sm">Input dan pantau pembayaran iuran warga</CardDescription>
                  </div>
                  <Link href="/payments">
                    <Button className="w-full sm:w-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      Kelola Pembayaran
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6 sm:py-8">
                  <FileText className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4 text-sm sm:text-base">Kelola semua pembayaran iuran warga</p>
                  <Link href="/payments">
                    <Button variant="outline" className="w-full sm:w-auto bg-transparent">
                      Lihat Semua Pembayaran
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="residents">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle className="text-base sm:text-lg">Data Warga</CardTitle>
                    <CardDescription className="text-sm">Kelola data warga dan status iuran</CardDescription>
                  </div>
                  <Link href="/residents">
                    <Button className="w-full sm:w-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      Kelola Warga
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6 sm:py-8">
                  <Users className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4 text-sm sm:text-base">Kelola data warga dan informasi kontak</p>
                  <Link href="/residents">
                    <Button variant="outline" className="w-full sm:w-auto bg-transparent">
                      Lihat Semua Warga
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
