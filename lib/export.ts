import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import "jspdf-autotable"
import { getPayments } from "./payments"
import { getResidents } from "./residents"
import { getMonthlyStats } from "./dashboard"
// Impor ini sekarang akan berhasil karena file settings.ts sudah diperbaiki
import { getRWInfo } from "./settings"

// Extend jsPDF type untuk menambahkan fungsionalitas autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

// --- PERBAIKAN: Menentukan tipe spesifik untuk status pembayaran ---
type PaymentStatus = "pending" | "paid" | "overdue";

// Ekspor data warga ke Excel
export async function exportResidentsToExcel() {
  try {
    const residents = await getResidents()
    const rwInfo = await getRWInfo()

    // Siapkan data untuk Excel
    const excelData = residents.map((resident, index) => ({
      "No": index + 1,
      "Nama": resident.name,
      "No. Rumah": resident.house_number,
      "Alamat": resident.address || "-",
      "Telepon": resident.phone || "-",
      "Email": resident.email || "-",
      "Status": resident.status === "active" ? "Aktif" : "Tidak Aktif",
      "Tanggal Daftar": new Date(resident.created_at).toLocaleDateString("id-ID"),
    }))

    // Buat workbook dan worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)

    // Atur lebar kolom
    ws["!cols"] = [
      { wch: 5 }, { wch: 25 }, { wch: 12 }, { wch: 30 }, { wch: 15 },
      { wch: 25 }, { wch: 12 }, { wch: 15 }
    ]

    // Tambahkan worksheet ke workbook
    XLSX.utils.book_append_sheet(wb, ws, "Data Warga")

    // Buat nama file dengan tanggal saat ini
    const currentDate = new Date().toISOString().split("T")[0]
    const filename = `Data_Warga_${rwInfo.name.replace(/\s+/g, "_")}_${currentDate}.xlsx`

    // Simpan file
    XLSX.writeFile(wb, filename)
    return { success: true, filename }
  } catch (error) {
    console.error("Error exporting residents to Excel:", error)
    throw new Error("Gagal mengekspor data warga ke Excel")
  }
}

// Ekspor data pembayaran ke Excel
export async function exportPaymentsToExcel(filters?: { month?: string; year?: string; status?: PaymentStatus }) {
  try {
    // Error tipe data di sini sekarang sudah teratasi
    const payments = await getPayments(filters)
    const rwInfo = await getRWInfo()

    // Siapkan data untuk Excel
    const excelData = payments.map((payment, index) => ({
      "No": index + 1,
      "Nama": payment.resident?.name || "-",
      "No. Rumah": payment.resident?.house_number || "-",
      "Jumlah": payment.amount,
      "Tanggal Bayar": new Date(payment.payment_date).toLocaleDateString("id-ID"),
      "Jatuh Tempo": new Date(payment.due_date).toLocaleDateString("id-ID"),
      "Status": payment.status === "paid" ? "Lunas" : payment.status === "pending" ? "Belum Bayar" : "Terlambat",
      "Metode Bayar": payment.payment_method || "-",
      "Catatan": payment.notes || "-",
    }))

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)
    ws["!cols"] = [
      { wch: 5 }, { wch: 25 }, { wch: 12 }, { wch: 15 }, { wch: 15 },
      { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 30 }
    ]
    XLSX.utils.book_append_sheet(wb, ws, "Data Pembayaran")

    const currentDate = new Date().toISOString().split("T")[0]
    const filename = `Data_Pembayaran_${rwInfo.name.replace(/\s+/g, "_")}_${currentDate}.xlsx`
    XLSX.writeFile(wb, filename)
    return { success: true, filename }
  } catch (error) {
    console.error("Error exporting payments to Excel:", error)
    throw new Error("Gagal mengekspor data pembayaran ke Excel")
  }
}

