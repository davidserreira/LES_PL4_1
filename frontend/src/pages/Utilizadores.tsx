import { useState, useEffect } from 'react';
import { 
    Plus, AlertCircle, CheckCircle2, X, Search, 
    MoreVertical, ArrowUpDown, ArrowUp, ArrowDown, Filter, ChevronDown, User, Trash2, Edit2
} from 'lucide-react';
import { utilizadorService, Utilizador } from '../services/utilizadorService';
import UtilizadorModal from '../components/UtilizadorModal';
import { Power, PowerOff } from 'lucide-react';

type SortField = 'id' | 'username' | 'role' | 'ativo';
type SortOrder = 'asc' | 'desc';

interface Toast {
    message: string;
    type: 'success' | 'error';
}

const Utilizadores = () => {
    const [utilizadores, setUtilizadores] = useState<Utilizador[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [utilizadorAEditar, setUtilizadorAEditar] = useState<Utilizador | null>(null);
    const [utilizadorAEliminar, setUtilizadorAEliminar] = useState<Utilizador | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [toast, setToast] = useState<Toast | null>(null);
    const [currentUser, setCurrentUser] = useState<Utilizador | null>(null);
    const [isSelfInactivateModalOpen, setIsSelfInactivateModalOpen] = useState(false);
    const [userToToggle, setUserToToggle] = useState<Utilizador | null>(null);

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) setCurrentUser(JSON.parse(savedUser));
    }, []);

    // Sorting state
    const [sortField, setSortField] = useState<SortField>('username');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

    // Filter states
    const [filterRole, setFilterRole] = useState<string>('');
    const [isFilterRoleOpen, setIsFilterRoleOpen] = useState(false);

    // Dropdown state
    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

    const ROLES = [
        { value: 'ADMINISTRADOR', label: 'Administrador' },
        { value: 'RESPONSAVEL_STOCK', label: 'Responsável pelo Stock' },
        { value: 'RESPONSAVEL_FINANCEIRO', label: 'Responsável Financeiro' }
    ];

    const fetchUtilizadores = async () => {
        try {
            setLoading(true);
            const data = await utilizadorService.getAll();
            setUtilizadores(data);
        } catch (error) {
            showToast('Erro ao carregar utilizadores', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUtilizadores();
    }, []);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = () => setOpenDropdownId(null);
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const handleDelete = async () => {
        if (!utilizadorAEliminar) return;
        try {
            await utilizadorService.delete(utilizadorAEliminar.id);
            setUtilizadores(utilizadores.filter((u) => u.id !== utilizadorAEliminar.id));
            showToast('Utilizador removido com sucesso', 'success');
            setUtilizadorAEliminar(null);
        } catch (error) {
            showToast('Erro ao remover utilizador', 'error');
        }
    };

    const handleToggleStatus = async (utilizador: Utilizador) => {
        if (!currentUser) return;

        // Prevent inactivating other admins
        if (utilizador.role === 'ADMINISTRADOR' && utilizador.id !== currentUser.id && utilizador.ativo !== false) {
            showToast('Não é permitido inativar outros utilizadores administradores.', 'error');
            setOpenDropdownId(null);
            return;
        }

        const isSelfInactivating = utilizador.id === currentUser.id && utilizador.ativo !== false;

        if (isSelfInactivating) {
            setUserToToggle(utilizador);
            setIsSelfInactivateModalOpen(true);
            setOpenDropdownId(null);
            return;
        }

        executeToggleStatus(utilizador);
    };

    const executeToggleStatus = async (utilizador: Utilizador) => {
        try {
            const newStatus = !utilizador.ativo;
            await utilizadorService.update(utilizador.id, { ativo: newStatus });
            
            setUtilizadores(utilizadores.map(u => 
                u.id === utilizador.id ? { ...u, ativo: newStatus } : u
            ));
            
            showToast(`Utilizador marcado como ${newStatus ? 'ativo' : 'inativo'} com sucesso`, 'success');

            // If self-inactivated, logout
            if (utilizador.id === currentUser?.id && newStatus === false) {
                setTimeout(() => {
                    localStorage.removeItem('user');
                    window.location.reload();
                }, 2000);
            }
        } catch (error) {
            showToast('Erro ao atualizar estado do utilizador', 'error');
        } finally {
            setOpenDropdownId(null);
        }
    };

    const filteredUtilizadores = utilizadores.filter((u) => {
        const query = searchQuery.toLowerCase();
        const matchesSearch = u.username.toLowerCase().includes(query) || u.role.toLowerCase().includes(query);
        const matchesRole = filterRole === '' || u.role === filterRole;
        return matchesSearch && matchesRole;
    });

    const sortedUtilizadores = [...filteredUtilizadores].sort((a, b) => {
        let aValue = a[sortField];
        let bValue = b[sortField];

        if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
        }
        if (sortField === 'ativo') {
            const aAtivo = a.ativo === false ? 0 : 1; // default is true if undefined
            const bAtivo = b.ativo === false ? 0 : 1;
            return sortOrder === 'asc' ? bAtivo - aAtivo : aAtivo - bAtivo;
        }
        return 0;
    });

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) return <ArrowUpDown size={14} className="text-slate-400 group-hover:text-slate-600" />;
        return sortOrder === 'asc' 
            ? <ArrowUp size={14} className="text-emerald-600" /> 
            : <ArrowDown size={14} className="text-emerald-600" />;
    };

    const getRoleBadge = (role: Utilizador['role']) => {
        const styles = {
            ADMINISTRADOR: 'bg-red-50 text-red-700 border-red-100',
            RESPONSAVEL_STOCK: 'bg-emerald-50 text-emerald-700 border-emerald-100',
            RESPONSAVEL_FINANCEIRO: 'bg-blue-50 text-blue-700 border-blue-100'
        };
        const labels = {
            ADMINISTRADOR: 'Administrador',
            RESPONSAVEL_STOCK: 'Gestor de Stock',
            RESPONSAVEL_FINANCEIRO: 'Financeiro'
        };
        return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${styles[role]}`}>
                {labels[role]}
            </span>
        );
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] relative text-slate-900">
            {toast && (
                <div className="fixed bottom-6 right-6 z-[110] animate-in slide-in-from-right-full duration-300">
                    <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border ${toast.type === 'success' 
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                        : 'bg-red-50 border-red-100 text-red-800'
                    }`}>
                        {toast.type === 'success' ? <CheckCircle2 size={20} className="text-emerald-500" /> : <AlertCircle size={20} className="text-red-500" />}
                        <span className="text-sm font-bold">{toast.message}</span>
                        <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70 transition-opacity">
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {isSelfInactivateModalOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    <div 
                        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xl animate-in fade-in duration-500" 
                        onClick={() => setIsSelfInactivateModalOpen(false)} 
                    />
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-300">
                        {/* Status bar */}
                        <div className="h-2 bg-amber-500 w-full" />
                        
                        <div className="p-8">
                            <div className="flex flex-col items-center text-center mb-8">
                                <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6 border border-amber-100 shadow-inner">
                                    <PowerOff size={36} className="text-amber-600 animate-pulse" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Auto-Inativação Crítica</h3>
                                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                                    Está prestes a suspender o seu próprio acesso. Esta ação tem consequências imediatas no seu acesso ao sistema.
                                </p>
                            </div>

                            <div className="space-y-4 mb-8 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                <div className="flex gap-3 items-start">
                                    <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                                        <div className="w-2 h-2 rounded-full bg-amber-600" />
                                    </div>
                                    <p className="text-xs text-slate-600 leading-normal font-bold">Será desconectado instantaneamente.</p>
                                </div>
                                <div className="flex gap-3 items-start">
                                    <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                                        <div className="w-2 h-2 rounded-full bg-amber-600" />
                                    </div>
                                    <p className="text-xs text-slate-600 leading-normal font-bold">Perderá permissões para gerir Stock, Pedidos e Fornecedores.</p>
                                </div>
                                <div className="flex gap-3 items-start">
                                    <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                                        <div className="w-2 h-2 rounded-full bg-amber-600" />
                                    </div>
                                    <p className="text-xs text-slate-600 leading-normal font-bold">Apenas outro administrador poderá reverter esta ação.</p>
                                </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => setIsSelfInactivateModalOpen(false)}
                                    className="flex-1 px-6 py-3.5 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all text-sm active:scale-95"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => {
                                        setIsSelfInactivateModalOpen(false);
                                        if (userToToggle) executeToggleStatus(userToToggle);
                                    }}
                                    className="flex-1 px-6 py-3.5 bg-amber-600 text-white font-black rounded-2xl hover:bg-amber-700 transition-all text-sm shadow-lg shadow-amber-600/20 active:scale-95"
                                >
                                    Confirmar e Sair
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {utilizadorAEliminar && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                    <div 
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300" 
                        onClick={() => setUtilizadorAEliminar(null)} 
                    />
                    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center shrink-0 border border-red-100">
                                    <Trash2 size={22} className="text-red-600" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-bold text-slate-900">Eliminar Utilizador</h3>
                                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                                        Tem a certeza que deseja eliminar o acesso de <span className="text-slate-900 font-bold">"{utilizadorAEliminar.username}"</span>?
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setUtilizadorAEliminar(null)}
                                    className="flex-1 px-4 py-2.5 bg-slate-50 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-all text-sm border border-slate-200"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all text-sm shadow-sm"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Bloco sticky integrado (Layout 2 Blocos) ── */}
            <div className="sticky top-0 z-40 bg-slate-50/90 backdrop-blur-xl border-b border-slate-200/50 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 pt-4 pb-5 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)] transition-all space-y-5 mb-2">
                <div className="space-y-5">
                    
                    {/* Linha 1: Título e Botões de ação lado a lado */}
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Utilizadores</h1>
                            <p className="mt-2 text-sm text-slate-500">
                                Gerencie os utilizadores e as suas permissões de acesso ao sistema.
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setUtilizadorAEditar(null);
                                setIsModalOpen(true);
                            }}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-black rounded-lg hover:bg-emerald-700 transition-all shadow-md shadow-emerald-500/20 active:scale-95"
                        >
                            <Plus size={18} />
                            Novo Utilizador
                        </button>
                    </div>

                    {/* ── Linha 2: 2 Blocos Separados (Pesquisa + Filtros) ── */}
                    <div className="flex flex-col xl:flex-row gap-4 items-stretch xl:items-center">
                        
                        {/* Search Bar Container */}
                        {utilizadores.length > 0 && (
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/80 p-2 rounded-xl border border-slate-200/60 shadow-sm relative z-10 flex-grow">
                                <div className="relative w-full max-w-md">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Pesquisar utilizador..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-transparent border-0 outline-none text-sm placeholder:text-slate-400"
                                    />
                                </div>
                                <div className="text-xs text-slate-500 font-medium px-4 whitespace-nowrap hidden sm:block">
                                    A mostrar <span className="font-bold text-slate-700">{filteredUtilizadores.length}</span> / <span className="font-bold text-slate-700">{utilizadores.length}</span>
                                </div>
                            </div>
                        )}

                        {/* Filtros Container */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white/80 p-3 rounded-xl border border-slate-200/60 shadow-sm flex-grow xl:flex-grow-0 relative z-20">
                            <div className="flex items-center gap-2 text-slate-500 font-medium text-sm mr-2 hidden sm:flex">
                                <Filter size={16} />
                                Filtros
                            </div>

                            {/* Role Dropdown */}
                            <div className="relative min-w-[220px]">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setIsFilterRoleOpen(!isFilterRoleOpen); }}
                                    className={`w-full flex items-center justify-between gap-2 px-4 py-1.5 bg-white border rounded-lg text-sm font-medium transition-all ${filterRole ? 'border-blue-500 text-blue-700 ring-4 ring-blue-500/10' : 'border-slate-200 text-slate-700 hover:border-slate-300'}`}
                                >
                                    {ROLES.find(r => r.value === filterRole)?.label || 'Todos os Cargos'}
                                    <ChevronDown size={16} className={`text-slate-400 transition-transform ${isFilterRoleOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isFilterRoleOpen && (
                                    <div 
                                        onMouseDown={(e) => e.stopPropagation()}
                                        className="absolute top-full left-0 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95"
                                    >
                                        <button
                                            onClick={() => { setFilterRole(''); setIsFilterRoleOpen(false); }}
                                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${!filterRole ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
                                        >
                                            Todos os Cargos
                                        </button>
                                        {ROLES.map(role => (
                                            <button
                                                key={role.value}
                                                onClick={() => { setFilterRole(role.value); setIsFilterRoleOpen(false); }}
                                                className={`w-full text-left px-4 py-2 text-sm transition-colors ${filterRole === role.value ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
                                            >
                                                {role.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Clear Filters */}
                            {(filterRole !== '' || searchQuery !== '') && (
                                <button
                                    onClick={() => { setFilterRole(''); setSearchQuery(''); }}
                                    className="p-1.5 ml-auto text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center shrink-0"
                                    title="Limpar filtros"
                                >
                                    <X size={18} strokeWidth={2.5} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="relative">
                        <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
                    </div>
                    <p className="mt-4 text-sm font-medium text-slate-500">A carregar utilizadores...</p>
                </div>
            ) : sortedUtilizadores.length > 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col flex-1 min-h-0 relative z-0">
                    <div className="w-full h-full overflow-auto custom-scrollbar">
                        <table className="w-full text-left relative">
                            <thead className="sticky top-0 z-30 bg-slate-50/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
                                <tr>
                                    <th 
                                        onClick={() => handleSort('username')}
                                        className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest text-left cursor-pointer hover:bg-slate-100 transition-colors group select-none"
                                    >
                                        <div className="flex items-center gap-2">
                                            Utilizador
                                            {getSortIcon('username')}
                                        </div>
                                    </th>
                                    <th 
                                        onClick={() => handleSort('role')}
                                        className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest text-left cursor-pointer hover:bg-slate-100 transition-colors group select-none"
                                    >
                                        <div className="flex items-center gap-2">
                                            Cargo
                                            {getSortIcon('role')}
                                        </div>
                                    </th>
                                    <th 
                                        onClick={() => handleSort('ativo')}
                                        className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest text-left cursor-pointer hover:bg-slate-100 transition-colors group select-none"
                                    >
                                        <div className="flex items-center gap-2">
                                            Estado
                                            {getSortIcon('ativo')}
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Ações</th>
                                </tr>
                            </thead>
                        <tbody className="">
                            {sortedUtilizadores.map((u) => (
                                <tr key={u.id} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-b-0">
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 font-bold border border-slate-200 transition-transform group-hover:scale-105">
                                                {u.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-slate-900">{u.username}</span>
                                                    {u.id === currentUser?.id && (
                                                        <span className="px-1.5 py-0.5 bg-slate-100 text-[8px] font-black text-slate-500 border border-slate-200 rounded-md uppercase tracking-wider flex items-center gap-1">
                                                            <div className="w-1 h-1 bg-emerald-500 rounded-full"></div>
                                                            Logado
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-slate-400 font-medium">ID: #{u.id}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3">
                                        {getRoleBadge(u.role)}
                                    </td>
                                    <td className="px-6 py-3">
                                        {u.ativo === false ? (
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black border bg-slate-50 text-slate-500 border-slate-200">
                                                Inativo
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black border bg-emerald-50 text-emerald-700 border-emerald-100">
                                                Ativo
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-3 text-right overflow-visible">
                                        <div className="relative flex justify-end">
                                            <button
                                                onMouseDown={(e) => {
                                                    e.stopPropagation();
                                                    setOpenDropdownId(openDropdownId === u.id ? null : u.id);
                                                }}
                                                className={`p-2 rounded-lg transition-all ${openDropdownId === u.id ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                                            >
                                                <MoreVertical size={18} />
                                            </button>

                                            {openDropdownId === u.id && (
                                                <div 
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                    className="absolute right-10 top-1/2 -translate-y-1/2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-200"
                                                >
                                                    <button
                                                        onClick={() => {
                                                            setUtilizadorAEditar(u);
                                                            setIsModalOpen(true);
                                                            setOpenDropdownId(null);
                                                        }}
                                                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                                    >
                                                        <Edit2 size={16} />
                                                        Editar Dados
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            // Only block if trying to INACTIVATE another admin
                                                            if (u.role === 'ADMINISTRADOR' && u.id !== currentUser?.id && u.ativo !== false) {
                                                                showToast('Não é permitido inativar outros administradores.', 'error');
                                                                setOpenDropdownId(null);
                                                                return;
                                                            }
                                                            handleToggleStatus(u);
                                                        }}
                                                        className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                                                            u.role === 'ADMINISTRADOR' && u.id !== currentUser?.id && u.ativo !== false
                                                                ? 'text-slate-300 cursor-not-allowed'
                                                                : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-600'
                                                        }`}
                                                    >
                                                        {u.ativo === false ? <Power size={16} /> : <PowerOff size={16} />}
                                                        {u.ativo === false ? 'Ativar Conta' : 'Inativar Conta'}
                                                    </button>
                                                    <div className="h-px bg-slate-100 mx-2 my-1" />
                                                    <button
                                                        onClick={() => {
                                                            setUtilizadorAEliminar(u);
                                                            setOpenDropdownId(null);
                                                        }}
                                                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                        Eliminar Registo
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <User size={32} className="text-slate-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Nenhum utilizador encontrado</h3>
                    <p className="text-sm text-slate-500 mt-1">Experimente ajustar os filtros ou a pesquisa.</p>
                </div>
            )}

            <UtilizadorModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchUtilizadores}
                utilizador={utilizadorAEditar}
            />
        </div>
    );
};

export default Utilizadores;
