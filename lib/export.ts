import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import "jspdf-autotable"
import { getPayments } from "./payments"
import { getResidents } from "./residents"
import { getMonthlyStats } from "./dashboard"
import { getRWInfo } from "./settings"

// Extend jsPDF type to include autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

// Export residents to Excel
export async function exportResidentsToExcel() {
  try {
    const residents = await getResidents()
    const rwInfo = await getRWInfo()

    // Prepare data for Excel
    const excelData = residents.map((resident, index) => ({
      No: index + 1,
      Nama: resident.name,
      "No. Rumah": resident.house_number,
      Alamat: resident.address || "-",
      Telepon: resident.phone || "-",
      Email: resident.email || "-",
      Status: resident.status === "active" ? "Aktif" : "Tidak Aktif",
      "Tanggal Daftar": new Date(resident.created_at).toLocaleDateString("id-ID"),
    }))

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)

    // Set column widths
    const colWidths = [
      { wch: 5 }, // No
      { wch: 25 }, // Nama
      { wch: 12 }, // No. Rumah
      { wch: 30 }, // Alamat
      { wch: 15 }, // Telepon
      { wch: 25 }, // Email
      { wch: 12 }, // Status
      { wch: 15 }, // Tanggal Daftar
    ]
    ws["!cols"] = colWidths

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Data Warga")

    // Generate filename with current date
    const currentDate = new Date().toISOString().split("T")[0]
    const filename = `Data_Warga_${rwInfo.name.replace(/\s+/g, "_")}_${currentDate}.xlsx`

    // Save file
    XLSX.writeFile(wb, filename)

    return { success: true, filename }
  } catch (error) {
    console.error("Error exporting residents to Excel:", error)
    throw new Error("Gagal mengekspor data warga ke Excel")
  }
}

// Export payments to Excel
export async function exportPaymentsToExcel(filters?: {
  month?: string
  year?: string
  status?: string
}) {
  try {
    const payments = await getPayments(filters)
    const rwInfo = await getRWInfo()

    // Prepare data for Excel
    const excelData = payments.map((payment, index) => ({
      No: index + 1,
      Nama: payment.resident?.name || "-",
      "No. Rumah": payment.resident?.house_number || "-",
      Jumlah: payment.amount,
      "Tanggal Bayar": new Date(payment.payment_date).toLocaleDateString("id-ID"),
      "Jatuh Tempo": new Date(payment.due_date).toLocaleDateString("id-ID"),
      Status: payment.status === "paid" ? "Lunas" : payment.status === "pending" ? "Belum Bayar" : "Terlambat",
      "Metode Bayar": payment.payment_method || "-",
      Catatan: payment.notes || "-",
    }))

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)

    // Set column widths
    const colWidths = [
      { wch: 5 }, // No
      { wch: 25 }, // Nama
      { wch: 12 }, // No. Rumah
      { wch: 15 }, // Jumlah
      { wch: 15 }, // Tanggal Bayar
      { wch: 15 }, // Jatuh Tempo
      { wch: 12 }, // Status
      { wch: 15 }, // Metode Bayar
      { wch: 30 }, // Catatan
    ]
    ws["!cols"] = colWidths

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Data Pembayaran")

    // Generate filename with current date
    const currentDate = new Date().toISOString().split("T")[0]
    const filename = `Data_Pembayaran_${rwInfo.name.replace(/\s+/g, "_")}_${currentDate}.xlsx`

    // Save file
    XLSX.writeFile(wb, filename)

    return { success: true, filename }
  } catch (error) {
    console.error("Error exporting payments to Excel:", error)
    throw new Error("Gagal mengekspor data pembayaran ke Excel")
  }
}

