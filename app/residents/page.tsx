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
import { Users, Plus, Search, Edit, Trash2, ArrowLeft, Download, FileSpreadsheet, FileText, Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Link from "next/link"
import { getResidents, deleteResident } from "@/lib/residents"
import { exportResidentsToExcel, exportResidentsToPDF } from "@/lib/export"
import { ResidentForm } from "@/components/residents/resident-form"
import type { Resident } from "@/lib/supabase"

export default function ResidentsPage() {
  const [residents, setResidents] = useState<Resident[]>([])
  const [filteredResidents, setFilteredResidents] = useState<Resident[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [showForm, setShowForm] = useState(false)
  const [editingResident, setEditingResident] = useState<Resident | undefined>()

  useEffect(() => {
    loadResidents()
  }, [])

  useEffect(() => {
    filterResidents()
  }, [residents, searchTerm, statusFilter])

  const loadResidents = async () => {
    try {
      const data = await getResidents()
      setResidents(data)
    } catch (error) {
      console.error("Error loading residents:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterResidents = () => {
    let filtered = residents

    if (statusFilter !== "all") {
      filtered = filtered.filter((resident) => resident.status === statusFilter)
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (resident) =>
          resident.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          resident.house_number.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    setFilteredResidents(filtered)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteResident(id)
      await loadResidents()
    } catch (error) {
      console.error("Error deleting resident:", error)
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingResident(undefined)
    loadResidents()
  }

  const handleExportExcel = async () => {
    setIsExporting(true)
    try {
      await exportResidentsToExcel()
      alert("Data warga berhasil diekspor ke Excel!")
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
      await exportResidentsToPDF()
      alert("Data warga berhasil diekspor ke PDF!")
    } catch (error) {
      alert("Gagal mengekspor data ke PDF")
      console.error("Export error:", error)
    } finally {
      setIsExporting(false)
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
          <Button onClick={() => setEditingResident(undefined)} className="w-full justify-start">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Warga
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingResident ? "Edit Warga" : "Tambah Warga Baru"}</DialogTitle>
          </DialogHeader>
          <ResidentForm resident={editingResident} onSuccess={handleFormSuccess} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Memuat data warga...</p>
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
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
                <h1 className="text-base sm:text-lg lg:text-2xl font-bold text-gray-900 truncate">
                  <span className="hidden sm:inline">Data Warga</span>
                  <span className="sm:hidden">Warga</span>
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
                  <Button onClick={() => setEditingResident(undefined)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="hidden lg:inline">Tambah Warga</span>
                    <span className="lg:hidden">Tambah</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingResident ? "Edit Warga" : "Tambah Warga Baru"}</DialogTitle>
                  </DialogHeader>
                  <ResidentForm
                    resident={editingResident}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Warga</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{residents.length}</div>
              <p className="text-xs text-muted-foreground">Kepala keluarga terdaftar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Warga Aktif</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {residents.filter((r) => r.status === "active").length}
              </div>
              <p className="text-xs text-muted-foreground">Membayar iuran rutin</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Warga Tidak Aktif</CardTitle>
              <Users className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {residents.filter((r) => r.status === "inactive").length}
              </div>
              <p className="text-xs text-muted-foreground">Tidak membayar iuran</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filter & Pencarian</CardTitle>
            <CardDescription>Cari dan filter data warga</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Cari nama atau nomor rumah..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value: "all" | "active" | "inactive") => setStatusFilter(value)}
              >
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Tidak Aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Residents Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Warga</CardTitle>
            <CardDescription>
              Menampilkan {filteredResidents.length} dari {residents.length} warga
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>No. Rumah</TableHead>
                    <TableHead>Telepon</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResidents.map((resident) => (
                    <TableRow key={resident.id}>
                      <TableCell className="font-medium">{resident.name}</TableCell>
                      <TableCell>{resident.house_number}</TableCell>
                      <TableCell>{resident.phone || "-"}</TableCell>
                      <TableCell>{resident.email || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={resident.status === "active" ? "default" : "secondary"}>
                          {resident.status === "active" ? "Aktif" : "Tidak Aktif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingResident(resident)
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
                                <AlertDialogTitle>Hapus Warga</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Apakah Anda yakin ingin menghapus data warga {resident.name}? Tindakan ini tidak dapat
                                  dibatalkan dan akan menghapus semua data pembayaran terkait.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(resident.id)}>Hapus</AlertDialogAction>
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
            <div className="md:hidden space-y-4">
              {filteredResidents.map((resident) => (
                <Card key={resident.id} className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-base truncate">{resident.name}</h3>
                      <p className="text-sm text-gray-600">Rumah {resident.house_number}</p>
                    </div>
                    <Badge
                      variant={resident.status === "active" ? "default" : "secondary"}
                      className="text-xs ml-2 flex-shrink-0"
                    >
                      {resident.status === "active" ? "Aktif" : "Tidak Aktif"}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Telepon:</span>
                      <span className="truncate ml-2">{resident.phone || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="truncate ml-2">{resident.email || "-"}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2 mt-4 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-transparent"
                      onClick={() => {
                        setEditingResident(resident)
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
                          <AlertDialogTitle>Hapus Warga</AlertDialogTitle>
                          <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus data warga {resident.name}? Tindakan ini tidak dapat
                            dibatalkan dan akan menghapus semua data pembayaran terkait.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(resident.id)}>Hapus</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </Card>
              ))}
            </div>

            {filteredResidents.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm || statusFilter !== "all"
                    ? "Tidak ada warga yang sesuai dengan filter"
                    : "Belum ada data warga"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
