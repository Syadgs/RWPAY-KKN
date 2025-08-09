"use client"

import React, { useState, useEffect, useMemo } from "react"
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Users,
  Search,
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  Download,
  FileSpreadsheet,
  FileText,
  Menu,
  Filter,
  Home,
  Phone,
  Loader2
} from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet"

// --- Supabase Client Setup ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bqfyynmtdqjrcscshjvh.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxZnl5bm10ZHFqcmNzY3NoanZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTI5ODQyMTIsImV4cCI6MjAyODU2MDIxMn0.i5a234i5V5-S1BEa-p3p2JoS3o_tN4D9z-J5i_w2xJg';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Type Definitions ---
interface Resident {
    id: string;
    name: string;
    house_number: string;
    address: string | null;
    phone: string | null;
    status: 'active' | 'inactive';
    rt: string;
}

// --- Supabase & Validation Functions ---
async function getResidents(): Promise<Resident[]> {
    const { data, error } = await supabase.from('residents').select('*').order('name');
    if (error) {
        console.error("Error fetching residents:", error);
        return [];
    }
    return data;
}

async function getResidentStats() {
    const { data, error, count } = await supabase.from('residents').select('*', { count: 'exact', head: true });
    if (error) {
         console.error("Error fetching stats:", error);
         return { total: 0, active: 0, inactive: 0, byRT: {} };
    }
    const { data: activeData, error: activeError } = await supabase.from('residents').select('rt', { count: 'exact' }).eq('status', 'active');
     if (activeError) console.error("Error fetching active stats:", activeError);

    const activeCount = activeData?.length || 0;
    const totalCount = count || 0;
    const byRT = activeData?.reduce((acc, curr) => {
        acc[curr.rt] = (acc[curr.rt] || 0) + 1;
        return acc;
    }, {} as {[key: string]: number}) || {};
    return { total: totalCount, active: activeCount, inactive: totalCount - activeCount, byRT };
}

async function deleteResident(id: string) {
    const { error } = await supabase.from('residents').delete().eq('id', id);
    if (error) throw error;
}

async function upsertResident(residentData: Partial<Resident>) {
    const { data, error } = await supabase.from('residents').upsert(residentData, { onConflict: 'id' }).select().single();
    if (error) throw error;
    return data;
}

function validateResidentData(data: Partial<Resident>): string[] {
    const errors: string[] = [];
    if (!data.name?.trim()) errors.push("Nama lengkap tidak boleh kosong.");
    if (!data.house_number?.trim()) errors.push("Nomor rumah tidak boleh kosong.");
    if (!data.rt?.trim()) errors.push("RT tidak boleh kosong.");
    return errors;
}

async function isHouseNumberAvailable(house_number: string, residentId?: string): Promise<boolean> {
    let query = supabase.from('residents').select('id').eq('house_number', house_number);
    if (residentId) query = query.not('id', 'eq', residentId);
    const { data, error } = await query.limit(1);
    if (error) {
        console.error("Error checking house number:", error);
        return false;
    }
    return data.length === 0;
}

// --- Resident Form Component ---
interface ResidentFormProps {
  resident?: Resident;
  onSuccess: () => void;
  onCancel: () => void;
}

