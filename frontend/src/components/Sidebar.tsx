
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarProps {
    isCollapsed: boolean;
    onToggle: () => void;
}

const Sidebar = ({ isCollapsed, onToggle }: SidebarProps) => {
    return (
        <aside className={`bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 transition-all duration-300 z-40 ${isCollapsed ? 'w-20' : 'w-64'}`}>
            {/* Logo/Header */}
            <div className={`p-6 border-b border-slate-800 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                {!isCollapsed && <h2 className="text-2xl font-bold tracking-tight text-emerald-400">Admin</h2>}
                {isCollapsed && <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center font-bold text-white">A</div>}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4">
                <ul className="space-y-1 px-3">
                    <li>
                        <NavLink
                            to="/"
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive
                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                } ${isCollapsed ? 'justify-center' : ''}`
                            }
                            title={isCollapsed ? "Dashboard" : ""}
                        >
                            <LayoutDashboard size={22} className="shrink-0" />
                            {!isCollapsed && <span className="font-medium">Dashboard</span>}
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/catalogo"
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive
                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                } ${isCollapsed ? 'justify-center' : ''}`
                            }
                            title={isCollapsed ? "Catálogo" : ""}
                        >
                            <BookOpen size={22} className="shrink-0" />
                            {!isCollapsed && <span className="font-medium">Catálogo</span>}
                        </NavLink>
                    </li>
                </ul>
            </nav>

            {/* Collapse Toggle Button */}
            <div className="p-4 border-t border-slate-800 flex flex-col gap-4">
                <button
                    onClick={onToggle}
                    className="flex items-center justify-center w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all border border-slate-700"
                    title={isCollapsed ? "Expandir" : "Recolher"}
                >
                    {isCollapsed ? <ChevronRight size={20} /> : <div className="flex items-center gap-2"><ChevronLeft size={20} /> <span className="text-xs font-semibold uppercase tracking-wider">Recolher</span></div>}
                </button>


            </div>
        </aside>
    );
};

export default Sidebar;
