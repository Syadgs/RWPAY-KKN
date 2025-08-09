"use client"

import React, { useState, useEffect } from "react"
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  Download,
  ArrowLeft,
  FileSpreadsheet,
  Menu,
} from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet"
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';


// --- Pengaturan Klien Supabase ---
// PENTING: Ganti nilai di bawah ini dengan URL dan Kunci Anon Supabase Anda.
// Error 'net::ERR_NAME_NOT_RESOLVED' terjadi karena URL di bawah ini tidak valid.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bqfyynmtdqjrcscshjvh.supabase.co'; // GANTI DENGAN URL ANDA
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'; // GANTI DENGAN KUNCI ANON ANDA

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Definisi Tipe Data ---
interface ResidentInfo {
    id: string;
    name: string;
}

interface PaidOneResidentInfo extends ResidentInfo {
    paid_type: 'LPS' | 'PAB';
}

interface Payment {
    amount: number;
    status: 'paid' | 'pending' | 'overdue';
    payment_date: string;
    payment_type: 'LPS' | 'PAB';
    resident_id: string;
}

interface MonthlyStat {
    month: string;
    lps_paid_amount: number;
    pab_paid_amount: number;
    total_paid_amount: number;
    paid_both_count: number;
    paid_one_count: number;
    unpaid_count: number;
    paid_both_residents: ResidentInfo[];
    paid_one_residents: PaidOneResidentInfo[];
    unpaid_residents: ResidentInfo[];
}


// --- Fungsi Pengambilan Data dari Supabase ---

async function getMonthlyStats(month: string): Promise<MonthlyStat | null> {
    console.log(`Fetching and calculating stats for ${month}...`);

    const year = parseInt(month.slice(0, 4));
    const monthIndex = parseInt(month.slice(5, 7)) - 1;
    const firstDay = new Date(year, monthIndex, 1).toISOString().slice(0, 10);
    const lastDay = new Date(year, monthIndex + 1, 0).toISOString().slice(0, 10);

    const { data: allResidents, error: residentsError } = await supabase
        .from('residents')
        .select('id, name')
        .eq('status', 'active');

    if (residentsError) {
        console.error("Error fetching total residents:", residentsError);
        return null;
    }

    const { data, error } = await supabase
        .from('payments')
        .select('amount, status, payment_type, resident_id')
        .gte('payment_date', firstDay)
        .lte('payment_date', lastDay);

    if (error) {
        console.error(`Error fetching payments for ${month}:`, error);
        return null;
    }
    
    const payments = data as Payment[];
    const paidPayments = payments.filter(p => p.status === 'paid');

    const lps_paid_amount = paidPayments.filter(p => p.payment_type === 'LPS').reduce((sum, p) => sum + p.amount, 0);
    const pab_paid_amount = paidPayments.filter(p => p.payment_type === 'PAB').reduce((sum, p) => sum + p.amount, 0);
    
    const residentPaymentStatus = new Map<string, { name: string, lps_paid: boolean, pab_paid: boolean }>();
    allResidents.forEach(r => {
        residentPaymentStatus.set(r.id, { name: r.name, lps_paid: false, pab_paid: false });
    });

    paidPayments.forEach(p => {
        const status = residentPaymentStatus.get(p.resident_id);
        if (status) {
            if (p.payment_type === 'LPS') {
                status.lps_paid = true;
            } else if (p.payment_type === 'PAB') {
                status.pab_paid = true;
            }
        }
    });

    const paid_both_residents: ResidentInfo[] = [];
    const paid_one_residents: PaidOneResidentInfo[] = [];
    const unpaid_residents: ResidentInfo[] = [];

    residentPaymentStatus.forEach((status, id) => {
        const residentInfo = { id, name: status.name };
        if (status.lps_paid && status.pab_paid) {
            paid_both_residents.push(residentInfo);
        } else if (status.lps_paid || status.pab_paid) {
            paid_one_residents.push({ ...residentInfo, paid_type: status.lps_paid ? 'LPS' : 'PAB' });
        } else {
            unpaid_residents.push(residentInfo);
        }
    });

    return {
        month: month,
        lps_paid_amount,
        pab_paid_amount,
        total_paid_amount: lps_paid_amount + pab_paid_amount,
        paid_both_count: paid_both_residents.length,
        paid_one_count: paid_one_residents.length,
        unpaid_count: unpaid_residents.length,
        paid_both_residents,
        paid_one_residents,
        unpaid_residents,
    };
}


// --- Fungsi Ekspor ---

