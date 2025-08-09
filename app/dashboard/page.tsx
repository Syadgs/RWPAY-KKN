"use client"

import React, { useState, useEffect, useMemo } from "react"
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
    DollarSign, Users, CheckCircle, AlertTriangle, FileText, Settings, 
    LogOut, Plus, Menu, Droplets, Home, AlertCircle, Calendar
} from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"


// --- Pengaturan Klien Supabase ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bqfyynmtdqjrcscshjvh.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Definisi Tipe Data ---
interface Payment {
  id: string;
  amount: number;
  payment_type: 'LPS' | 'PAB';
  resident_id: string;
  residents: { name: string; house_number: string; };
}

interface DashboardStats {
  total_residents: number;
  paid_both: number;
  paid_one: number;
  unpaid_all: number;
  lps_income: number;
  pab_income: number;
  total_income: number;
}

// --- Fungsi Pengambilan Data dari Supabase ---
async function getDashboardData(month: string) {
    const firstDay = `${month}-01`;
    const date = new Date(parseInt(month.slice(0, 4)), parseInt(month.slice(5, 7)), 0);
    const lastDay = date.toISOString().slice(0, 10);

    const { data: allResidents, error: resError, count: totalResidentsCount } = await supabase
        .from('residents')
        .select('id, name', { count: 'exact' })
        .eq('status', 'active');
    
    const { data: payments, error: payError } = await supabase
        .from('payments')
        .select('resident_id, payment_type, amount')
        .gte('payment_date', firstDay)
        .lte('payment_date', lastDay)
        .eq('status', 'paid');

    const { data: recentPayments, error: recentPayError } = await supabase
        .from('payments')
        .select('id, amount, residents ( name, house_number )')
        .order('created_at', { ascending: false })
        .limit(5);

    if (resError || payError || recentPayError) {
        console.error("Error fetching dashboard data:", resError || payError || recentPayError);
        throw new Error("Gagal memuat data dashboard");
    }

    const residentPaymentStatus = new Map<string, { name: string, lps_paid: boolean, pab_paid: boolean }>();
    allResidents.forEach(r => {
        residentPaymentStatus.set(r.id, { name: r.name, lps_paid: false, pab_paid: false });
    });

    payments.forEach(p => {
        const status = residentPaymentStatus.get(p.resident_id);
        if (status) {
            if (p.payment_type === 'LPS') status.lps_paid = true;
            if (p.payment_type === 'PAB') status.pab_paid = true;
        }
    });

    let paid_both = 0, paid_one = 0;
    const unpaid_residents_list: { id: string, name: string }[] = [];

    residentPaymentStatus.forEach((status, id) => {
        if (status.lps_paid && status.pab_paid) paid_both++;
        else if (status.lps_paid || status.pab_paid) paid_one++;
        else unpaid_residents_list.push({ id, name: status.name });
    });

    const lps_income = payments.filter(p => p.payment_type === 'LPS').reduce((sum, p) => sum + p.amount, 0);
    const pab_income = payments.filter(p => p.payment_type === 'PAB').reduce((sum, p) => sum + p.amount, 0);

    const stats: DashboardStats = {
        total_residents: totalResidentsCount || 0,
        paid_both,
        paid_one,
        unpaid_all: unpaid_residents_list.length,
        lps_income,
        pab_income,
        total_income: lps_income + pab_income,
    };
    
    return { stats, recentPayments, unpaidResidents: unpaid_residents_list.slice(0, 5) };
}


