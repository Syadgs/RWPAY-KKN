"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft,
  Search,
  Loader2,
  CheckCircle,
  AlertCircle,
  Save,
  Pencil,
  X,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"


// --- Supabase Client Setup ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bqfyynmtdqjrcscshjvh.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxZnl5bm10ZHFqcmNzY3NoanZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTI5ODQyMTIsImV4cCI6MjAyODU2MDIxMn0.i5a234i5V5-S1BEa-p3p2JoS3o_tN4D9z-J5i_w2xJg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Type Definitions ---
interface Resident {
    id: string;
    name: string;
    house_number: string;
    rt: string;
}

interface MeterReading {
    id?: string;
    resident_id: string;
    month: string; // YYYY-MM
    reading: number;
    created_at?: string;
}

interface ResidentWithReading extends Resident {
    reading_id?: string;
    current_reading_str: string;
    original_reading_str: string;
    status: 'idle' | 'view' | 'editing' | 'saving' | 'saved' | 'error';
}

// --- Supabase Data Fetching Functions ---
async function getActiveResidents(): Promise<Resident[]> {
    const { data, error } = await supabase
        .from('residents')
        .select('id, name, house_number, rt')
        .eq('status', 'active')
        .order('name', { ascending: true });
    if (error) {
        console.error("Error fetching residents:", error);
        return [];
    }
    return data;
}

async function getMeterReadingsForMonth(month: string): Promise<MeterReading[]> {
    const { data, error } = await supabase
        .from('meter_readings')
        .select('*')
        .eq('month', month);
    if (error) {
        console.error("Error fetching meter readings:", error);
        return [];
    }
    return data;
}

async function upsertMeterReading(reading: Partial<MeterReading>): Promise<MeterReading | null> {
    const { data, error } = await supabase
        .from('meter_readings')
        .upsert(reading, { onConflict: 'resident_id, month' })
        .select()
        .single();
    
    if (error) {
        console.error("Error upserting meter reading:", error);
        return null;
    }
    return data;
}

