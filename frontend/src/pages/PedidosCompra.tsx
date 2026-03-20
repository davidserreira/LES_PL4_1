import { useEffect, useMemo, useState } from 'react';
import { Plus, Loader2, MoreVertical, Search, Filter, ArrowUpDown, ChevronDown, ClipboardList, AlertTriangle, Clock, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { pedidoCompraService } from '../services/pedidoCompraService';
import type { Utilizador } from '../services/utilizadorService';

type PrioridadePedido = 'NORMAL' | 'ALTA' | 'URGENTE';

interface Toast {
    message: string;
    type: 'success' | 'error';
}

interface PedidoCompra {
    id: number;
    estado: string;
    prioridade: PrioridadePedido;
    valorTotalEstimado: number;
    criadoEm: string | Date;
    criadoPor?: {
        id: number;
        username: string;
        role: Utilizador['role'];
    } | null;
    linhas?: any[];
    tipo: string;
    codigoFormatado: string;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
};

const formatDate = (value: string | Date) => {
    try {
        return new Date(value).toLocaleDateString('pt-PT');
    } catch {
        return '';
    }
};

// Função formatPedidoCode apagada - o backend envia codigoFormatado

const getRoleLabel = (role: Utilizador['role']) => {
    switch (role) {
        case 'ADMINISTRADOR':
            return 'Admin';
        case 'RESPONSAVEL_STOCK':
            return 'Gestor Stock';
        case 'RESPONSAVEL_FINANCEIRO':
            return 'Financeiro';
        default:
            return 'Utilizador';
    }
};

export default function PedidosCompra() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pedidos, setPedidos] = useState<PedidoCompra[]>([]);

    const [searchQuery, setSearchQuery] = useState('');
    const [filterTipo, setFilterTipo] = useState('Todos');
    const [filterEstado, setFilterEstado] = useState('Todos');
    const [filterPrioridade, setFilterPrioridade] = useState('Todas');
    const [sortField, setSortField] = useState<'criadoEm' | 'valorTotalEstimado'>('criadoEm');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [isFilterEstadoOpen, setIsFilterEstadoOpen] = useState(false);
    const [isFilterPrioridadeOpen, setIsFilterPrioridadeOpen] = useState(false);

    const [user] = useState<Utilizador | null>(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const [toast, setToast] = useState<Toast | null>(null);
    const [pedidoToCancel, setPedidoToCancel] = useState<number | null>(null);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const handleCancelar = (pedidoId: number) => {
        if (!user || (user.role !== 'ADMINISTRADOR' && user.role !== 'RESPONSAVEL_STOCK')) {
            showToast('Apenas Administradores ou Gestores de Stock podem cancelar pedidos.', 'error');
            return;
        }
        setPedidoToCancel(pedidoId);
        setOpenDropdownId(null);
    };

    const confirmCancelar = async () => {
        if (!pedidoToCancel || !user) return;
        
        try {
            await pedidoCompraService.cancelarPedido(pedidoToCancel, {
                userId: user.id,
                role: user.role
            });
            
            // Update local state without fetching all again
            setPedidos(pedidos.map(p => 
                p.id === pedidoToCancel ? { ...p, estado: 'CANCELADO' } : p
            ));
            showToast('Pedido cancelado com sucesso!', 'success');
        } catch (err: any) {
            console.error(err);
            showToast(err.response?.data?.error || 'Não foi possível cancelar o pedido.', 'error');
        } finally {
            setPedidoToCancel(null);
        }
    };

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        pedidoCompraService.getAll()
            .then((data: PedidoCompra[]) => {
                if (!cancelled) setPedidos(data);
            })
            .catch((e) => {
                console.error(e);
                if (!cancelled) setError('Erro ao carregar pedidos de compra.');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    // Dropdown state for operations
    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = () => {
            setOpenDropdownId(null);
            setIsFilterEstadoOpen(false);
            setIsFilterPrioridadeOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleActionMouseDown = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setOpenDropdownId(openDropdownId === id ? null : id);
    };

    const filteredPedidos = useMemo(() => {
        let result = pedidos;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(p => {
                const searchString = [
                    p.codigoFormatado,
                    formatDate(p.criadoEm),
                    p.criadoPor?.username,
                    getRoleLabel(p.criadoPor?.role as any)
                ].filter(Boolean).join(' ').toLowerCase();
                
                return searchString.includes(query);
            });
        }

        if (filterEstado !== 'Todos') {
            result = result.filter(p => (p.estado || '').toUpperCase() === filterEstado.toUpperCase());
        }

        if (filterTipo !== 'Todos') {
            result = result.filter(p => (p.tipo || '').toUpperCase() === filterTipo.toUpperCase());
        }

        if (filterPrioridade !== 'Todas') {
            result = result.filter(p => (p.prioridade || '').toUpperCase() === filterPrioridade.toUpperCase() && p.estado !== 'CANCELADO');
        }

        result = [...result].sort((a, b) => {
            let valA, valB;
            if (sortField === 'valorTotalEstimado') {
                valA = a.valorTotalEstimado || 0;
                valB = b.valorTotalEstimado || 0;
            } else {
                valA = new Date(a.criadoEm).getTime();
                valB = new Date(b.criadoEm).getTime();
            }

            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [pedidos, searchQuery, filterEstado, filterTipo, filterPrioridade, sortField, sortOrder]);

    const handleSort = (field: 'criadoEm' | 'valorTotalEstimado') => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
    };

    const SortIcon = ({ field }: { field: 'criadoEm' | 'valorTotalEstimado' }) => {
        return (
            <ArrowUpDown 
                size={14} 
                className={`transition-colors ${sortField === field ? 'text-emerald-600' : 'text-slate-300 group-hover:text-slate-400'}`} 
            />
        );
    };

    const getPriorityStyle = (priority: string) => {
        switch (priority?.toUpperCase()) {
            case 'URGENTE':
                return 'bg-red-50 text-red-700 border-red-100';
            case 'ALTA':
                return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'NORMAL':
                return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'BAIXA':
                return 'bg-slate-100 text-slate-700 border-slate-200';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'PENDENTE':
                return 'text-amber-700 bg-amber-50 border-amber-100';
            case 'APROVADO':
                return 'text-emerald-700 bg-emerald-50 border-emerald-100';
            case 'CANCELADO':
            case 'REJEITADO':
            case 'RECUSADO':
                return 'text-red-700 bg-red-50 border-red-100';
            default:
                return 'text-slate-700 bg-slate-50 border-slate-200';
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300 relative">
            {/* Toast Notification */}
            {toast && (
                <div className="fixed top-6 right-6 z-[60] animate-in slide-in-from-right-full duration-300">
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

            {/* Cancel Modal */}
            {pedidoToCancel !== null && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
                                <AlertTriangle size={24} className="text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Cancelar Pedido</h3>
                            <p className="text-sm text-slate-500">
                                Tem a certeza que deseja cancelar este pedido? Esta ação não pode ser desfeita.
                            </p>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                            <button
                                onClick={() => setPedidoToCancel(null)}
                                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors"
                            >
                                Voltar
                            </button>
                            <button
                                onClick={() => confirmCancelar()}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                            >
                                Sim, Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pedidos de Compra</h1>
                    <p className="mt-1 text-sm text-slate-500">Visualização dos pedidos criados.</p>
                </div>
                <button
                    onClick={() => navigate('/pedidos/novo')}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                >
                    <Plus size={18} /> Novo pedido
                </button>
            </div>

            {/* Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button 
                    onClick={() => { setFilterTipo('Todos'); setFilterEstado('Todos'); setFilterPrioridade('Todas'); setSearchQuery(''); }}
                    className={`p-5 rounded-xl border shadow-sm flex items-center justify-between text-left transition-all ${filterTipo === 'Todos' && filterEstado === 'Todos' && filterPrioridade === 'Todas' && !searchQuery ? 'bg-blue-50/50 border-blue-200 ring-2 ring-blue-500/20' : 'bg-white border-slate-200 hover:border-blue-100 hover:shadow-md'}`}
                >
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total de Pedidos</p>
                        <h3 className="text-2xl font-bold text-slate-800">{pedidos.filter(p => p.estado === 'PENDENTE').length}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                        <ClipboardList size={20} />
                    </div>
                </button>
                
                <button 
                    onClick={() => { setFilterPrioridade('URGENTE'); setSearchQuery(''); }}
                    className={`p-5 rounded-xl border shadow-sm flex items-center justify-between text-left transition-all ${filterPrioridade === 'URGENTE' ? 'bg-red-50/50 border-red-200 ring-2 ring-red-500/20' : 'bg-white border-slate-200 hover:border-red-100 hover:shadow-md'}`}
                >
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Urgentes</p>
                        <h3 className="text-2xl font-bold text-slate-800">{pedidos.filter(p => p.prioridade === 'URGENTE' && p.estado !== 'CANCELADO').length}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                        <AlertTriangle size={20} />
                    </div>
                </button>

                <button 
                    onClick={() => { setFilterPrioridade('ALTA'); setSearchQuery(''); }}
                    className={`p-5 rounded-xl border shadow-sm flex items-center justify-between text-left transition-all ${filterPrioridade === 'ALTA' ? 'bg-amber-50/50 border-amber-200 ring-2 ring-amber-500/20' : 'bg-white border-slate-200 hover:border-amber-100 hover:shadow-md'}`}
                >
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Alta Prioridade</p>
                        <h3 className="text-2xl font-bold text-slate-800">{pedidos.filter(p => p.prioridade === 'ALTA' && p.estado !== 'CANCELADO').length}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                        <Clock size={20} />
                    </div>
                </button>
            </div>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative z-20">
                <div className="flex items-center gap-2 text-slate-500 font-medium text-sm mr-2">
                    <Filter size={16} />
                    Filtros:
                </div>

                {/* Tipo de Pedido Segmented Tabs */}
                <div className="flex p-1 bg-slate-100/50 rounded-lg border border-slate-200/60">
                    <button
                        onClick={() => setFilterTipo('Todos')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filterTipo === 'Todos' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-600 hover:text-slate-900'} `}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setFilterTipo('MANUAL')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filterTipo === 'MANUAL' ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-600 hover:text-slate-900'} `}
                    >
                        Manuais
                    </button>
                    <button
                        onClick={() => setFilterTipo('AUTOMATICO')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filterTipo === 'AUTOMATICO' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-600 hover:text-slate-900'} `}
                    >
                        Automáticos
                    </button>
                </div>

                <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>

                {/* Dropdown Estado */}
                <div className="relative min-w-[170px]">
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsFilterPrioridadeOpen(false); setIsFilterEstadoOpen(!isFilterEstadoOpen); }}
                        className={`w-full flex items-center justify-between gap-2 px-4 py-2 bg-white border rounded-lg text-sm font-medium transition-all ${filterEstado !== 'Todos' ? 'border-blue-500 text-blue-700 ring-4 ring-blue-500/10' : 'border-slate-200 text-slate-700 hover:border-slate-300'}`}
                    >
                        {filterEstado === 'Todos' ? 'Todos os estados' : filterEstado}
                        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isFilterEstadoOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isFilterEstadoOpen && (
                        <div 
                            onMouseDown={(e) => e.stopPropagation()} 
                            className="absolute top-full left-0 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95"
                        >
                            <button
                                onClick={() => { setFilterEstado('Todos'); setIsFilterEstadoOpen(false); }}
                                className={`w-full text-left px-4 py-2 text-sm transition-colors ${filterEstado === 'Todos' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
                            >
                                Todos os estados
                            </button>
                            {['PENDENTE', 'APROVADO', 'CANCELADO'].map(est => (
                                <button
                                    key={est}
                                    onClick={() => { setFilterEstado(est); setIsFilterEstadoOpen(false); }}
                                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${filterEstado === est ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
                                >
                                    {est}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Dropdown Prioridade */}
                <div className="relative min-w-[170px]">
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsFilterEstadoOpen(false); setIsFilterPrioridadeOpen(!isFilterPrioridadeOpen); }}
                        className={`w-full flex items-center justify-between gap-2 px-4 py-2 bg-white border rounded-lg text-sm font-medium transition-all ${filterPrioridade !== 'Todas' ? 'border-blue-500 text-blue-700 ring-4 ring-blue-500/10' : 'border-slate-200 text-slate-700 hover:border-slate-300'}`}
                    >
                        {filterPrioridade === 'Todas' ? 'Todas as prioridades' : filterPrioridade}
                        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isFilterPrioridadeOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isFilterPrioridadeOpen && (
                        <div 
                            onMouseDown={(e) => e.stopPropagation()}
                            className="absolute top-full left-0 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95"
                        >
                            <button
                                onClick={() => { setFilterPrioridade('Todas'); setIsFilterPrioridadeOpen(false); }}
                                className={`w-full text-left px-4 py-2 text-sm transition-colors ${filterPrioridade === 'Todas' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
                            >
                                Todas as prioridades
                            </button>
                            {['NORMAL', 'ALTA', 'URGENTE'].map(prio => (
                                <button
                                    key={prio}
                                    onClick={() => { setFilterPrioridade(prio); setIsFilterPrioridadeOpen(false); }}
                                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${filterPrioridade === prio ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
                                >
                                    {prio}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Clear Filters */}
                {(filterTipo !== 'Todos' || filterEstado !== 'Todos' || filterPrioridade !== 'Todas') && (
                    <button
                        onClick={() => { setFilterTipo('Todos'); setFilterEstado('Todos'); setFilterPrioridade('Todas'); setSearchQuery(''); }}
                        className="ml-auto text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors px-2"
                    >
                        Limpar filtros
                    </button>
                )}
            </div>

            {/* BARRA DE PESQUISA */}
            {pedidos.length > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm relative z-10">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Pesquisar por ID, data ou criador..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-transparent border-0 outline-none text-sm placeholder:text-slate-400"
                        />
                    </div>
                    <div className="text-xs text-slate-500 font-medium px-4 whitespace-nowrap">
                        A mostrar <span className="font-bold text-slate-700">{filteredPedidos.length}</span> de <span className="font-bold text-slate-700">{pedidos.length}</span> pedidos
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center items-center h-64 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <Loader2 className="animate-spin text-emerald-600" />
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-xl">{error}</div>
            ) : filteredPedidos.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm text-center">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Nenhum pedido encontrado</h3>
                    <p className="text-sm text-slate-500 mb-6">Tente ajustar os seus filtros de pesquisa ou limpe a pesquisa.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-widest font-bold border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4">ID</th>
                                    <th 
                                        className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors group"
                                        onClick={() => handleSort('criadoEm')}
                                    >
                                        <div className="flex items-center gap-2">Data <SortIcon field="criadoEm" /></div>
                                    </th>
                                    <th className="px-6 py-4">Emitido por</th>
                                    <th className="px-6 py-4">Prioridade</th>
                                    <th 
                                        className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100 transition-colors group"
                                        onClick={() => handleSort('valorTotalEstimado')}
                                    >
                                        <div className="flex items-center justify-end gap-2"><SortIcon field="valorTotalEstimado" /> Total</div>
                                    </th>
                                    <th className="px-6 py-4">Estado</th>
                                    <th className="px-6 py-4 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredPedidos.map((p) => (
                                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-900">
                                            <div>{p.codigoFormatado}</div>
                                            <div className="text-[10px] text-slate-400 font-medium bg-slate-100 inline-block px-1.5 rounded mt-0.5">{p.tipo}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 font-medium">{formatDate(p.criadoEm)}</td>
                                        <td className="px-6 py-4 text-slate-600 font-medium">
                                            {p.criadoPor?.username
                                                ? `${p.criadoPor.username} (${getRoleLabel(p.criadoPor.role)})`
                                                : '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {p.estado === 'CANCELADO' ? (
                                                <span className="inline-flex items-center justify-center min-w-[60px] py-1 rounded-full text-[10px] font-black border text-slate-400 bg-slate-100 border-slate-200">
                                                    —
                                                </span>
                                            ) : (
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black border ${getPriorityStyle(p.prioridade)}`}>
                                                    {p.prioridade}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-900">{formatCurrency(p.valorTotalEstimado || 0)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black border ${getStatusStyle(p.estado || '')}`}>
                                                <span className="w-1.5 h-1.5 rounded-full mr-1.5 currentColor bg-current opacity-70"></span>
                                                {p.estado || 'PENDENTE'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center relative">
                                            <button
                                                onMouseDown={(e) => handleActionMouseDown(p.id, e)}
                                                className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors group-hover:block"
                                            >
                                                <MoreVertical size={18} />
                                            </button>

                                            {/* Dropdown Menu */}
                                            {openDropdownId === p.id && (
                                                <div
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                    className="absolute right-10 top-1/2 -translate-y-1/2 w-44 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-20 animate-in fade-in zoom-in-95 duration-100"
                                                >
                                                    {user && (user.role === 'ADMINISTRADOR' || user.role === 'RESPONSAVEL_STOCK') && p.estado !== 'CANCELADO' ? (
                                                        <button
                                                            onClick={() => handleCancelar(p.id)}
                                                            className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                                                        >
                                                            Cancelar
                                                        </button>
                                                    ) : (
                                                        <button
                                                            disabled
                                                            className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-400 cursor-not-allowed transition-colors"
                                                        >
                                                            Cancelar
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

