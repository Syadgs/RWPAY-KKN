import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Users, DollarSign, FileText, Settings, Shield, Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Link from "next/link"

export default function HomePage() {
  const NavigationMenu = () => (
    <div className="flex flex-col space-y-3 p-4 w-full">
      <Link href="/login" className="w-full">
        <Button variant="outline" className="w-full justify-start bg-transparent">
          Login Admin
        </Button>
      </Link>
      <Link href="/dashboard" className="w-full">
        <Button className="w-full justify-start">Dashboard</Button>
      </Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
              <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">RWPay</h1>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center space-x-3 lg:space-x-4">
              <Link href="/login">
                <Button variant="outline" size="sm" className="bg-transparent text-sm lg:text-base">
                  Login Admin
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="sm" className="text-sm lg:text-base">
                  Dashboard
                </Button>
              </Link>
            </div>

            {/* Mobile Navigation */}
            <div className="sm:hidden">
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

      {/* Hero Section */}
      <section className="py-8 sm:py-12 lg:py-16 xl:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-3 sm:mb-4 bg-blue-100 text-blue-800 hover:bg-blue-200 text-xs sm:text-sm px-3 py-1">
            Program KKN Undip 2025
          </Badge>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
            Solusi Digital untuk <span className="text-blue-600 block sm:inline">Pendataan Iuran RW</span>
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed px-4 sm:px-0">
            Pantau keuangan RW secara transparan dan mudah. Manajemen iuran bulanan RW, lebih cepat dan akurat dengan
            teknologi modern.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-sm sm:max-w-none mx-auto px-4 sm:px-0">
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto text-sm sm:text-base h-11 sm:h-12">
                Mulai Sekarang
              </Button>
            </Link>
            <Link href="/about" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto bg-transparent text-sm sm:text-base h-11 sm:h-12"
              >
                Pelajari Lebih Lanjut
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
              Fitur Unggulan RWPay
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-3xl mx-auto px-4 sm:px-0">
              Sistem lengkap untuk mengelola keuangan RW dengan mudah dan efisien
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center sm:text-left p-4 sm:p-6">
                <Shield className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600 mb-2 mx-auto sm:mx-0" />
                <CardTitle className="text-base sm:text-lg lg:text-xl">Login Pengurus RW</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Akses aman dengan sistem autentikasi untuk pengurus RW
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center sm:text-left p-4 sm:p-6">
                <Users className="h-8 w-8 sm:h-10 sm:w-10 text-green-600 mb-2 mx-auto sm:mx-0" />
                <CardTitle className="text-base sm:text-lg lg:text-xl">Pendataan Warga</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Kelola data warga: nama, alamat, nomor rumah, dan status iuran
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center sm:text-left p-4 sm:p-6">
                <DollarSign className="h-8 w-8 sm:h-10 sm:w-10 text-yellow-600 mb-2 mx-auto sm:mx-0" />
                <CardTitle className="text-base sm:text-lg lg:text-xl">Monitoring Iuran</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Input pembayaran bulanan dan pantau riwayat pembayaran warga
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center sm:text-left p-4 sm:p-6">
                <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-purple-600 mb-2 mx-auto sm:mx-0" />
                <CardTitle className="text-base sm:text-lg lg:text-xl">Laporan Keuangan</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Rekap pemasukan & pengeluaran dengan unduh laporan PDF/Excel
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center sm:text-left p-4 sm:p-6">
                <Settings className="h-8 w-8 sm:h-10 sm:w-10 text-orange-600 mb-2 mx-auto sm:mx-0" />
                <CardTitle className="text-base sm:text-lg lg:text-xl">Pengaturan Sistem</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Konfigurasi sistem, notifikasi, dan pengaturan pembayaran
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center sm:text-left p-4 sm:p-6">
                <BarChart3 className="h-8 w-8 sm:h-10 sm:w-10 text-indigo-600 mb-2 mx-auto sm:mx-0" />
                <CardTitle className="text-base sm:text-lg lg:text-xl">Dashboard Visual</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Grafik dan visualisasi status pembayaran dan arus kas RW
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">Tentang RWPay</h2>
          <div className="bg-blue-50 rounded-lg p-4 sm:p-6 lg:p-8">
            <p className="text-sm sm:text-base lg:text-lg text-gray-700 leading-relaxed">
              Website ini dibuat dalam rangka <strong>Program KKN Universitas Diponegoro 2025</strong> di RW 08,
              Kelurahan Sambiroto, Kecamatan Tembalang. Aplikasi ini bertujuan membantu pengurus RW dalam mencatat dan
              mengelola iuran bulanan warga secara efisien, akurat, dan transparan. Sistem ini memanfaatkan framework
              React dan Next.js, serta dilengkapi fitur sederhana untuk memudahkan analisis data dan pelaporan.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start space-x-2 mb-4">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="text-lg sm:text-xl font-bold">RWPay</span>
              </div>
              <p className="text-gray-400 text-sm sm:text-base">
                Solusi digital untuk pendataan iuran RW yang transparan dan efisien.
              </p>
            </div>
            <div className="text-center sm:text-left">
              <h3 className="text-base sm:text-lg font-semibold mb-4">Fitur</h3>
              <ul className="space-y-2 text-gray-400 text-sm sm:text-base">
                <li>Pendataan Warga</li>
                <li>Monitoring Iuran</li>
                <li>Laporan Keuangan</li>
                <li>Dashboard Visual</li>
              </ul>
            </div>
            <div className="text-center sm:text-left">
              <h3 className="text-base sm:text-lg font-semibold mb-4">Program KKN</h3>
              <p className="text-gray-400 text-sm sm:text-base">
                Universitas Diponegoro 2025
                <br />
                RW 08, Kelurahan Sambiroto
                <br />
                Kecamatan Tembalang
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-gray-400 text-xs sm:text-sm lg:text-base">
            <p>&copy; 2025 RWPay - Program KKN Undip. Dibuat dengan ❤️ untuk masyarakat.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
