'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    Bell,
    Menu,
    X,
    LogOut,
    User,
    Settings,
    HelpCircle,
    ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
    title?: string;
    showBack?: boolean;
}

export default function Header({ title = "QuestEval", showBack = false }: HeaderProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    const [user, setUser] = useState<{ fullName: string; email: string; avatarUrl?: string } | null>(null);
    const [initials, setInitials] = useState("U");

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                setUser(userData);
                if (userData.fullName) {
                    const parts = userData.fullName.split(' ');
                    const rawInitials = parts.length > 1
                        ? (parts[0][0] + (parts[parts.length - 1][0] || ''))
                        : parts[0][0];
                    setInitials(rawInitials.toUpperCase());
                }
            } catch (e) {
                console.error("Error parsing user data", e);
            }
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsProfileOpen(false);
        router.push('/login');
    };

    // Close profile dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [profileRef]);

    return (
        <header className="bg-background border-b border-border sticky top-0 z-40 w-full animate-fade-in">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                {/* Left: Logo or Title */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Back Button (Only if NOT on dashboard or home) */}
                    {(pathname !== '/dashboard' && pathname !== '/') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.back()}
                            className="p-2 h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-all active:scale-90"
                            title="Volver"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    )}

                    {/* Mobile Menu Trigger */}
                    <button
                        className="md:hidden p-2 -ml-1 hover:bg-secondary rounded-full transition-colors"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>

                    <Link href="/dashboard" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 bg-primary rounded-sm rotate-45 flex items-center justify-center group-hover:rotate-0 transition-transform duration-300">
                            <div className="w-4 h-4 bg-primary-foreground/90 -rotate-45 group-hover:rotate-0 transition-transform duration-300 transform scale-75" />
                        </div>
                        <span className="font-bold text-xl title-serif hidden sm:inline-block tracking-tight text-foreground">
                            {title === "QuestEval" ? "QUESTEVAL" : title}
                        </span>
                    </Link>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 md:gap-4">
                    {/* Notifications */}
                    <Link href="/notifications">
                        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border-2 border-background animate-pulse"></span>
                        </Button>
                    </Link>

                    {/* User Profile Dropdown (Custom Implementation) */}
                    <div className="relative" ref={profileRef}>
                        <Button
                            variant="ghost"
                            className="relative h-9 w-9 rounded-full bg-secondary overflow-hidden border border-border focus:ring-0 p-0"
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                        >
                            {user?.avatarUrl ? (
                                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <span className="font-medium text-sm text-secondary-foreground">{initials}</span>
                            )}
                        </Button>

                        {/* Dropdown Content */}
                        {isProfileOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-md shadow-lg py-1 animate-in fade-in zoom-in-95 z-50">
                                <div className="px-3 py-2 border-b border-border mb-1">
                                    <p className="text-sm font-medium leading-none">{user?.fullName || 'Usuario'}</p>
                                    <p className="text-xs leading-none text-muted-foreground mt-1">{user?.email || 'usuario@questeval.edu'}</p>
                                </div>

                                <Link
                                    href="/profile"
                                    className="flex items-center px-3 py-2 text-sm hover:bg-secondary transition-colors"
                                    onClick={() => setIsProfileOpen(false)}
                                >
                                    <User className="mr-2 h-4 w-4" />
                                    <span>Perfil</span>
                                </Link>
                                <Link
                                    href="/settings"
                                    className="w-full flex items-center px-3 py-2 text-sm hover:bg-secondary transition-colors text-left"
                                    onClick={() => setIsProfileOpen(false)}
                                >
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Configuración</span>
                                </Link>
                                <Link
                                    href="/help"
                                    className="w-full flex items-center px-3 py-2 text-sm hover:bg-secondary transition-colors text-left"
                                    onClick={() => setIsProfileOpen(false)}
                                >
                                    <HelpCircle className="mr-2 h-4 w-4" />
                                    <span>Ayuda</span>
                                </Link>

                                <div className="border-t border-border mt-1 pt-1">
                                    <button
                                        className="w-full flex items-center px-3 py-2 text-sm hover:bg-destructive/10 text-destructive transition-colors text-left"
                                        onClick={handleLogout}
                                    >
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Cerrar Sesión</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {
                isMenuOpen && (
                    <div className="md:hidden absolute top-16 left-0 w-full bg-background border-b border-border shadow-lg animate-in slide-in-from-top-2 p-4 flex flex-col gap-2">
                        <Link href="/dashboard" className="p-3 hover:bg-secondary rounded-md font-medium" onClick={() => setIsMenuOpen(false)}>
                            Inicio
                        </Link>
                        <Link href="/projects" className="p-3 hover:bg-secondary rounded-md font-medium" onClick={() => setIsMenuOpen(false)}>
                            Mis Proyectos
                        </Link>
                        <Link href="/evaluations" className="p-3 hover:bg-secondary rounded-md font-medium" onClick={() => setIsMenuOpen(false)}>
                            Evaluaciones
                        </Link>
                        <Link href="/groups" className="p-3 hover:bg-secondary rounded-md font-medium" onClick={() => setIsMenuOpen(false)}>
                            Grupos
                        </Link>
                    </div>
                )
            }
        </header >
    );
}