// Export financial report to Excel
export async function exportFinancialReportToExcel() {
  try {
    const monthlyStats = await getMonthlyStats(12)
    const rwInfo = await getRWInfo()

    // Prepare data for Excel
    const excelData = monthlyStats.map((stat, index) => ({
      No: index + 1,
      Bulan: new Date(stat.month).toLocaleDateString("id-ID", { year: "numeric", month: "long" }),
      "Total Pembayaran": stat.total_payments,
      Lunas: stat.paid_count,
      "Belum Bayar": stat.pending_count,
      Terlambat: stat.overdue_count,
      "Total Pemasukan": stat.paid_amount || 0,
      "Persentase Kepatuhan": `${Math.round((stat.paid_count / stat.total_payments) * 100)}%`,
    }))

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)

    // Set column widths
    const colWidths = [
      { wch: 5 }, // No
      { wch: 15 }, // Bulan
      { wch: 18 }, // Total Pembayaran
      { wch: 10 }, // Lunas
      { wch: 12 }, // Belum Bayar
      { wch: 12 }, // Terlambat
      { wch: 18 }, // Total Pemasukan
      { wch: 18 }, // Persentase Kepatuhan
    ]
    ws["!cols"] = colWidths

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Keuangan")

    // Generate filename with current date
    const currentDate = new Date().toISOString().split("T")[0]
    const filename = `Laporan_Keuangan_${rwInfo.name.replace(/\s+/g, "_")}_${currentDate}.xlsx`

    // Save file
    XLSX.writeFile(wb, filename)

    return { success: true, filename }
  } catch (error) {
    console.error("Error exporting financial report to Excel:", error)
    throw new Error("Gagal mengekspor laporan keuangan ke Excel")
  }
}

// Export residents to PDF
export async function exportResidentsToPDF() {
  try {
    const residents = await getResidents()
    const rwInfo = await getRWInfo()

    const doc = new jsPDF()

    // Add title
    doc.setFontSize(16)
    doc.text("LAPORAN DATA WARGA", 105, 20, { align: "center" })

    doc.setFontSize(12)
    doc.text(rwInfo.name, 105, 30, { align: "center" })
    doc.text(rwInfo.address, 105, 37, { align: "center" })

    // Add date
    doc.setFontSize(10)
    doc.text(`Tanggal: ${new Date().toLocaleDateString("id-ID")}`, 20, 50)

    // Prepare table data
    const tableData = residents.map((resident, index) => [
      index + 1,
      resident.name,
      resident.house_number,
      resident.phone || "-",
      resident.status === "active" ? "Aktif" : "Tidak Aktif",
    ])

    // Add table
    doc.autoTable({
      head: [["No", "Nama", "No. Rumah", "Telepon", "Status"]],
      body: tableData,
      startY: 60,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [66, 139, 202] },
    })

    // Add summary
    const finalY = (doc as any).lastAutoTable.finalY + 10
    doc.setFontSize(10)
    doc.text(`Total Warga: ${residents.length}`, 20, finalY)
    doc.text(`Warga Aktif: ${residents.filter((r) => r.status === "active").length}`, 20, finalY + 7)
    doc.text(`Warga Tidak Aktif: ${residents.filter((r) => r.status === "inactive").length}`, 20, finalY + 14)

    // Generate filename and save
    const currentDate = new Date().toISOString().split("T")[0]
    const filename = `Data_Warga_${rwInfo.name.replace(/\s+/g, "_")}_${currentDate}.pdf`

    doc.save(filename)

    return { success: true, filename }
  } catch (error) {
    console.error("Error exporting residents to PDF:", error)
    throw new Error("Gagal mengekspor data warga ke PDF")
  }
}

