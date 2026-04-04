
import { useEffect, useState, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, ChevronLeft, ChevronRight, Factory, LogOut, Users, ClipboardList } from 'lucide-react';
import { Utilizador } from '../services/utilizadorService';

interface SidebarProps {
    user: Utilizador;
    isCollapsed: boolean;
    onToggle: () => void;
    onLogout: () => void;
}

const Sidebar = ({ user, isCollapsed, onToggle, onLogout }: SidebarProps) => {
    const [showLogout, setShowLogout] = useState(false);
    const sidebarRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement | null;
            if (!target) return;

            const isToggle = target.closest('[data-logout-toggle]');
            const isPanel = target.closest('[data-logout-panel]');

            if (!isToggle && !isPanel) {
                setShowLogout(false);
            }

            // Close sidebar if clicked outside and not collapsed
            if (sidebarRef.current && !sidebarRef.current.contains(target) && !isCollapsed) {
                onToggle();
            }
        };

        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [isCollapsed, onToggle]);

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'ADMINISTRADOR': return 'Admin';
            case 'RESPONSAVEL_STOCK': return 'Gestor Stock';
            case 'RESPONSAVEL_FINANCEIRO': return 'Financeiro';
            default: return 'Utilizador';
        }
    };

    const menuItems = [
        { to: '/', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/catalogo', label: 'Stock', icon: BookOpen },
        { to: '/fornecedores', label: 'Fornecedores', icon: Factory },
        { to: '/pedidos', label: 'Pedidos de Compra', icon: ClipboardList },
        { to: '/utilizadores', label: 'Utilizadores', icon: Users },
    ];

    return (
        <aside ref={sidebarRef} className={`bg-slate-900 text-white flex flex-col min-h-screen transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'} relative z-50`}>
            {/* Logo/Header */}
            <div className={`p-6 border-b border-slate-800 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                {!isCollapsed && (
                    <div className="flex items-center justify-between w-full">
                        <span className="text-xl font-bold tracking-tight text-emerald-400 px-1 line-clamp-1">
                            {getRoleLabel(user.role)}
                        </span>
                        <button
                            type="button"
                            onClick={() => setShowLogout((prev) => !prev)}
                            data-logout-toggle
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors focus:outline-none"
                            title="Desconectar"
                        >
                            <LogOut size={20} />
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
                        className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center font-bold text-white hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                        title={getRoleLabel(user.role)}
                    >
                        {getRoleLabel(user.role).charAt(0)}
                    </button>
                )}
            </div>

            {/* Logout Panel */}
            <div
                data-logout-panel
                className={`px-4 pt-3 transition-all duration-200 ${showLogout ? 'opacity-100 max-h-40' : 'opacity-0 max-h-0 pointer-events-none'
                    }`}
            >
                <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/40 flex items-center justify-center">
                            <LogOut size={18} className="text-red-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-50">Sair do sistema</p>
                            <p className="text-[10px] text-slate-400 leading-tight">Olá, {user.username}. Deseja terminar a sessão?</p>
                        </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                        <button
                            type="button"
                            onClick={() => setShowLogout(false)}
                            className="flex-1 px-2 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 transition-colors"
                        >
                            Voltar
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setShowLogout(false);
                                onLogout();
                            }}
                            className="flex-1 px-2 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-red-600 text-white hover:bg-red-500 transition-colors"
                        >
                            Sair
                        </button>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4">
                <ul className="space-y-1 px-3">
                    {menuItems.map((item) => (
                        <li key={item.to}>
                            <NavLink
                                to={item.to}
                                onClick={() => {
                                    if (isCollapsed) {
                                        onToggle();
                                    }
                                }}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive
                                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    } ${isCollapsed ? 'justify-center' : ''}`
                                }
                                title={isCollapsed ? item.label : ""}
                            >
                                <item.icon size={22} className="shrink-0" />
                                {!isCollapsed && <span className="font-medium text-sm">{item.label}</span>}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Collapse Toggle Button */}
            <div className="p-4 border-t border-slate-800 flex flex-col gap-4">
                <button
                    onClick={onToggle}
                    className="flex items-center justify-center w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all border border-slate-700"
                    title={isCollapsed ? "Expandir" : "Recolher"}
                >
                    {isCollapsed ? <ChevronRight size={20} /> : <div className="flex items-center gap-2"><ChevronLeft size={20} /> <span className="text-[10px] font-bold uppercase tracking-widest">Recolher</span></div>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