// Ekspor laporan keuangan ke Excel
export async function exportFinancialReportToExcel() {
  try {
    const monthlyStats = await getMonthlyStats(12)
    const rwInfo = await getRWInfo()

    // Siapkan data untuk Excel
    const excelData = monthlyStats.map((stat, index) => ({
      "No": index + 1,
      "Bulan": new Date(stat.month).toLocaleDateString("id-ID", { year: "numeric", month: "long" }),
      "Total Pembayaran": stat.total_payments,
      "Lunas": stat.paid_count,
      "Belum Bayar": stat.pending_count,
      "Terlambat": stat.overdue_count,
      "Total Pemasukan": stat.paid_amount || 0,
      "Persentase Kepatuhan": `${Math.round((stat.paid_count / stat.total_payments) * 100)}%`,
    }))

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)
    ws["!cols"] = [
      { wch: 5 }, { wch: 15 }, { wch: 18 }, { wch: 10 }, { wch: 12 },
      { wch: 12 }, { wch: 18 }, { wch: 18 }
    ]
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Keuangan")

    const currentDate = new Date().toISOString().split("T")[0]
    const filename = `Laporan_Keuangan_${rwInfo.name.replace(/\s+/g, "_")}_${currentDate}.xlsx`
    XLSX.writeFile(wb, filename)
    return { success: true, filename }
  } catch (error) {
    console.error("Error exporting financial report to Excel:", error)
    throw new Error("Gagal mengekspor laporan keuangan ke Excel")
  }
}

// Ekspor data warga ke PDF
export async function exportResidentsToPDF() {
  try {
    const residents = await getResidents()
    const rwInfo = await getRWInfo()
    const doc = new jsPDF()

    doc.setFontSize(16)
    doc.text("LAPORAN DATA WARGA", 105, 20, { align: "center" })
    doc.setFontSize(12)
    doc.text(rwInfo.name, 105, 30, { align: "center" })
    doc.text(rwInfo.address, 105, 37, { align: "center" })
    doc.setFontSize(10)
    doc.text(`Tanggal: ${new Date().toLocaleDateString("id-ID")}`, 20, 50)

    const tableData = residents.map((resident, index) => [
      index + 1,
      resident.name,
      resident.house_number,
      resident.phone || "-",
      resident.status === "active" ? "Aktif" : "Tidak Aktif",
    ])

    doc.autoTable({
      head: [["No", "Nama", "No. Rumah", "Telepon", "Status"]],
      body: tableData,
      startY: 60,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [66, 139, 202] },
    })

    const finalY = (doc as any).lastAutoTable.finalY + 10
    doc.setFontSize(10)
    doc.text(`Total Warga: ${residents.length}`, 20, finalY)
    doc.text(`Warga Aktif: ${residents.filter((r) => r.status === "active").length}`, 20, finalY + 7)
    doc.text(`Warga Tidak Aktif: ${residents.filter((r) => r.status === "inactive").length}`, 20, finalY + 14)

    const currentDate = new Date().toISOString().split("T")[0]
    const filename = `Data_Warga_${rwInfo.name.replace(/\s+/g, "_")}_${currentDate}.pdf`
    doc.save(filename)
    return { success: true, filename }
  } catch (error) {
    console.error("Error exporting residents to PDF:", error)
    throw new Error("Gagal mengekspor data warga ke PDF")
  }
}

