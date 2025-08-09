"use client"

import React, { useState, useEffect } from "react"
import { createClient } from '@supabase/supabase-js'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import type { Resident } from "@/lib/supabase"

// --- Pengaturan Klien Supabase ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bqfyynmtdqjrcscshjvh.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Fungsi Supabase & Validasi (Mock) ---
// Di aplikasi nyata, fungsi ini akan berada di file terpisah (misal: @/lib/residents)
async function upsertResident(residentData: Partial<Resident>) {
    const { data, error } = await supabase
        .from('residents')
        .upsert(residentData, { onConflict: 'id' })
        .select()
        .single();
    
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
    if (residentId) {
        query = query.not('id', 'eq', residentId);
    }
    const { data, error } = await query.limit(1);
    if (error) {
        console.error("Error checking house number:", error);
        return false; // Anggap tidak tersedia jika ada error
    }
    return data.length === 0;
}


interface ResidentFormProps {
  resident?: Resident;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ResidentForm({ resident, onSuccess, onCancel }: ResidentFormProps) {
  const [formData, setFormData] = useState({
    name: resident?.name || "",
    house_number: resident?.house_number || "",
    rt: resident?.rt || "01",
    address: resident?.address || "",
    phone: resident?.phone || "",
    status: resident?.status || ("active" as "active" | "inactive"),
  });
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors([])

    try {
      const validationErrors = validateResidentData(formData)
      if (validationErrors.length > 0) {
        setErrors(validationErrors)
        setIsLoading(false)
        return
      }

      if (!resident || resident.house_number !== formData.house_number) {
        const isAvailable = await isHouseNumberAvailable(formData.house_number, resident?.id)
        if (!isAvailable) {
          setErrors(["Nomor rumah sudah digunakan oleh warga lain"])
          setIsLoading(false)
          return
        }
      }

      await upsertResident({
        id: resident?.id,
        ...formData,
      })

      onSuccess()
    } catch (err) {
      setErrors([err instanceof Error ? err.message : "Terjadi kesalahan"])
    } finally {
      setIsLoading(false)
    }
  }

  const rtOptions = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15"]

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nama Lengkap *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Masukkan nama lengkap"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="house_number">Nomor Rumah *</Label>
          <Input
            id="house_number"
            value={formData.house_number}
            onChange={(e) => setFormData({ ...formData, house_number: e.target.value })}
            placeholder="Contoh: A-01, B-15"
            required
          />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Nomor Telepon</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="Contoh: 081234567890"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rt">RT *</Label>
          <Select value={formData.rt} onValueChange={(value) => setFormData({ ...formData, rt: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih RT" />
            </SelectTrigger>
            <SelectContent>
              {rtOptions.map((rt) => (
                <SelectItem key={rt} value={rt}>
                  RT {rt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value: "active" | "inactive") => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="inactive">Tidak Aktif</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Alamat Lengkap</Label>
        <Textarea
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Masukkan alamat lengkap"
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? "Menyimpan..." : resident ? "Perbarui" : "Simpan"}
        </Button>
      </div>
    </form>
  )
}
