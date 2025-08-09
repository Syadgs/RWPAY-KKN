"use client"

import type React from "react"
import { useState } from "react"
import { createClient } from '@supabase/supabase-js' // <-- 1. Impor Supabase client
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DollarSign, Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react" // <-- Tambah Loader2
import Link from "next/link"
import { useRouter } from "next/navigation"

// --- 2. Buat instance Supabase client ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bqfyynmtdqjrcscshjvh.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const router = useRouter()

    // --- 3. Modifikasi fungsi handleLogin untuk menggunakan Supabase ---
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        // Menggunakan Supabase Auth untuk login
        const { error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            // Jika ada error dari Supabase (misal: password salah)
            setError(error.message === "Invalid login credentials" ? "Email atau password salah." : error.message);
        } else {
            // Jika berhasil, Supabase akan menyimpan sesi di browser
            // dan kita arahkan ke dashboard
            router.push("/dashboard");
        }

        setIsLoading(false)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-3 sm:py-4">
                        <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
                            <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">RWPay</h1>
                        </Link>
                        <Link href="/">
                            <Button variant="ghost" size="sm" className="flex-shrink-0">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">Kembali</span>
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            <div className="flex items-center justify-center p-4 min-h-[calc(100vh-80px)]">
                <div className="w-full max-w-md">
                    {/* Title */}
                    <div className="text-center mb-6 sm:mb-8">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Login Pengurus RW</h2>
                    </div>

                    <Card className="shadow-lg">
                        <CardHeader className="space-y-1 pb-4">
                            <CardTitle className="text-lg sm:text-xl">Masuk ke Dashboard</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm sm:text-base">
                                        Email
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="masukkan email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="text-sm sm:text-base h-10 sm:h-11"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-sm sm:text-base">
                                        Password
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Masukkan password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="text-sm sm:text-base pr-10 h-10 sm:h-11"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>

                                {error && (
                                    <Alert variant="destructive">
                                        <AlertDescription className="text-sm">{error}</AlertDescription>
                                    </Alert>
                                )}

                                <Button type="submit" className="w-full text-sm sm:text-base h-10 sm:h-11" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    {isLoading ? "Memproses..." : "Masuk"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}