export default function MeterReadingPage() {
    const [residents, setResidents] = useState<ResidentWithReading[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [rtFilter, setRtFilter] = useState<string>("all");
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}`;
    });

    const rtOptions = useMemo(() => {
        const allRts = residents.map(r => r.rt);
        return Array.from(new Set(allRts)).sort();
    }, [residents]);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [residentsData, readingsData] = await Promise.all([
                getActiveResidents(),
                getMeterReadingsForMonth(selectedMonth),
            ]);

            const readingsMap = new Map(readingsData.map(r => [r.resident_id, { id: r.id, reading: r.reading }]));

            const combinedData: ResidentWithReading[] = residentsData.map(res => {
                const readingInfo = readingsMap.get(res.id);
                const readingStr = readingInfo?.reading?.toString().replace('.', ',') ?? '';
                return {
                    ...res,
                    reading_id: readingInfo?.id,
                    current_reading_str: readingStr,
                    original_reading_str: readingStr,
                    status: readingInfo ? 'view' : 'idle',
                };
            });

            setResidents(combinedData);
        } catch (error) {
            console.error("Failed to load data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [selectedMonth]);

    useEffect(() => {
        loadData();
    }, [loadData]);
    
    const handleReadingChange = (residentId: string, value: string) => {
        const sanitized = value.replace(/[^0-9,]/g, '');
        
        setResidents(prev => prev.map(res => 
            res.id === residentId ? { ...res, current_reading_str: sanitized } : res
        ));
    };

    const handleEdit = (residentId: string) => {
        setResidents(prev => prev.map(res =>
            res.id === residentId ? { ...res, status: 'editing' } : res
        ));
    };

    const handleCancel = (residentId: string) => {
        setResidents(prev => prev.map(res => {
            if (res.id === residentId) {
                return { 
                    ...res, 
                    status: res.original_reading_str ? 'view' : 'idle',
                    current_reading_str: res.original_reading_str 
                };
            }
            return res;
        }));
    };

    const handleSaveReading = async (residentId: string) => {
        const resident = residents.find(r => r.id === residentId);
        if (!resident || resident.current_reading_str.trim() === '') return;

        const parsableString = resident.current_reading_str.replace(',', '.');
        const readingValue = parseFloat(parsableString);

        if (isNaN(readingValue)) {
            setResidents(prev => prev.map(res => res.id === residentId ? { ...res, status: 'error' } : res));
            return;
        }

        setResidents(prev => prev.map(res => res.id === residentId ? { ...res, status: 'saving' } : res));

        const result = await upsertMeterReading({
            id: resident.reading_id,
            resident_id: resident.id,
            month: selectedMonth,
            reading: readingValue,
        });

        if (result) {
            const newReadingStr = result.reading.toString().replace('.', ',');
            setResidents(prev => prev.map(res => 
                res.id === residentId ? { 
                    ...res, 
                    status: 'saved', 
                    reading_id: result.id || resident.reading_id,
                    original_reading_str: newReadingStr,
                    current_reading_str: newReadingStr,
                } : res
            ));
            setTimeout(() => {
                setResidents(prev => prev.map(res => res.id === residentId ? {...res, status: 'view'} : res));
            }, 2000);
        } else {
            setResidents(prev => prev.map(res => 
                res.id === residentId ? { ...res, status: 'error' } : res
            ));
        }
    };
    
    const filteredResidents = useMemo(() => {
        return residents.filter(resident => {
            const searchMatch = searchTerm === "" || 
                                resident.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                resident.house_number.toLowerCase().includes(searchTerm.toLowerCase());
            const rtMatch = rtFilter === "all" || resident.rt === rtFilter;
            return searchMatch && rtMatch;
        });
    }, [residents, searchTerm, rtFilter]);
    
    const monthOptions = useMemo(() => {
        const options = [];
        const endDate = new Date();
        let currentDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

        for (let i = 0; i < 12; i++) {
            const value = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, "0")}`;
            const label = currentDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
            options.push({ value, label });
            currentDate.setMonth(currentDate.getMonth() - 1);
        }
        return options;
    }, []);

    return (
        <TooltipProvider>
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-3 sm:py-4">
                        <div className="flex items-center space-x-2 sm:space-x-4">
                            <a href="/dashboard">
                                <Button variant="ghost" size="sm">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Kembali
                                </Button>
                            </a>
                            <h1 className="text-lg lg:text-2xl font-bold text-gray-900">Input Meteran Air</h1>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                            <div>
                                <CardTitle>Pencatatan Meteran</CardTitle>
                                <CardDescription>Input angka meteran terakhir untuk setiap warga pada bulan yang dipilih.</CardDescription>
                            </div>
                            <div className="flex items-center gap-4">
                                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                    <SelectTrigger className="w-full md:w-48">
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
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    placeholder="Cari nama/rumah..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Select value={rtFilter} onValueChange={setRtFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter RT" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua RT</SelectItem>
                                    {rtOptions.map(rt => (
                                        <SelectItem key={rt} value={rt}>RT {rt}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center py-16">
                                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                                <p>Memuat data warga...</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredResidents.map(resident => (
                                    <div key={resident.id} className="flex items-center gap-2 md:gap-4 p-3 border rounded-lg bg-white">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{resident.name}</p>
                                            <p className="text-sm text-gray-500">RT {resident.rt} / Rumah {resident.house_number}</p>
                                        </div>
                                        <Input
                                            type="text"
                                            inputMode="decimal"
                                            placeholder="angka meteran"
                                            className="w-28 md:w-32 text-right"
                                            value={resident.current_reading_str}
                                            onChange={e => handleReadingChange(resident.id, e.target.value)}
                                            disabled={!['idle', 'editing'].includes(resident.status)}
                                        />
                                        <div className="w-28 flex items-center justify-start">
                                            {resident.status === 'idle' && resident.current_reading_str && (
                                                <Button size="sm" onClick={() => handleSaveReading(resident.id)}>
                                                    <Save className="h-4 w-4 mr-2" /> Simpan
                                                </Button>
                                            )}
                                            {resident.status === 'view' && (
                                                <Button size="sm" variant="outline" onClick={() => handleEdit(resident.id)}>
                                                    <Pencil className="h-4 w-4 mr-2" /> Edit
                                                </Button>
                                            )}
                                            {resident.status === 'editing' && (
                                                <div className="flex gap-2">
                                                    <Button size="sm" onClick={() => handleSaveReading(resident.id)}>
                                                        <Save className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="sm" variant="ghost" onClick={() => handleCancel(resident.id)}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                            {resident.status === 'saving' && <Loader2 className="h-5 w-5 animate-spin text-blue-500" />}
                                            {resident.status === 'saved' && (
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>Tersimpan!</TooltipContent>
                                                </Tooltip>
                                            )}
                                            {resident.status === 'error' && (
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <AlertCircle className="h-5 w-5 text-red-500" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>Gagal menyimpan. Periksa kembali input.</TooltipContent>
                                                </Tooltip>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {filteredResidents.length === 0 && (
                                    <div className="text-center py-10">
                                        <p className="text-gray-500">Tidak ada warga yang cocok dengan kriteria.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
        </TooltipProvider>
    );
}
