import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, MapPin, Calendar, Users, Target, Award, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
              <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">RWPay</h1>
            </Link>
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Beranda</span>
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="sm" className="bg-transparent">
                  <span className="hidden sm:inline">Login Admin</span>
                  <span className="sm:hidden">Login</span>
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="sm">
                  <span className="hidden sm:inline">Dashboard</span>
                  <span className="sm:hidden">Dashboard</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12">
          <Badge className="mb-3 sm:mb-4 bg-blue-100 text-blue-800 hover:bg-blue-200 text-xs sm:text-sm">
            Program KKN Undip 2025
          </Badge>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">Tentang RWPay</h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto">
            Solusi digital inovatif untuk transparansi dan efisiensi pengelolaan keuangan RW
          </p>
        </div>

        {/* Main Content */}
        <Card className="mb-6 sm:mb-8">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Latar Belakang Proyek</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <p className="text-base sm:text-lg leading-relaxed mb-4 sm:mb-6">
              Website ini dibuat dalam rangka <strong>Program KKN Universitas Diponegoro 2025</strong> di RW 08,
              Kelurahan Sambiroto, Kecamatan Tembalang. Aplikasi ini bertujuan membantu pengurus RW dalam mencatat dan
              mengelola iuran bulanan warga secara efisien, akurat, dan transparan.
            </p>
            <p className="text-base sm:text-lg leading-relaxed">
              Sistem ini memanfaatkan framework React dan Next.js, serta dilengkapi fitur sederhana berbasis AI untuk
              memudahkan analisis data dan pelaporan keuangan RW.
            </p>
          </CardContent>
        </Card>

        {/* Project Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardHeader>
              <MapPin className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mb-2" />
              <CardTitle className="text-lg sm:text-xl">Lokasi KKN</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm sm:text-base">
                <p>
                  <strong>RW:</strong> 08
                </p>
                <p>
                  <strong>Kelurahan:</strong> Sambiroto
                </p>
                <p>
                  <strong>Kecamatan:</strong> Tembalang
                </p>
                <p>
                  <strong>Kota:</strong> Semarang
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 mb-2" />
              <CardTitle className="text-lg sm:text-xl">Timeline Proyek</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm sm:text-base">
                <p>
                  <strong>Program:</strong> KKN Undip 2025
                </p>
                <p>
                  <strong>Durasi:</strong> 2 bulan
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  <Badge variant="outline" className="text-green-600 text-xs">
                    Aktif
                  </Badge>
                </p>
                <p>
                  <strong>Tim:</strong> Mahasiswa Undip
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Objectives */}
        <Card className="mb-6 sm:mb-8">
          <CardHeader>
            <Target className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 mb-2" />
            <CardTitle className="text-lg sm:text-xl">Tujuan Proyek</CardTitle>
            <CardDescription>Manfaat yang ingin dicapai melalui implementasi RWPay</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm sm:text-base">Meningkatkan transparansi pengelolaan keuangan RW</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm sm:text-base">Mempermudah pencatatan dan monitoring iuran bulanan</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm sm:text-base">Mengurangi kesalahan dalam pencatatan manual</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm sm:text-base">Memberikan laporan keuangan yang akurat dan real-time</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm sm:text-base">Meningkatkan partisipasi warga dalam pembayaran iuran</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technology Stack */}
        <Card className="mb-6 sm:mb-8">
          <CardHeader>
            <Award className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600 mb-2" />
            <CardTitle className="text-lg sm:text-xl">Teknologi yang Digunakan</CardTitle>
            <CardDescription>Stack teknologi modern untuk performa dan keamanan optimal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">Frontend</h3>
                <div className="space-y-1 text-xs sm:text-sm text-blue-700">
                  <p>React.js</p>
                  <p>Next.js 15</p>
                  <p>Tailwind CSS</p>
                  <p>shadcn/ui</p>
                </div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2 text-sm sm:text-base">Backend</h3>
                <div className="space-y-1 text-xs sm:text-sm text-green-700">
                  <p>Next.js API Routes</p>
                  <p>Supabase</p>
                  <p>NextAuth.js</p>
                  <p>PostgreSQL</p>
                </div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <h3 className="font-semibold text-purple-900 mb-2 text-sm sm:text-base">Analytics & Reports</h3>
                <div className="space-y-1 text-xs sm:text-sm text-purple-700">
                  <p>Chart.js</p>
                  <p>Recharts</p>
                  <p>PDF Export</p>
                  <p>Excel Export</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Impact */}
        <Card className="mb-6 sm:mb-8">
          <CardHeader>
            <Users className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-600 mb-2" />
            <CardTitle className="text-lg sm:text-xl">Dampak untuk Masyarakat</CardTitle>
            <CardDescription>Kontribusi nyata untuk kemajuan RW 08 Sambiroto</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-indigo-50 rounded-lg p-4 sm:p-6">
              <p className="text-base sm:text-lg text-indigo-900 leading-relaxed">
                Melalui RWPay, diharapkan pengelolaan keuangan RW menjadi lebih modern, transparan, dan efisien. Sistem
                ini tidak hanya membantu pengurus RW dalam administrasi, tetapi juga meningkatkan kepercayaan warga
                terhadap pengelolaan dana iuran. Dengan fitur pelaporan yang komprehensif, RW dapat membuat keputusan
                yang lebih baik berdasarkan data yang akurat dan terpercaya.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Siap Mencoba RWPay?</h2>
          <p className="text-gray-600 mb-6 text-sm sm:text-base">
            Bergabunglah dengan revolusi digital pengelolaan keuangan RW
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-md sm:max-w-none mx-auto">
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto text-sm sm:text-base">
                Lihat Dashboard
              </Button>
            </Link>
            <Link href="/" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto bg-transparent text-sm sm:text-base">
                Kembali ke Beranda
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