// Export payments to PDF
export async function exportPaymentsToPDF(filters?: {
  month?: string
  year?: string
  status?: string
}) {
  try {
    const payments = await getPayments(filters)
    const rwInfo = await getRWInfo()

    const doc = new jsPDF()

    // Add title
    doc.setFontSize(16)
    doc.text("LAPORAN DATA PEMBAYARAN", 105, 20, { align: "center" })

    doc.setFontSize(12)
    doc.text(rwInfo.name, 105, 30, { align: "center" })
    doc.text(rwInfo.address, 105, 37, { align: "center" })

    // Add date and filters
    doc.setFontSize(10)
    doc.text(`Tanggal: ${new Date().toLocaleDateString("id-ID")}`, 20, 50)

    if (filters?.month && filters?.year) {
      doc.text(`Periode: ${filters.month}/${filters.year}`, 20, 57)
    }

    // Prepare table data
    const tableData = payments.map((payment, index) => [
      index + 1,
      payment.resident?.name || "-",
      payment.resident?.house_number || "-",
      `Rp ${payment.amount.toLocaleString("id-ID")}`,
      new Date(payment.payment_date).toLocaleDateString("id-ID"),
      payment.status === "paid" ? "Lunas" : payment.status === "pending" ? "Belum Bayar" : "Terlambat",
    ])

    // Add table
    doc.autoTable({
      head: [["No", "Nama", "No. Rumah", "Jumlah", "Tgl Bayar", "Status"]],
      body: tableData,
      startY: 65,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] },
    })

    // Add summary
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

    // Generate filename and save
    const currentDate = new Date().toISOString().split("T")[0]
    const filename = `Data_Pembayaran_${rwInfo.name.replace(/\s+/g, "_")}_${currentDate}.pdf`

    doc.save(filename)

    return { success: true, filename }
  } catch (error) {
    console.error("Error exporting payments to PDF:", error)
    throw new Error("Gagal mengekspor data pembayaran ke PDF")
  }
}

// Export financial report to PDF
export async function exportFinancialReportToPDF() {
  try {
    const monthlyStats = await getMonthlyStats(12)
    const rwInfo = await getRWInfo()

    const doc = new jsPDF()

    // Add title
    doc.setFontSize(16)
    doc.text("LAPORAN KEUANGAN BULANAN", 105, 20, { align: "center" })

    doc.setFontSize(12)
    doc.text(rwInfo.name, 105, 30, { align: "center" })
    doc.text(rwInfo.address, 105, 37, { align: "center" })

    // Add date
    doc.setFontSize(10)
    doc.text(`Tanggal: ${new Date().toLocaleDateString("id-ID")}`, 20, 50)

    // Prepare table data
    const tableData = monthlyStats.map((stat, index) => [
      index + 1,
      new Date(stat.month).toLocaleDateString("id-ID", { year: "numeric", month: "long" }),
      stat.total_payments,
      stat.paid_count,
      stat.pending_count,
      stat.overdue_count,
      `Rp ${(stat.paid_amount || 0).toLocaleString("id-ID")}`,
    ])

    // Add table
    doc.autoTable({
      head: [["No", "Bulan", "Total", "Lunas", "Pending", "Terlambat", "Pemasukan"]],
      body: tableData,
      startY: 60,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] },
    })

    // Add summary
    const finalY = (doc as any).lastAutoTable.finalY + 10
    const totalIncome = monthlyStats.reduce((sum, stat) => sum + (stat.paid_amount || 0), 0)
    const totalPayments = monthlyStats.reduce((sum, stat) => sum + stat.total_payments, 0)
    const totalPaid = monthlyStats.reduce((sum, stat) => sum + stat.paid_count, 0)

    doc.setFontSize(10)
    doc.text("RINGKASAN:", 20, finalY)
    doc.text(`Total Pembayaran (12 bulan): ${totalPayments}`, 20, finalY + 10)
    doc.text(`Total Lunas: ${totalPaid}`, 20, finalY + 17)
    doc.text(`Total Pemasukan: Rp ${totalIncome.toLocaleString("id-ID")}`, 20, finalY + 24)
    doc.text(`Rata-rata Kepatuhan: ${Math.round((totalPaid / totalPayments) * 100)}%`, 20, finalY + 31)

    // Generate filename and save
    const currentDate = new Date().toISOString().split("T")[0]
    const filename = `Laporan_Keuangan_${rwInfo.name.replace(/\s+/g, "_")}_${currentDate}.pdf`

    doc.save(filename)

    return { success: true, filename }
  } catch (error) {
    console.error("Error exporting financial report to PDF:", error)
    throw new Error("Gagal mengekspor laporan keuangan ke PDF")
  }
}
