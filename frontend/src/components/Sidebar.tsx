
import { useEffect, useState, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, BookOpen, ChevronLeft, ChevronRight, Factory, LogOut, Users, ClipboardList, PackageCheck, ChevronDown, ShoppingCart, ShieldCheck, Boxes, Landmark, UserRound } from 'lucide-react';
import { Utilizador } from '../services/utilizadorService';
import logoImg from '../assets/logo.png';

interface SidebarProps {
    user: Utilizador;
    isCollapsed: boolean;
    onToggle: () => void;
    onLogout: () => void;
}

const Sidebar = ({ user, isCollapsed, onToggle, onLogout }: SidebarProps) => {
    const [showLogout, setShowLogout] = useState(false);
    const [comprasOpen, setComprasOpen] = useState(false);
    const [encomendasBadge, setEncomendasBadge] = useState<number>(0);
    const sidebarRef = useRef<HTMLElement>(null);
    const location = useLocation();

    // Auto-open "Compras" group if on a compras sub-route
    useEffect(() => {
        if (location.pathname === '/pedidos' || location.pathname === '/encomendas') {
            setComprasOpen(true);
        }
    }, [location.pathname]);

    // Badge de encomendas (aparece só após criar encomendas)
    useEffect(() => {
        const readBadge = () => {
            try {
                const raw = localStorage.getItem('encomendas:badge');
                if (!raw) return setEncomendasBadge(0);
                const parsed = JSON.parse(raw);
                const count = Number(parsed?.count || 0);
                setEncomendasBadge(Number.isFinite(count) ? count : 0);
            } catch {
                setEncomendasBadge(0);
            }
        };
        readBadge();
        const onEvt = () => readBadge();
        window.addEventListener('encomendas:badge', onEvt as any);
        window.addEventListener('storage', onEvt);
        return () => {
            window.removeEventListener('encomendas:badge', onEvt as any);
            window.removeEventListener('storage', onEvt);
        };
    }, []);

    // Ao abrir a tab/página de encomendas, o badge desaparece
    useEffect(() => {
        if (location.pathname !== '/encomendas') return;
        localStorage.removeItem('encomendas:badge');
        setEncomendasBadge(0);
    }, [location.pathname]);

    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement | null;
            if (!target) return;

            const isToggle = target.closest('[data-logout-toggle]');
            const isPanel = target.closest('[data-logout-panel]');

            if (!isToggle && !isPanel) {
                setShowLogout(false);
            }
        };

        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const roleMeta: Record<string, { label: string; Icon: LucideIcon }> = {
        ADMINISTRADOR: { label: 'Admin', Icon: UserRound },
        RESPONSAVEL_STOCK: { label: 'Gestor stock', Icon: Boxes },
        RESPONSAVEL_FINANCEIRO: { label: 'Financeiro', Icon: Landmark },
    };

    const { label: roleLabel, Icon: RoleIcon } = roleMeta[user.role] ?? { label: 'Utilizador', Icon: UserRound };

    const comprasRoles = ['ADMINISTRADOR', 'RESPONSAVEL_STOCK', 'RESPONSAVEL_FINANCEIRO'];
    const showCompras = comprasRoles.includes(user.role);
    const isComprasActive = location.pathname === '/pedidos' || location.pathname === '/encomendas';

    const menuItems = [
        { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMINISTRADOR', 'RESPONSAVEL_STOCK', 'RESPONSAVEL_FINANCEIRO'] },
        { to: '/relatorios', label: 'Financeiro', icon: Landmark, roles: ['ADMINISTRADOR', 'RESPONSAVEL_FINANCEIRO'] },
        { to: '/catalogo', label: 'Stock', icon: BookOpen, roles: ['ADMINISTRADOR', 'RESPONSAVEL_STOCK'] },
        { to: '/fornecedores', label: 'Fornecedores', icon: Factory, roles: ['ADMINISTRADOR', 'RESPONSAVEL_FINANCEIRO'] },
        { to: '/utilizadores', label: 'Utilizadores', icon: Users, roles: ['ADMINISTRADOR'] },
    ];

    const filteredItems = menuItems.filter(item => item.roles.includes(user.role));

    const navLinkClass = ({ isActive }: { isActive: boolean }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive
            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20'
            : 'text-white hover:bg-slate-800'
        } ${isCollapsed ? 'justify-center' : ''}`;

    return (
        <aside ref={sidebarRef} className={`bg-slate-900 dark:bg-slate-950 text-white flex flex-col h-screen sticky top-0 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'} z-50 dark:border-r dark:border-slate-800/50 relative shadow-[12px_0_35px_-5px_rgba(0,0,0,0.2)] dark:shadow-none`}>
            {/* Logo/Header */}
            <div className={`p-5 border-b border-slate-800 dark:border-slate-800/50 flex items-center min-h-[85px] transition-all overflow-hidden ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                <div className="shrink-0 flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-emerald-500 blur-xl opacity-20 rounded-full" />
                    <img src={logoImg} alt="Logo" className={`relative ${isCollapsed ? 'w-10 h-10' : 'w-12 h-12'} object-contain drop-shadow-[0_0_15px_rgba(52,211,153,0.3)] transition-all`} />
                </div>
                {!isCollapsed && (
                    <div className="flex flex-col min-w-0 animate-in fade-in slide-in-from-left-2 duration-300">
                        <span className="text-xl font-black tracking-tight text-white leading-tight">
                            Vet<span className="text-emerald-400">ERP</span>
                        </span>
                        <span className="text-[9px] text-emerald-500/80 font-bold uppercase tracking-[0.2em] leading-none mt-0.5">Management</span>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4">
                <ul className="space-y-1 px-3">
                    {filteredItems.map((item) => (
                        <li key={item.to} className="relative group">
                            <NavLink
                                to={item.to}
                                className={navLinkClass}
                            >
                                <item.icon size={18} className="shrink-0 text-white" />
                                {!isCollapsed && <span className="font-medium text-sm">{item.label}</span>}
                            </NavLink>
                            
                            {/* Hover Tooltip for normal items */}
                            {isCollapsed && (
                                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-xl z-[60]">
                                    {item.label}
                                </div>
                            )}
                        </li>
                    ))}

                    {/* Grupo Compras */}
                    {showCompras && (
                        <li className="relative group">
                            {/* Group header */}
                            <button
                                onClick={() => {
                                    setComprasOpen(prev => !prev);
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                                    isComprasActive && (isCollapsed || !comprasOpen)
                                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20'
                                        : 'text-white hover:bg-slate-800'
                                } ${isCollapsed ? 'justify-center' : 'justify-between'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="relative shrink-0 text-white">
                                        <ShoppingCart size={18} />
                                        {encomendasBadge > 0 && isCollapsed && (
                                            <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border border-slate-900 shadow">
                                                +{encomendasBadge}
                                            </span>
                                        )}
                                    </span>
                                    {!isCollapsed && <span className="font-medium text-sm">Compras</span>}
                                </div>
                                {!isCollapsed && (
                                    <ChevronDown
                                        size={12}
                                        className={`text-white transition-transform duration-200 ${comprasOpen ? 'rotate-180' : ''}`}
                                    />
                                )}
                            </button>

                            {/* Sub-items (Inline when expanded) */}
                            {!isCollapsed && comprasOpen && (
                                <ul className="mt-1 ml-4 pl-3 border-l border-slate-700 space-y-1">
                                    <li>
                                        <NavLink
                                            to="/pedidos"
                                            className={({ isActive }) =>
                                                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${isActive
                                                    ? 'bg-emerald-600/80 text-white'
                                                    : 'text-white hover:bg-slate-800'
                                                }`
                                            }
                                        >
                                            <ClipboardList size={13} className="shrink-0 text-white" />
                                            <span className="font-medium">Pedidos</span>
                                        </NavLink>
                                    </li>
                                    <li>
                                        <NavLink
                                            to="/encomendas"
                                            className={({ isActive }) =>
                                                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${isActive
                                                    ? 'bg-emerald-600/80 text-white'
                                                    : 'text-white hover:bg-slate-800'
                                                }`
                                            }
                                        >
                                            <span className="relative shrink-0 text-white">
                                                <PackageCheck size={13} />
                                                {encomendasBadge > 0 && (
                                                    <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border border-slate-900 shadow">
                                                        +{encomendasBadge}
                                                    </span>
                                                )}
                                            </span>
                                            <span className="font-medium">Encomendas</span>
                                        </NavLink>
                                    </li>
                                </ul>
                            )}

                            {/* Hover Sub-menu for Compras (when collapsed) */}
                            {isCollapsed && (
                                <div className="absolute left-full top-0 ml-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-[0_8px_30px_rgb(0,0,0,0.12)] z-[60] w-52">
                                    <div className="px-4 pb-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                        COMPRAS
                                    </div>
                                    <div className="flex flex-col">
                                        <NavLink 
                                            to="/pedidos" 
                                            className={({ isActive }) => 
                                                `px-4 py-2 text-sm transition-colors ${isActive ? 'text-emerald-600 dark:text-emerald-400 font-medium bg-slate-50 dark:bg-slate-700/50' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`
                                            }
                                        >
                                            Pedidos
                                        </NavLink>
                                        <NavLink 
                                            to="/encomendas" 
                                            className={({ isActive }) => 
                                                `px-4 py-2 text-sm flex justify-between items-center transition-colors ${isActive ? 'text-emerald-600 dark:text-emerald-400 font-medium bg-slate-50 dark:bg-slate-700/50' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`
                                            }
                                        >
                                            Encomendas
                                            {encomendasBadge > 0 && (
                                                <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                    {encomendasBadge}
                                                </span>
                                            )}
                                        </NavLink>
                                    </div>
                                </div>
                            )}
                        </li>
                    )}
                </ul>
            </nav>

            {/* Profile and Logout Section */}
            <div className="mt-auto flex flex-col justify-end border-t border-slate-800 dark:border-slate-800/50">
                {/* Logout Panel (Static flow above Profile) */}
                <div
                    data-logout-panel
                    className={`transition-all duration-300 overflow-hidden ${showLogout ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}
                >
                    <div className="bg-slate-900/95 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-800/50 p-5 space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 shadow-inner">
                                <LogOut size={18} className="text-red-400 drop-shadow-sm" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-slate-100 truncate">Sair do sistema</p>
                                <p className="text-[10px] font-medium text-slate-400 leading-tight truncate">Terminar sessão atual?</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setShowLogout(false)}
                                className="flex-1 px-3 py-2.5 text-xs font-bold rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-all active:scale-95"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowLogout(false);
                                    onLogout();
                                }}
                                className="flex-1 px-3 py-2.5 text-xs font-bold rounded-lg bg-red-600 text-white hover:bg-red-500 transition-all shadow-md shadow-red-900/20 active:scale-95 border border-red-500"
                            >
                                Sair
                            </button>
                        </div>
                    </div>
                </div>

                {/* Profile Bar */}
                <div className={`p-4 flex items-center transition-all ${isCollapsed ? 'justify-center' : 'justify-between hover:bg-slate-800/30'}`}>
                    {!isCollapsed && (
                        <div className="flex items-center justify-between w-full gap-3 min-w-0">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div
                                    className={`shrink-0 flex items-center justify-center w-10 h-10 rounded-full border shadow-inner ${
                                        user.role === 'ADMINISTRADOR'
                                            ? 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-800 border-emerald-400/50 text-white shadow-emerald-900/40'
                                            : 'bg-slate-800 border-slate-600 text-emerald-400'
                                    }`}
                                    aria-hidden
                                >
                                    <RoleIcon size={20} strokeWidth={2.5} className="drop-shadow-sm" />
                                </div>
                                <div className="min-w-0 flex flex-col justify-center">
                                    <span className="text-sm font-bold tracking-tight text-slate-100 leading-tight truncate">
                                        {user.username}
                                    </span>
                                    <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-widest mt-0.5">
                                        {roleLabel}
                                    </span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowLogout((prev) => !prev)}
                                data-logout-toggle
                                className="shrink-0 p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 dark:hover:bg-slate-900 rounded-xl transition-all focus:outline-none"
                                title="Desconectar"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    )}
                    {isCollapsed && (
                        <button
                            type="button"
                            onClick={() => {
                                if (isCollapsed) {
                                    onToggle();
                                    setShowLogout(true);
                                } else {
                                    setShowLogout((prev) => !prev);
                                }
                            }}
                            data-logout-toggle
                            className={`group relative w-10 h-10 rounded-full flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 transition-all ${
                                user.role === 'ADMINISTRADOR'
                                    ? 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-800 text-white shadow-lg shadow-emerald-900/40 border border-emerald-400/50 hover:from-emerald-400 hover:to-emerald-600'
                                    : 'bg-slate-800 text-emerald-400 border border-slate-600/60 hover:bg-slate-700/90 hover:border-emerald-500/40 hover:text-emerald-300 shadow-md shadow-black/20'
                            }`}
                            title={roleLabel}
                        >
                            <RoleIcon size={18} strokeWidth={2.5} className="drop-shadow-sm" />
                            {user.role === 'ADMINISTRADOR' && (
                                <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-white/10 group-hover:ring-white/20 transition-[box-shadow]" />
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Minimalist Collapse Toggle Button */}
            <div 
                className="absolute top-1/2 -right-7 -translate-y-1/2 w-8 h-16 flex items-center justify-center cursor-pointer group"
                onClick={onToggle}
                title={isCollapsed ? "Expandir" : "Recolher"}
            >
                <div className="w-2 h-10 bg-slate-400 group-hover:bg-emerald-500 dark:bg-slate-700 dark:group-hover:bg-emerald-500 rounded-full transition-colors shadow-sm" />
            </div>
        </aside>
    );
};

export default Sidebar;
