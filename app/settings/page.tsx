"use client"

import React, { useState, useEffect } from "react"
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    ArrowLeft,
    DollarSign,
    Save,
    X,
    Edit,
    Loader2,
    KeyRound // <-- Ikon baru ditambahkan
} from "lucide-react"

// --- Pengaturan Klien Supabase ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bqfyynmtdqjrcscshjvh.supabase.co';
// PASTIKAN ANDA MENGGANTI INI DENGAN KUNCI ANON PUBLIK ANDA YANG SEBENARNYA
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Tipe Data ---
interface Setting {
    key: string;
    value: string;
}

// --- Fungsi Supabase ---
async function getSettings(): Promise<Setting[]> {
    const { data, error } = await supabase.from('settings').select('key, value');
    if (error) {
        console.error("Error fetching settings:", error);
        return [];
    }
    return data;
}

async function saveSettings(settingsToSave: Setting[]): Promise<boolean> {
    const { error } = await supabase.from('settings').upsert(settingsToSave, { onConflict: 'key' });
    if (error) {
        console.error("Error saving settings:", error);
        return false;
    }
    return true;
}

export default function SettingsPage() {
    // State untuk settings umum & pembayaran
    const [settings, setSettings] = useState<{ [key: string]: string }>({});
    const [initialSettings, setInitialSettings] = useState<{ [key: string]: string }>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [editMode, setEditMode] = useState({
        general: false,
        payment: false
    });

    // --- State baru untuk ganti password ---
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isPasswordSaving, setIsPasswordSaving] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');


    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setIsLoading(true);
        const fetchedSettings = await getSettings();
        const settingsMap = fetchedSettings.reduce((acc, setting) => {
            acc[setting.key] = setting.value;
            return acc;
        }, {} as { [key: string]: string });

        setSettings(settingsMap);
        setInitialSettings(settingsMap);
        setIsLoading(false);
    };

    const handleInputChange = (key: string, value: string) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleEdit = (section: 'general' | 'payment') => {
        setEditMode(prev => ({ ...prev, [section]: true }));
    };

    const handleCancel = (section: 'general' | 'payment') => {
        setSettings(initialSettings);
        setEditMode(prev => ({ ...prev, [section]: false }));
    };

    const handleSave = async (section: 'general' | 'payment') => {
        setIsSaving(true);
        
        let keysToSave: string[] = [];
        if (section === 'general') {
            keysToSave = ['rw_name', 'rw_address'];
        } else if (section === 'payment') {
            keysToSave = ['monthly_fee', 'pab_rate'];
        }

        const settingsToSave = keysToSave
            .filter(key => settings[key] !== undefined)
            .map(key => ({ key, value: settings[key] }));

        const success = await saveSettings(settingsToSave);
        if (success) {
            setInitialSettings(settings);
            setEditMode(prev => ({ ...prev, [section]: false }));
        } else {
            alert("Gagal menyimpan pengaturan. Silakan coba lagi.");
        }
        setIsSaving(false);
    };

    // --- Fungsi baru untuk menangani perubahan password ---
    const handlePasswordChange = async () => {
        // Reset pesan sebelum validasi
        setPasswordError('');
        setPasswordSuccess('');
        
        // Validasi input
        if (!newPassword || !confirmPassword) {
            setPasswordError("Password baru dan konfirmasi password harus diisi.");
            return;
        }
        if (newPassword.length < 6) {
            setPasswordError("Password baru minimal harus 6 karakter.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError("Password baru dan konfirmasi password tidak cocok.");
            return;
        }

        setIsPasswordSaving(true);

        // Panggil fungsi update user dari Supabase Auth
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) {
            setPasswordError(`Gagal memperbarui password: ${error.message}`);
        } else {
            setPasswordSuccess("Password berhasil diperbarui.");
            // Kosongkan input setelah berhasil
            setNewPassword('');
            setConfirmPassword('');
        }

        setIsPasswordSaving(false);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p>Memuat Pengaturan...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center py-4">
                        <a href="/dashboard">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Kembali ke Dashboard
                            </Button>
                        </a>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="space-y-8">
                    {/* General Settings */}
                    <Card>
                        <CardHeader className="flex flex-row justify-between items-start">
                            <div>
                                <CardTitle className="text-xl">Pengaturan Umum</CardTitle>
                                <CardDescription>Informasi umum mengenai lingkungan RW.</CardDescription>
                            </div>
                            {!editMode.general && (
                                <Button variant="outline" size="sm" onClick={() => handleEdit('general')}>
                                    <Edit className="h-4 w-4 mr-2" /> Edit
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="rw_name">Nama RW</Label>
                                <Input 
                                    id="rw_name" 
                                    value={settings.rw_name || ''} 
                                    onChange={e => handleInputChange('rw_name', e.target.value)}
                                    disabled={!editMode.general} 
                                    placeholder="Contoh: RW 08 Sambiroto"
                                />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="rw_address">Alamat</Label>
                                <Input 
                                    id="rw_address" 
                                    value={settings.rw_address || ''} 
                                    onChange={e => handleInputChange('rw_address', e.target.value)}
                                    disabled={!editMode.general} 
                                    placeholder="Contoh: Kel. Sambiroto, Kec. Tembalang, Kota Semarang"
                                />
                            </div>
                            {editMode.general && (
                                <div className="flex justify-end gap-2 pt-4">
                                    <Button variant="ghost" onClick={() => handleCancel('general')}>
                                        <X className="h-4 w-4 mr-2" /> Batal
                                    </Button>
                                    <Button onClick={() => handleSave('general')} disabled={isSaving}>
                                        {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                        {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Payment Settings */}
                    <Card>
                        <CardHeader className="flex flex-row justify-between items-start">
                            <div>
                                <CardTitle className="text-xl">Pengaturan Pembayaran</CardTitle>
                                <CardDescription>Atur tarif iuran bulanan (LPS) dan air bersih (PAB).</CardDescription>
                            </div>
                             {!editMode.payment && (
                                <Button variant="outline" size="sm" onClick={() => handleEdit('payment')}>
                                    <Edit className="h-4 w-4 mr-2" /> Edit
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="monthly_fee">Tarif Iuran Warga (LPS) per Bulan</Label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">Rp</span>
                                    <Input 
                                        id="monthly_fee" 
                                        type="number"
                                        value={settings.monthly_fee || ''} 
                                        onChange={e => handleInputChange('monthly_fee', e.target.value)}
                                        disabled={!editMode.payment} 
                                        className="pl-8"
                                        placeholder="50000"
                                    />
                                </div>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="pab_rate">Tarif Air Bersih (PAB) per Meter Kubik (m³)</Label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">Rp</span>
                                    <Input 
                                        id="pab_rate" 
                                        type="number"
                                        value={settings.pab_rate || ''} 
                                        onChange={e => handleInputChange('pab_rate', e.target.value)}
                                        disabled={!editMode.payment} 
                                        className="pl-8"
                                        placeholder="5000"
                                    />
                                </div>
                            </div>
                             {editMode.payment && (
                                <div className="flex justify-end gap-2 pt-4">
                                    <Button variant="ghost" onClick={() => handleCancel('payment')}>
                                        <X className="h-4 w-4 mr-2" /> Batal
                                    </Button>
                                    <Button onClick={() => handleSave('payment')} disabled={isSaving}>
                                        {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                        {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* --- CARD BARU UNTUK GANTI PASSWORD --- */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">Ganti Password</CardTitle>
                            <CardDescription>Ubah password Anda secara berkala untuk menjaga keamanan akun.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="new_password">Password Baru</Label>
                                <Input
                                    id="new_password"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    disabled={isPasswordSaving}
                                    placeholder="Minimal 6 karakter"
                                />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="confirm_password">Konfirmasi Password Baru</Label>
                                <Input
                                    id="confirm_password"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={isPasswordSaving}
                                    placeholder="Ulangi password baru Anda"
                                />
                            </div>
                            
                            {/* Pesan Error atau Sukses */}
                            {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
                            {passwordSuccess && <p className="text-sm text-green-600">{passwordSuccess}</p>}

                            <div className="flex justify-end pt-4">
                                <Button onClick={handlePasswordChange} disabled={isPasswordSaving}>
                                    {isPasswordSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <KeyRound className="h-4 w-4 mr-2" />}
                                    {isPasswordSaving ? 'Menyimpan...' : 'Ubah Password'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}