export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [unpaidResidents, setUnpaidResidents] = useState<{id: string, name: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));

  useEffect(() => {
    loadDashboardData();
  }, [selectedMonth]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const { stats, recentPayments, unpaidResidents } = await getDashboardData(selectedMonth);
      setStats(stats);
      setRecentPayments(recentPayments);
      setUnpaidResidents(unpaidResidents);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
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

  const NavigationMenu = () => (
    <div className="flex flex-col space-y-3 p-4 w-full">
      <Badge variant="outline" className="mb-2 text-xs">RW 08 - Sambiroto</Badge>
      <a href="/reports" className="w-full">
        <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
          <FileText className="h-4 w-4 mr-2" />Laporan
        </Button>
      </a>
      <a href="/settings" className="w-full">
        <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
          <Settings className="h-4 w-4 mr-2" />Pengaturan
        </Button>
      </a>
      <a href="/" className="w-full">
        <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
          <LogOut className="h-4 w-4 mr-2" />Keluar
        </Button>
      </a>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Memuat data dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">RWPay Dashboard</h1>
            </div>
            <div className="hidden lg:flex items-center space-x-3">
              <Badge variant="outline">RW 08 - Sambiroto</Badge>
              <a href="/reports"><Button variant="outline" size="sm"><FileText className="h-4 w-4 mr-2" />Laporan</Button></a>
              <a href="/settings"><Button variant="outline" size="sm"><Settings className="h-4 w-4 mr-2" />Pengaturan</Button></a>
              <a href="/"><Button variant="outline" size="sm"><LogOut className="h-4 w-4 mr-2" />Keluar</Button></a>
            </div>
            <div className="lg:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon"><Menu className="h-4 w-4" /></Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64">
                  <SheetHeader><SheetTitle className="sr-only">Menu</SheetTitle></SheetHeader>
                  <div className="mt-6"><NavigationMenu /></div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Month Selector */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
            <div className="flex items-center gap-2">
                <Calendar className="h-6 w-6 text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-800">Ringkasan Bulan:</h2>
            </div>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-full sm:w-56">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {monthOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Warga Aktif</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_residents || 0}</div>
              <p className="text-xs text-muted-foreground">Kepala keluarga</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lunas Keduanya</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.paid_both || 0}</div>
              <p className="text-xs text-muted-foreground">LPS & PAB bulan ini</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lunas Sebagian</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats?.paid_one || 0}</div>
              <p className="text-xs text-muted-foreground">Baru bayar 1 dari 2</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Belum Bayar</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats?.unpaid_all || 0}</div>
              <p className="text-xs text-muted-foreground">Perlu ditindaklanjuti</p>
            </CardContent>
          </Card>
        </div>

        {/* Income and Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="lg:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Pemasukan Bulan Ini</CardTitle>
                        <CardDescription>Total dari semua pembayaran yang diterima bulan ini.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center text-sm p-3 bg-blue-50 rounded-md">
                            <div className="flex items-center"><Home className="h-4 w-4 mr-2 text-blue-500" /><span>Iuran (LPS)</span></div>
                            <span className="font-medium">Rp {(stats?.lps_income || 0).toLocaleString("id-ID")}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm p-3 bg-cyan-50 rounded-md">
                            <div className="flex items-center"><Droplets className="h-4 w-4 mr-2 text-cyan-500" /><span>Air (PAB)</span></div>
                            <span className="font-medium">Rp {(stats?.pab_income || 0).toLocaleString("id-ID")}</span>
                        </div>
                        <div className="flex justify-between items-center border-t pt-4 mt-4">
                            <span className="font-semibold">Total</span>
                            <span className="font-bold text-lg text-blue-600">Rp {(stats?.total_income || 0).toLocaleString("id-ID")}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Pembayaran Terbaru</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentPayments.map(p => (
                                <div key={p.id} className="flex justify-between items-center text-sm">
                                    <div>
                                        <p className="font-medium">{p.residents.name}</p>
                                        <p className="text-xs text-muted-foreground">{p.residents.house_number}</p>
                                    </div>
                                    <Badge variant="secondary">Rp {p.amount.toLocaleString("id-ID")}</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Warga Perlu Ditindaklanjuti</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {unpaidResidents.map(r => (
                                <div key={r.id} className="flex items-center text-sm">
                                    <AlertTriangle className="h-4 w-4 mr-3 text-red-500 flex-shrink-0" />
                                    <p className="font-medium">{r.name}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>

        {/* Action Center */}
        <Tabs defaultValue="payments" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="payments">Pembayaran</TabsTrigger>
            <TabsTrigger value="meter-reading">Input Meteran</TabsTrigger>
            <TabsTrigger value="residents">Data Warga</TabsTrigger>
          </TabsList>
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Manajemen Pembayaran</CardTitle>
                <CardDescription>Buka halaman untuk mencatat pembayaran iuran dan air untuk setiap warga.</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center pt-6">
                <a href="/payments"><Button><Plus className="h-4 w-4 mr-2" />Kelola Pembayaran</Button></a>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="meter-reading">
            <Card>
              <CardHeader>
                <CardTitle>Input Meteran Air</CardTitle>
                <CardDescription>Buka halaman khusus untuk mencatat angka meteran air bulanan.</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center pt-6">
                <a href="/meter-readings"><Button><Droplets className="h-4 w-4 mr-2" />Buka Halaman Input</Button></a>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="residents">
            <Card>
              <CardHeader>
                <CardTitle>Data Warga</CardTitle>
                <CardDescription>Buka halaman untuk mengelola data semua warga yang terdaftar.</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center pt-6">
                <a href="/residents"><Button><Users className="h-4 w-4 mr-2" />Kelola Warga</Button></a>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