// Ekspor data pembayaran ke PDF
export async function exportPaymentsToPDF(filters?: { month?: string; year?: string; status?: PaymentStatus }) {
  try {
    // Error tipe data di sini sekarang sudah teratasi
    const payments = await getPayments(filters)
    const rwInfo = await getRWInfo()
    const doc = new jsPDF()

    doc.setFontSize(16)
    doc.text("LAPORAN DATA PEMBAYARAN", 105, 20, { align: "center" })
    doc.setFontSize(12)
    doc.text(rwInfo.name, 105, 30, { align: "center" })
    doc.text(rwInfo.address, 105, 37, { align: "center" })
    doc.setFontSize(10)
    doc.text(`Tanggal: ${new Date().toLocaleDateString("id-ID")}`, 20, 50)
    if (filters?.month && filters?.year) {
      doc.text(`Periode: ${filters.month}/${filters.year}`, 20, 57)
    }

    const tableData = payments.map((payment, index) => [
      index + 1,
      payment.resident?.name || "-",
      payment.resident?.house_number || "-",
      `Rp ${payment.amount.toLocaleString("id-ID")}`,
      new Date(payment.payment_date).toLocaleDateString("id-ID"),
      payment.status === "paid" ? "Lunas" : payment.status === "pending" ? "Belum Bayar" : "Terlambat",
    ])

    doc.autoTable({
      head: [["No", "Nama", "No. Rumah", "Jumlah", "Tgl Bayar", "Status"]],
      body: tableData,
      startY: 65,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] },
    })

    const finalY = (doc as any).lastAutoTable.finalY + 10
    const totalAmount = payments.reduce((sum, p) => sum + (p.status === "paid" ? p.amount : 0), 0)
    const paidCount = payments.filter((p) => p.status === "paid").length
    const pendingCount = payments.filter((p) => p.status === "pending").length
    const overdueCount = payments.filter((p) => p.status === "overdue").length

    doc.setFontSize(10)
    doc.text(`Total Pembayaran: ${payments.length}`, 20, finalY)
    doc.text(`Lunas: ${paidCount}`, 20, finalY + 7)
    doc.text(`Belum Bayar: ${pendingCount}`, 20, finalY + 14)
    doc.text(`Terlambat: ${overdueCount}`, 20, finalY + 21)
    doc.text(`Total Pemasukan: Rp ${totalAmount.toLocaleString("id-ID")}`, 20, finalY + 28)

    const currentDate = new Date().toISOString().split("T")[0]
    const filename = `Data_Pembayaran_${rwInfo.name.replace(/\s+/g, "_")}_${currentDate}.pdf`
    doc.save(filename)
    return { success: true, filename }
  } catch (error) {
    console.error("Error exporting payments to PDF:", error)
    throw new Error("Gagal mengekspor data pembayaran ke PDF")
  }
}

// Ekspor laporan keuangan ke PDF
export async function exportFinancialReportToPDF() {
  try {
    const monthlyStats = await getMonthlyStats(12)
    const rwInfo = await getRWInfo()
    const doc = new jsPDF()

    doc.setFontSize(16)
    doc.text("LAPORAN KEUANGAN BULANAN", 105, 20, { align: "center" })
    doc.setFontSize(12)
    doc.text(rwInfo.name, 105, 30, { align: "center" })
    doc.text(rwInfo.address, 105, 37, { align: "center" })
    doc.setFontSize(10)
    doc.text(`Tanggal: ${new Date().toLocaleDateString("id-ID")}`, 20, 50)

    const tableData = monthlyStats.map((stat, index) => [
      index + 1,
      new Date(stat.month).toLocaleDateString("id-ID", { year: "numeric", month: "long" }),
      stat.total_payments,
      stat.paid_count,
      stat.pending_count,
      stat.overdue_count,
      `Rp ${(stat.paid_amount || 0).toLocaleString("id-ID")}`,
    ])

    doc.autoTable({
      head: [["No", "Bulan", "Total", "Lunas", "Pending", "Terlambat", "Pemasukan"]],
      body: tableData,
      startY: 60,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] },
    })

    const finalY = (doc as any).lastAutoTable.finalY + 10
    const totalIncome = monthlyStats.reduce((sum, stat) => sum + (stat.paid_amount || 0), 0)
    const totalPayments = monthlyStats.reduce((sum, stat) => sum + stat.total_payments, 0)
    const totalPaid = monthlyStats.reduce((sum, stat) => sum + stat.paid_count, 0)

    doc.setFontSize(10)
    doc.text("RINGKASAN:", 20, finalY)
    doc.text(`Total Pembayaran (12 bulan): ${totalPayments}`, 20, finalY + 10)
    doc.text(`Total Lunas: ${totalPaid}`, 20, finalY + 17)
    doc.text(`Total Pemasukan: Rp ${totalIncome.toLocaleString("id-ID")}`, 20, finalY + 24)
    if (totalPayments > 0) {
      doc.text(`Rata-rata Kepatuhan: ${Math.round((totalPaid / totalPayments) * 100)}%`, 20, finalY + 31)
    }

    const currentDate = new Date().toISOString().split("T")[0]
    const filename = `Laporan_Keuangan_${rwInfo.name.replace(/\s+/g, "_")}_${currentDate}.pdf`
    doc.save(filename)
    return { success: true, filename }
  } catch (error) {
    console.error("Error exporting financial report to PDF:", error)
    throw new Error("Gagal mengekspor laporan keuangan ke PDF")
  }
}