function ResidentForm({ resident, onSuccess, onCancel }: ResidentFormProps) {
  const [formData, setFormData] = useState({
    name: resident?.name || "",
    house_number: resident?.house_number || "",
    rt: resident?.rt || "01",
    address: resident?.address || "",
    phone: resident?.phone || "",
    status: resident?.status || ("active" as "active" | "inactive"),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors([]);
    try {
      const validationErrors = validateResidentData(formData);
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        setIsLoading(false);
        return;
      }
      if (!resident || resident.house_number !== formData.house_number) {
        const isAvailable = await isHouseNumberAvailable(formData.house_number, resident?.id);
        if (!isAvailable) {
          setErrors(["Nomor rumah sudah digunakan oleh warga lain"]);
          setIsLoading(false);
          return;
        }
      }
      await upsertResident({ id: resident?.id, ...formData });
      onSuccess();
    } catch (err) {
      setErrors([err instanceof Error ? err.message : "Terjadi kesalahan"]);
    } finally {
      setIsLoading(false);
    }
  };

  const rtOptions = Array.from({ length: 15 }, (_, i) => (i + 1).toString().padStart(2, '0'));

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => <li key={index}>{error}</li>)}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2"><Label htmlFor="name">Nama Lengkap *</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Masukkan nama lengkap" required /></div>
        <div className="space-y-2"><Label htmlFor="house_number">Nomor Rumah *</Label><Input id="house_number" value={formData.house_number} onChange={(e) => setFormData({ ...formData, house_number: e.target.value })} placeholder="Contoh: A-01, B-15" required /></div>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="space-y-2"><Label htmlFor="phone">Nomor Telepon</Label><Input id="phone" type="tel" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Contoh: 081234567890" /></div>
        <div className="space-y-2"><Label htmlFor="rt">RT *</Label><Select value={formData.rt} onValueChange={(value) => setFormData({ ...formData, rt: value })}><SelectTrigger><SelectValue placeholder="Pilih RT" /></SelectTrigger><SelectContent>{rtOptions.map((rt) => <SelectItem key={rt} value={rt}>RT {rt}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-2"><Label htmlFor="status">Status</Label><Select value={formData.status} onValueChange={(value: "active" | "inactive") => setFormData({ ...formData, status: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Aktif</SelectItem><SelectItem value="inactive">Tidak Aktif</SelectItem></SelectContent></Select></div>
      </div>
      <div className="space-y-2"><Label htmlFor="address">Alamat Lengkap</Label><Textarea id="address" value={formData.address || ''} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Masukkan alamat lengkap" rows={3} /></div>
      <div className="flex justify-end space-x-2 pt-4"><Button type="button" variant="outline" onClick={onCancel}>Batal</Button><Button type="submit" disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{isLoading ? "Menyimpan..." : resident ? "Perbarui" : "Simpan"}</Button></div>
    </form>
  )
}

