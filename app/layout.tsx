import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "RWPay - Solusi Digital Pendataan Iuran RW",
  description:
    "Sistem manajemen keuangan RW yang transparan dan efisien dengan teknologi AI. Program KKN Undip 2025 di RW 08 Sambiroto, Tembalang.",
  keywords: "RW, iuran, keuangan, KKN, Undip, Sambiroto, Tembalang, AI, digital",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