const exportToCSV = (stat: MonthlyStat) => {
    const paidBothNames = stat.paid_both_residents.map(r => r.name).join(", ");
    const paidOneNames = stat.paid_one_residents.map(r => `${r.name} (${r.paid_type} Lunas)`).join(", ");
    const unpaidNames = stat.unpaid_residents.map(r => r.name).join(", ");

    const headers = "Kategori,Jumlah\n";
    const rows = [
        `Lunas Keduanya,${stat.paid_both_count}`,
        `Lunas Salah Satu,${stat.paid_one_count}`,
        `Belum Bayar,${stat.unpaid_count}`,
        `Pemasukan Iuran (LPS),${stat.lps_paid_amount}`,
        `Pemasukan Air (PAB),${stat.pab_paid_amount}`,
        `Total Pemasukan,${stat.total_paid_amount}`,
        `\nNama Warga Lunas Keduanya,"${paidBothNames}"`,
        `Nama Warga Lunas Salah Satu,"${paidOneNames}"`,
        `Nama Warga Belum Bayar,"${unpaidNames}"`
    ].join("\n");

    const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `laporan_${stat.month}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const exportToPDF = (stat: MonthlyStat, monthName: string) => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text(`Laporan Keuangan - ${monthName}`, 14, 22);
    
    doc.setFontSize(12);
    doc.text("Ringkasan", 14, 32);

    autoTable(doc, {
        startY: 36,
        head: [['Kategori', 'Jumlah']],
        body: [
            ['Lunas Keduanya (LPS & PAB)', stat.paid_both_count],
            ['Lunas Salah Satu', stat.paid_one_count],
            ['Belum Bayar', stat.unpaid_count],
            ['Pemasukan Iuran (LPS)', `Rp ${stat.lps_paid_amount.toLocaleString('id-ID')}`],
            ['Pemasukan Air (PAB)', `Rp ${stat.pab_paid_amount.toLocaleString('id-ID')}`],
            [{ content: 'Total Pemasukan', styles: { fontStyle: 'bold' } }, { content: `Rp ${stat.total_paid_amount.toLocaleString('id-ID')}`, styles: { fontStyle: 'bold' } }],
        ],
        theme: 'grid'
    });

    let finalY = (doc as any).lastAutoTable.finalY;

    const addResidentListToPDF = (title: string, residents: any[], startY: number, showPaidType = false) => {
        if (residents.length > 0) {
            doc.text(title, 14, startY + 10);
            autoTable(doc, {
                startY: startY + 14,
                head: showPaidType ? [['Nama Warga', 'Status']] : undefined,
                body: residents.map(r => showPaidType ? [r.name, `${r.paid_type} Lunas`] : [r.name]),
                theme: 'plain'
            });
            return (doc as any).lastAutoTable.finalY;
        }
        return startY;
    };

    finalY = addResidentListToPDF("Daftar Warga Lunas Keduanya", stat.paid_both_residents, finalY);
    finalY = addResidentListToPDF("Daftar Warga Lunas Salah Satu", stat.paid_one_residents, finalY, true);
    addResidentListToPDF("Daftar Warga Belum Bayar", stat.unpaid_residents, finalY);

    doc.save(`laporan_${stat.month}.pdf`);
};


export default function ReportsPage() {
  const [monthlyStat, setMonthlyStat] = useState<MonthlyStat | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  
  useEffect(() => {
    loadMonthlyReportData();
  }, [selectedMonth])

  const loadMonthlyReportData = async () => {
      setIsLoading(true);
      try {
          const monthlyData = await getMonthlyStats(selectedMonth);
          setMonthlyStat(monthlyData);
      } catch (error) {
          console.error("Error loading monthly report data:", error)
      } finally {
          setIsLoading(false);
      }
  }

  const handleExport = (format: 'csv' | 'pdf') => {
    if (!monthlyStat) return;
    setIsExporting(true);
    const monthName = new Date(selectedMonth + '-02').toLocaleDateString("id-ID", { year: 'numeric', month: 'long' });
    if (format === 'csv') {
        exportToCSV(monthlyStat);
    } else {
        exportToPDF(monthlyStat, monthName);
    }
    setIsExporting(false);
  }

  const uniqueMonthsForSelect = [...new Set(Array.from({ length: 24 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return date.toISOString().slice(0, 7);
  }))];

  const ExportMenu = () => (
    <div className="flex flex-col space-y-3 p-4 w-full">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button disabled={isExporting || !monthlyStat} className="w-full justify-start">
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Mengekspor..." : "Export Laporan"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => handleExport('csv')}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export Excel (CSV)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport('pdf')}>
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )

  if (isLoading && !monthlyStat) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Memuat laporan dari database...</p>
        </div>
      </div>
    )
  }

  const selectedMonthName = new Date(selectedMonth + '-02').toLocaleDateString("id-ID", { year: 'numeric', month: 'long' });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            {/* Left side */}
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <a href="/dashboard">
                <Button variant="ghost" size="sm" className="flex-shrink-0 p-2 sm:px-3">
                  <ArrowLeft className="h-4 w-4 mr-0 sm:mr-2" />
                  <span className="hidden sm:inline">Kembali</span>
                </Button>
              </a>
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
                  <Button disabled={isExporting || !monthlyStat} size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    <span className="hidden md:inline">{isExporting ? "Mengekspor..." : "Export Laporan"}</span>
                    <span className="md:hidden">{isExporting ? "Export..." : "Export"}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleExport('csv')}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export Excel (CSV)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('pdf')}>
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
                   <SheetHeader>
                    <SheetTitle className="sr-only">Menu Ekspor</SheetTitle>
                    <SheetDescription className="sr-only">
                      Pilih format untuk mengekspor laporan keuangan.
                    </SheetDescription>
                  </SheetHeader>
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
        {/* Monthly Report */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg sm:text-xl">Laporan Bulan {selectedMonthName}</CardTitle>
              <CardDescription className="text-sm">Rincian pemasukan dan status pembayaran untuk bulan yang dipilih.</CardDescription>
            </div>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Pilih bulan" />
              </SelectTrigger>
              <SelectContent>
                {uniqueMonthsForSelect.map((monthValue) => {
                  const date = new Date(monthValue + '-02');
                  const label = date.toLocaleDateString("id-ID", { year: "numeric", month: "long" });
                  return (
                    <SelectItem key={monthValue} value={monthValue}>
                      {label}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {isLoading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Memuat rincian bulan...</p>
                </div>
            ) : monthlyStat ? (
              <div className="space-y-8">
                {/* Rincian Pemasukan & Status */}
                <div className="space-y-4">
                    <h3 className="text-md font-semibold">Ringkasan Bulan Ini</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Rincian Pemasukan */}
                        <div className="space-y-3 p-4 border rounded-lg">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Pemasukan Iuran Warga (LPS)</span>
                                <span className="font-medium">Rp {monthlyStat.lps_paid_amount.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Pemasukan Air Bersih (PAB)</span>
                                <span className="font-medium">Rp {monthlyStat.pab_paid_amount.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between items-center border-t pt-3 mt-3">
                                <span className="font-semibold text-base">Total Pemasukan</span>
                                <span className="font-bold text-lg text-blue-600">Rp {monthlyStat.total_paid_amount.toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                        {/* Status Pembayaran */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                                <p className="text-3xl font-bold text-green-600">{monthlyStat.paid_both_count}</p>
                                <p className="text-sm text-muted-foreground">Lunas Keduanya</p>
                            </div>
                            <div className="text-center p-4 bg-yellow-50 rounded-lg">
                                <p className="text-3xl font-bold text-yellow-600">{monthlyStat.paid_one_count}</p>
                                <p className="text-sm text-muted-foreground">Lunas Salah Satu</p>
                            </div>
                            <div className="text-center p-4 bg-red-50 rounded-lg">
                                <p className="text-3xl font-bold text-red-600">{monthlyStat.unpaid_count}</p>
                                <p className="text-sm text-muted-foreground">Belum Bayar</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Daftar Warga */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div>
                        <h3 className="text-md font-semibold mb-4">Daftar Warga Lunas Keduanya</h3>
                        <div className="p-4 border rounded-lg h-64 overflow-y-auto">
                            {monthlyStat.paid_both_residents.length > 0 ? (
                                <ul className="space-y-2">
                                    {monthlyStat.paid_both_residents.map(resident => (
                                        <li key={resident.id} className="text-sm text-muted-foreground">{resident.name}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center mt-8">Tidak ada.</p>
                            )}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-md font-semibold mb-4">Daftar Warga Lunas Salah Satu</h3>
                         <div className="p-4 border rounded-lg h-64 overflow-y-auto">
                            {monthlyStat.paid_one_residents.length > 0 ? (
                                <ul className="space-y-3">
                                    {monthlyStat.paid_one_residents.map(resident => (
                                        <li key={resident.id} className="flex justify-between items-center text-sm text-muted-foreground">
                                            <span>{resident.name}</span>
                                            <Badge variant="outline" className={resident.paid_type === 'LPS' ? 'border-blue-500 text-blue-500' : 'border-cyan-500 text-cyan-500'}>
                                                {resident.paid_type} Lunas
                                            </Badge>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center mt-8">Tidak ada.</p>
                            )}
                        </div>
                    </div>
                     <div>
                        <h3 className="text-md font-semibold mb-4">Daftar Warga Belum Bayar</h3>
                         <div className="p-4 border rounded-lg h-64 overflow-y-auto">
                            {monthlyStat.unpaid_residents.length > 0 ? (
                                <ul className="space-y-2">
                                    {monthlyStat.unpaid_residents.map(resident => (
                                        <li key={resident.id} className="text-sm text-muted-foreground">{resident.name}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center mt-8">Semua warga sudah lunas.</p>
                            )}
                        </div>
                    </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Data untuk bulan ini tidak ditemukan.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
