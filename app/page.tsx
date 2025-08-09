import React from 'react';
import { Button } from "@/components/ui/button";
import {
    ArrowRight,
    DollarSign,
    LucideProps,
} from "lucide-react";

// --- Type Definitions ---

// Defines the names of icons we can use, ensuring type safety.
const LucideIcons = {
    ArrowRight, DollarSign
};
type IconName = keyof typeof LucideIcons;

// Props for the Icon component
interface IconProps extends LucideProps {
    name: IconName;
}

// --- Icon Component ---

// A helper component to dynamically render icons based on their name (string).
const Icon = ({ name, ...props }: IconProps) => {
    const LucideIcon = LucideIcons[name];
    if (!LucideIcon) return null;
    return <LucideIcon {...props} />;
};


// --- Section Components ---

const Header = () => (
    <header className="absolute top-0 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center items-center py-6">
                <div className="flex items-center space-x-3 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-md">
                    <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                        <Icon name="DollarSign" className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-bold text-xl text-gray-800">RWPay System</span>
                </div>
            </div>
        </div>
    </header>
);

const HeroSection = () => (
    <section className="relative flex items-center justify-center h-[55vh] bg-gradient-to-b from-blue-50 via-white to-gray-50">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight mb-4">
                Sistem Pembayaran
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mt-2">
                    Iuran RW 08 Sambiroto
                </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
                Kelola pembayaran iuran warga dengan mudah, efisien, dan transparan. Sistem terintegrasi untuk LPS dan PAB dengan laporan real-time.
            </p>
        </div>
    </section>
);

const CtaSection = () => (
    <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Siap Memulai?</h2>
            <p className="text-xl text-blue-100 mb-8">
                Mulai kelola pembayaran iuran warga dengan sistem yang modern dan efisien.
            </p>
            <a href="/login">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-blue-600 px-10 py-3 bg-transparent transform hover:scale-105 transition-transform duration-300">
                    Login Admin
                </Button>
            </a>
        </div>
    </section>
);

const Footer = () => (
    <footer className="bg-gray-100">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} RWPay System. Diinisiasi oleh KKN-T 145 Universitas Diponegoro.</p>
        </div>
    </footer>
);


// --- Main Page Component ---

export default function App() {
    return (
        <div className="min-h-screen bg-gray-100 text-gray-800 antialiased">
            <Header />
            <main>
                <HeroSection />
                <CtaSection />
            </main>
            <Footer />
        </div>
    );
}