// --- Main Page Component ---
export default function ResidentsPage() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [filteredResidents, setFilteredResidents] = useState<Resident[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [rtFilter, setRtFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedResident, setSelectedResident] = useState<Resident | undefined>();
  const [showForm, setShowForm] = useState(false);
  const [residentToDelete, setResidentToDelete] = useState<Resident | null>(null);

  const rtOptions = useMemo(() => Array.from(new Set(residents.map(r => r.rt))).sort(), [residents]);

  const loadData = async () => {
    try {
      const [residentsData, statsData] = await Promise.all([getResidents(), getResidentStats()]);
      setResidents(residentsData);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let filtered = residents;
    if (rtFilter !== "all") filtered = filtered.filter(r => r.rt === rtFilter);
    if (statusFilter !== "all") filtered = filtered.filter(r => r.status === statusFilter);
    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.house_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.address && r.address.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    setFilteredResidents(filtered);
  }, [residents, searchTerm, rtFilter, statusFilter]);

  const handleDeleteConfirm = async () => {
    if (residentToDelete) {
      try {
        await deleteResident(residentToDelete.id);
        await loadData();
      } catch (error) {
        console.error("Error deleting resident:", error);
      } finally {
        setResidentToDelete(null);
      }
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedResident(undefined);
    loadData();
  };

  const getStatusBadge = (status: string) => status === "active" ? 
    <Badge className="bg-green-100 text-green-800">Aktif</Badge> : 
    <Badge className="bg-gray-100 text-gray-800">Tidak Aktif</Badge>;

  const ActionMenu = () => (
    <div className="flex flex-col space-y-3 p-4 w-full">
      <Button onClick={() => setShowForm(true)} className="w-full justify-start">
        <Plus className="h-4 w-4 mr-2" /> Tambah Warga
      </Button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Memuat data warga...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <a href="/dashboard"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Kembali</Button></a>
              <div className="flex items-center space-x-2"><Users className="h-8 w-8 text-blue-600" /><h1 className="text-xl lg:text-2xl font-bold text-gray-900">Data Warga</h1></div>
            </div>
            <div className="hidden md:flex items-center space-x-2">
              <Button onClick={() => setShowForm(true)} size="sm"><Plus className="h-4 w-4 mr-2" />Tambah Warga</Button>
            </div>
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild><Button variant="outline" size="icon"><Menu className="h-4 w-4" /></Button></SheetTrigger>
                <SheetContent side="right" className="w-64">
                  <SheetHeader><SheetTitle className="sr-only">Menu Aksi</SheetTitle><SheetDescription className="sr-only">Aksi untuk halaman data warga.</SheetDescription></SheetHeader>
                  <div className="mt-6"><ActionMenu /></div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Warga</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats?.total || 0}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Warga Aktif</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{stats?.active || 0}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Tidak Aktif</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-gray-600">{stats?.inactive || 0}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total RT</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-purple-600">{Object.keys(stats?.byRT || {}).length}</div></CardContent></Card>
        </div>

        <Card className="mb-6">
          <CardHeader><CardTitle>Filter & Pencarian</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" /><Input placeholder="Cari nama/rumah..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div>
            <Select value={rtFilter} onValueChange={setRtFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Semua RT</SelectItem>{rtOptions.map(rt => <SelectItem key={rt} value={rt}>RT {rt}</SelectItem>)}</SelectContent></Select>
            <Select value={statusFilter} onValueChange={v => setStatusFilter(v as any)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Semua Status</SelectItem><SelectItem value="active">Aktif</SelectItem><SelectItem value="inactive">Tidak Aktif</SelectItem></SelectContent></Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Daftar Warga</CardTitle><CardDescription>Menampilkan {filteredResidents.length} dari {residents.length} warga</CardDescription></CardHeader>
          <CardContent>
            <div className="hidden lg:block">
              <Table>
                <TableHeader><TableRow><TableHead>Nama</TableHead><TableHead>RT</TableHead><TableHead>No. Rumah</TableHead><TableHead>Kontak</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filteredResidents.map(resident => (
                    <TableRow key={resident.id}>
                      <TableCell><div className="font-medium">{resident.name}</div>{resident.address && <div className="text-sm text-gray-500">{resident.address}</div>}</TableCell>
                      <TableCell><Badge variant="outline">RT {resident.rt}</Badge></TableCell>
                      <TableCell>{resident.house_number}</TableCell>
                      <TableCell>{resident.phone}</TableCell>
                      <TableCell>{getStatusBadge(resident.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setSelectedResident(resident); setShowForm(true); }}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setResidentToDelete(resident)} className="text-red-600"><Trash2 className="h-4 w-4 mr-2" />Hapus</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="lg:hidden space-y-4">
              {filteredResidents.map(resident => (
                <Card key={resident.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{resident.name}</h3>
                      <p className="text-sm text-gray-500">RT {resident.rt} - Rumah {resident.house_number}</p>
                      {resident.phone && <p className="text-sm text-gray-500">{resident.phone}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(resident.status)}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelectedResident(resident); setShowForm(true); }}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setResidentToDelete(resident)} className="text-red-600"><Trash2 className="h-4 w-4 mr-2" />Hapus</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            {filteredResidents.length === 0 && <div className="text-center py-10"><p className="text-gray-500">Tidak ada warga yang cocok.</p></div>}
          </CardContent>
        </Card>
      </main>

      <Dialog open={showForm} onOpenChange={(isOpen) => { if (!isOpen) { setShowForm(false); setSelectedResident(undefined); }}}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedResident ? "Edit Data Warga" : "Tambah Warga Baru"}</DialogTitle>
            <DialogDescription>
               {selectedResident ? "Perbarui informasi warga di bawah ini." : "Lengkapi formulir untuk menambahkan warga baru."}
            </DialogDescription>
          </DialogHeader>
          <ResidentForm 
            resident={selectedResident} 
            onSuccess={handleFormSuccess} 
            onCancel={() => { setShowForm(false); setSelectedResident(undefined); }} 
          />
        </DialogContent>
      </Dialog>
      
      <Dialog open={!!residentToDelete} onOpenChange={() => setResidentToDelete(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Konfirmasi Penghapusan</DialogTitle>
                <DialogDescription>
                    Apakah Anda yakin ingin menghapus data warga: <strong>{residentToDelete?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setResidentToDelete(null)}>Batal</Button>
                <Button variant="destructive" onClick={handleDeleteConfirm}>Hapus</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
