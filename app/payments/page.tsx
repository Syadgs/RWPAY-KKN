"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination"
import {
  DollarSign,
  Search,
  ArrowLeft,
  CheckCircle,
  Download,
  FileText,
  Filter,
  Users,
  Zap,
  Droplets,
  Calendar,
  Loader2,
  Printer,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';

// --- Supabase Client Setup ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bqfyynmtdqjrcscshjvh.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxZnl5bm10ZHFqcmNzY3NoanZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTI5ODQyMTIsImV4cCI6MjAyODU2MDIxMn0.i5a234i5V5-S1BEa-p3p2JoS3o_tN4D9z-J5i_w2xJg';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Type Definitions ---
interface Resident { id: string; name: string; house_number: string; rt: string; }
interface Payment {
  id: string;
  resident_id: string;
  amount: number;
  status: string;
  payment_type: 'LPS' | 'PAB';
  invoice_number: string;
  invoice_date: string;
  cubic_meters?: number;
}
interface MeterReading { resident_id: string; reading: number; }

interface ResidentWithData extends Resident {
  lps_payment?: Payment;
  pab_payment?: Payment;
  meter_reading?: number;
}

interface PaymentToConfirm {
    resident: ResidentWithData;
    type: 'LPS' | 'PAB';
}

const ITEMS_PER_PAGE = 10;

// --- Data Fetching Function ---
async function getDataForMonth(month: string) {
    const year = parseInt(month.slice(0, 4));
    const monthIndex = parseInt(month.slice(5, 7)) - 1;
    const firstDay = new Date(year, monthIndex, 1).toISOString().slice(0, 10);
    const lastDay = new Date(year, monthIndex + 1, 0).toISOString().slice(0, 10);

    const residentsPromise = supabase.from('residents').select('id, name, house_number, rt').eq('status', 'active');
    const paymentsPromise = supabase.from('payments').select('*').gte('payment_date', firstDay).lte('payment_date', lastDay);
    const settingsPromise = supabase.from('settings').select('key, value');
    const meterReadingsPromise = supabase.from('meter_readings').select('resident_id, reading').eq('month', month);

    const [{ data: residentsData, error: resError }, { data: paymentsData, error: payError }, { data: settingsData, error: setError }, { data: meterReadingsData, error: meterError }] = await Promise.all([residentsPromise, paymentsPromise, settingsPromise, meterReadingsPromise]);

    if (resError || payError || setError || meterError) {
        console.error("Error loading data:", resError || payError || setError || meterError);
        throw new Error("Gagal memuat data");
    }

    const settings = {
        monthlyDues: parseFloat(settingsData?.find(s => s.key === 'monthly_fee')?.value || '50000'),
        pabRate: parseFloat(settingsData?.find(s => s.key === 'pab_rate')?.value || '5000'),
    };

    return { residentsData, paymentsData, settings, meterReadingsData };
}

export default function PaymentsPage() {
  const [residents, setResidents] = useState<ResidentWithData[]>([]);
  const [filteredResidents, setFilteredResidents] = useState<ResidentWithData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [rtFilter, setRtFilter] = useState<string>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<"all" | "paid" | "unpaid" | "partial">("all");
  const [lpsRate, setLpsRate] = useState(0);
  const [pabRate, setPabRate] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));

  // State for modals
  const [paymentToConfirm, setPaymentToConfirm] = useState<PaymentToConfirm | null>(null);
  const [generatedInvoice, setGeneratedInvoice] = useState<Payment | null>(null);

  const rtOptions = useMemo(() => Array.from(new Set(residents.map(r => r.rt))).sort(), [residents]);
  const totalPages = Math.ceil(filteredResidents.length / ITEMS_PER_PAGE);
  const currentResidents = filteredResidents.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const loadData = async () => {
    try {
      const { residentsData, paymentsData, settings, meterReadingsData } = await getDataForMonth(selectedMonth);
      setLpsRate(settings.monthlyDues);
      setPabRate(settings.pabRate);

      const meterReadingsMap = new Map(meterReadingsData.map(r => [r.resident_id, r.reading]));

      const residentsWithData = residentsData.map(resident => ({
        ...resident,
        lps_payment: paymentsData.find(p => p.resident_id === resident.id && p.payment_type === "LPS"),
        pab_payment: paymentsData.find(p => p.resident_id === resident.id && p.payment_type === "PAB"),
        meter_reading: meterReadingsMap.get(resident.id),
      }));
      setResidents(residentsWithData);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    loadData();
  }, [selectedMonth]);

  useEffect(() => {
    let filtered = residents;
    if (rtFilter !== "all") filtered = filtered.filter(r => r.rt === rtFilter);
    if (paymentStatusFilter !== "all") {
        filtered = filtered.filter(r => {
            const lps = !!r.lps_payment;
            const pab = !!r.pab_payment;
            if (paymentStatusFilter === 'paid') return lps && pab;
            if (paymentStatusFilter === 'unpaid') return !lps && !pab;
            if (paymentStatusFilter === 'partial') return (lps && !pab) || (!lps && pab);
            return true;
        });
    }
    if (searchTerm) {
        filtered = filtered.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.house_number.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    setFilteredResidents(filtered);
    setCurrentPage(1);
  }, [residents, searchTerm, rtFilter, paymentStatusFilter]);

  const initiatePaymentConfirmation = (resident: ResidentWithData, type: "LPS" | "PAB") => {
      setPaymentToConfirm({ resident, type });
  };

  const handleConfirmPayment = async () => {
    if (!paymentToConfirm) return;
    setIsProcessingPayment(true);

    const { resident, type } = paymentToConfirm;
    
    try {
      const amount = type === "LPS" ? lpsRate : (resident.meter_reading || 0) * pabRate;
      const paymentDate = `${selectedMonth}-10`;
      
      const paymentData = {
        resident_id: resident.id,
        payment_type: type,
        amount,
        payment_date: paymentDate,
        due_date: paymentDate,
        status: "paid" as const,
        payment_method: "cash",
        cubic_meters: type === "PAB" ? resident.meter_reading : undefined,
        rate_per_cubic: type === "PAB" ? pabRate : undefined,
        invoice_number: `INV-${resident.id.slice(0,4)}-${Date.now()}`,
        invoice_date: new Date().toISOString().slice(0,10),
      };
      
      const { data, error } = await supabase.from('payments').insert(paymentData).select().single();
      
      if (error) throw error;
      
      setGeneratedInvoice(data);
      setPaymentToConfirm(null);
      await loadData();
    } catch (error) {
      console.error("Error creating payment:", error);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const showExistingInvoice = (payment: Payment) => {
    setGeneratedInvoice(payment);
  };

  const printInvoice = () => {
    if (!generatedInvoice) return;
    const resident = residents.find(r => r.id === generatedInvoice.resident_id);
    if (!resident) return;

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Kuitansi Pembayaran", 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`RWPay System`, 14, 30);
    doc.text(`Tanggal: ${new Date(generatedInvoice.invoice_date).toLocaleDateString('id-ID')}`, 14, 35);
    doc.text(`No. Invoice: ${generatedInvoice.invoice_number}`, 14, 40);

    doc.setFontSize(12);
    doc.text("Dibayarkan oleh:", 14, 55);
    doc.setFontSize(10);
    doc.text(resident.name, 14, 60);
    doc.text(`No. Rumah: ${resident.house_number}`, 14, 65);
    doc.text(`RT: ${resident.rt}`, 14, 70);

    autoTable(doc, {
        startY: 80,
        head: [['Deskripsi', 'Jumlah']],
        body: [
            [`Pembayaran ${generatedInvoice.payment_type}`, `Rp ${generatedInvoice.amount.toLocaleString('id-ID')}`],
            ...(generatedInvoice.payment_type === 'PAB' ? [[`Pemakaian Air (${generatedInvoice.cubic_meters} m³)`,'']] : []),
        ],
        theme: 'grid'
    });

    const finalY = (doc as any).lastAutoTable.finalY;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("LUNAS", 105, finalY + 15, { align: 'center' });

    doc.save(`invoice-${generatedInvoice.invoice_number}.pdf`);
  };

  const exportUnpaidBills = () => {
    const monthName = monthOptions.find(m => m.value === selectedMonth)?.label || selectedMonth;
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text(`Tagihan Belum Lunas - ${monthName}`, 14, 22);
    doc.setFontSize(10);
    doc.text(`Filter RT: ${rtFilter === 'all' ? 'Semua RT' : `RT ${rtFilter}`}`, 14, 28);

    const unpaidLPS = filteredResidents.filter(r => !r.lps_payment);
    const unpaidPAB = filteredResidents.filter(r => !r.pab_payment);

    let finalY = 32;

    if (unpaidLPS.length > 0) {
        doc.setFontSize(12);
        doc.text("Tagihan Iuran Warga (LPS) Belum Lunas", 14, finalY + 10);
        autoTable(doc, {
            startY: finalY + 12,
            head: [['Nama Warga', 'No. Rumah', 'Tagihan (Rp)']],
            body: unpaidLPS.map(r => [r.name, r.house_number, lpsRate.toLocaleString('id-ID')]),
            theme: 'grid'
        });
        finalY = (doc as any).lastAutoTable.finalY;
    }

    if (unpaidPAB.length > 0) {
        doc.setFontSize(12);
        doc.text("Tagihan Air Bersih (PAB) Belum Lunas", 14, finalY + 15);
        autoTable(doc, {
            startY: finalY + 17,
            head: [['Nama Warga', 'No. Rumah', 'Meteran (m³)', 'Total Tagihan (Rp)']],
            body: unpaidPAB.map(r => [
                r.name,
                r.house_number,
                r.meter_reading ?? 'Belum diinput',
                r.meter_reading !== undefined ? (r.meter_reading * pabRate).toLocaleString('id-ID') : 'N/A'
            ]),
            theme: 'grid'
        });
    }
    
    doc.save(`tagihan_belum_lunas_${selectedMonth}_rt_${rtFilter}.pdf`);
  };

  const getPaymentStatus = (resident: ResidentWithData) => {
    if (resident.lps_payment && resident.pab_payment) return "paid";
    if (!resident.lps_payment && !resident.pab_payment) return "unpaid";
    return "partial";
  };

  const getStatusBadge = (status: string) => {
    if (status === "paid") return <Badge className="bg-green-100 text-green-800 text-xs">Lunas Semua</Badge>;
    if (status === "unpaid") return <Badge className="bg-red-100 text-red-800 text-xs">Belum Bayar</Badge>;
    return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Sebagian</Badge>;
  };

  const monthOptions = useMemo(() => {
    const options = [];
    const today = new Date();
    for (let i = 0; i < 24; i++) {
      const currentDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const value = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, "0")}`;
      const label = currentDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
      options.push({ value, label });
    }
    return options;
  }, []);
  
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Memuat data pembayaran...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <a href="/dashboard">
                <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Kembali</Button>
              </a>
              <h1 className="text-lg lg:text-2xl font-bold text-gray-900">Pembayaran Warga</h1>
            </div>
            <div className="flex items-center space-x-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" />Export</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={exportUnpaidBills}>
                            <FileText className="h-4 w-4 mr-2" />
                            Export Tagihan Belum Lunas
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter & Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filter & Pencarian</CardTitle>
            <CardDescription>
              Filter data pembayaran untuk bulan {monthOptions.find(m => m.value === selectedMonth)?.label || "terpilih"}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger><Calendar className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
                <SelectContent>
                    {monthOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                </SelectContent>
            </Select>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input placeholder="Cari nama/rumah..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Select value={rtFilter} onValueChange={setRtFilter}>
                <SelectTrigger><Users className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Semua RT</SelectItem>
                    {rtOptions.map(rt => <SelectItem key={rt} value={rt}>RT {rt}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select value={paymentStatusFilter} onValueChange={v => setPaymentStatusFilter(v as any)}>
                <SelectTrigger><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="paid">Lunas Semua</SelectItem>
                    <SelectItem value="partial">Sebagian</SelectItem>
                    <SelectItem value="unpaid">Belum Bayar</SelectItem>
                </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Residents List */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Warga</CardTitle>
            <CardDescription>Menampilkan {filteredResidents.length} dari total {residents.length} warga aktif</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentResidents.map(resident => (
                <Card key={resident.id} className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="mb-4 sm:mb-0">
                      <h3 className="font-medium">{resident.name}</h3>
                      <p className="text-sm text-gray-500">RT {resident.rt} - Rumah {resident.house_number}</p>
                      {getStatusBadge(getPaymentStatus(resident))}
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-center w-32">
                        <p className="text-sm font-medium text-blue-600 flex items-center justify-center"><Zap className="h-4 w-4 mr-1"/>LPS</p>
                        <p className="text-xs text-gray-500">Rp {lpsRate.toLocaleString("id-ID")}</p>
                        {resident.lps_payment ? (
                            <div className="mt-2 flex flex-col items-center space-y-1">
                                <Badge variant="secondary">Lunas</Badge>
                                <Button variant="outline" className="h-7 px-2 text-xs" onClick={() => showExistingInvoice(resident.lps_payment!)}>Invoice</Button>
                            </div>
                        ) : (
                            <Button size="sm" className="mt-2 bg-blue-600 hover:bg-blue-700" onClick={() => initiatePaymentConfirmation(resident, "LPS")}>Bayar</Button>
                        )}
                      </div>
                      <div className="text-center w-32">
                        <p className="text-sm font-medium text-purple-600 flex items-center justify-center"><Droplets className="h-4 w-4 mr-1"/>PAB</p>
                        <p className="text-xs text-gray-500 h-8 flex items-center justify-center">
                            {resident.meter_reading !== undefined ? `Rp ${(resident.meter_reading * pabRate).toLocaleString('id-ID')}` : 'Meteran belum diinput'}
                        </p>
                        {resident.pab_payment ? (
                             <div className="mt-2 flex flex-col items-center space-y-1">
                                <Badge variant="secondary">Lunas</Badge>
                                <Button variant="outline" className="h-7 px-2 text-xs" onClick={() => showExistingInvoice(resident.pab_payment!)}>Invoice</Button>
                            </div>
                        ) : (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span tabIndex={0}>
                                        <Button 
                                            size="sm" 
                                            className="mt-2 bg-purple-600 hover:bg-purple-700" 
                                            onClick={() => initiatePaymentConfirmation(resident, "PAB")}
                                            disabled={resident.meter_reading === undefined}
                                        >
                                            Bayar
                                        </Button>
                                    </span>
                                </TooltipTrigger>
                                {resident.meter_reading === undefined && (
                                    <TooltipContent>
                                        <p>Input meteran terlebih dahulu</p>
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
                {filteredResidents.length === 0 && (
                    <div className="text-center py-10">
                        <p className="text-gray-500">Tidak ada warga yang cocok dengan kriteria.</p>
                    </div>
                )}
            </div>
            {totalPages > 1 && (
                <div className="mt-6 flex justify-center">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }} />
                            </PaginationItem>
                            
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                                if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                                    return (
                                        <PaginationItem key={page}>
                                            <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(page); }} isActive={currentPage === page}>
                                                {page}
                                            </PaginationLink>
                                        </PaginationItem>
                                    );
                                }
                                if (page === currentPage - 2 || page === currentPage + 2) {
                                    return <PaginationEllipsis key={page} />;
                                }
                                return null;
                            })}

                            <PaginationItem>
                                <PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }} />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Confirmation Dialog */}
      <Dialog open={!!paymentToConfirm} onOpenChange={(isOpen) => !isOpen && setPaymentToConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Pembayaran</DialogTitle>
            <DialogDescription>
              Anda akan mengkonfirmasi pembayaran untuk warga berikut. Pastikan data sudah benar.
            </DialogDescription>
          </DialogHeader>
          {paymentToConfirm && (
            <div className="space-y-1 text-sm">
              <p><strong>Nama:</strong> {paymentToConfirm.resident.name}</p>
              <p><strong>Jenis:</strong> {paymentToConfirm.type}</p>
              <p><strong>Jumlah:</strong> Rp {(paymentToConfirm.type === 'LPS' ? lpsRate : (paymentToConfirm.resident.meter_reading || 0) * pabRate).toLocaleString('id-ID')}</p>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Batal</Button>
            </DialogClose>
            <Button onClick={handleConfirmPayment} disabled={isProcessingPayment}>
              {isProcessingPayment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Konfirmasi & Bayar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Dialog */}
      <Dialog open={!!generatedInvoice} onOpenChange={(isOpen) => !isOpen && setGeneratedInvoice(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center"><CheckCircle className="h-6 w-6 text-green-500 mr-2"/>Pembayaran Berhasil</DialogTitle>
            <DialogDescription>
              Invoice untuk pembayaran telah dibuat.
            </DialogDescription>
          </DialogHeader>
          {generatedInvoice && residents.find(r => r.id === generatedInvoice.resident_id) && (
            <div className="space-y-2 text-sm">
                <p><strong>No. Invoice:</strong> {generatedInvoice.invoice_number}</p>
                <p><strong>Nama Warga:</strong> {residents.find(r => r.id === generatedInvoice.resident_id)?.name}</p>
                <p><strong>Jenis Pembayaran:</strong> {generatedInvoice.payment_type}</p>
                <p><strong>Total Bayar:</strong> Rp {generatedInvoice.amount.toLocaleString('id-ID')}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setGeneratedInvoice(null)}>Tutup</Button>
            <Button onClick={printInvoice}><Printer className="mr-2 h-4 w-4"/>Cetak Invoice</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
}
