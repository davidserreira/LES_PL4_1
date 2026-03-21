import { useEffect, useMemo, useState } from 'react';
import { Plus, Loader2, MoreVertical, CheckCircle2, Clock, DollarSign, FileText, Check, ArrowUpDown, ArrowUp, ArrowDown, X, Box, Receipt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { pedidoCompraService } from '../services/pedidoCompraService';
import type { Utilizador } from '../services/utilizadorService';

type PrioridadePedido = 'NORMAL' | 'ALTA' | 'URGENTE';

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
    
    // Get user from localStorage
    const [user] = useState<Utilizador | null>(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const isFinance = user?.role === 'RESPONSAVEL_FINANCEIRO';

    useEffect(() => {
        let cancelled = false;
        // avoid memory leak warning using cancelled var instead of straight function call
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
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleActionMouseDown = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setOpenDropdownId(openDropdownId === id ? null : id);
    };

    const [isConfirming, setIsConfirming] = useState<number | null>(null);

    const handleConfirm = async (id: number) => {
        try {
            setIsConfirming(id);
            await pedidoCompraService.confirm(id);
            // Refresh list after confirm
            const data = await pedidoCompraService.getAll();
            setPedidos(data);
        } catch (e) {
            console.error('Erro ao confirmar:', e);
            alert('Não foi possível confirmar o pedido.');
        } finally {
            setIsConfirming(null);
            setOpenDropdownId(null);
        }
    };

    const stats = useMemo(() => {
        const total = pedidos.length;
        const pendentes = pedidos.filter(p => p.estado === 'PENDENTE');
        const confirmados = pedidos.filter(p => p.estado === 'CONFIRMADO');
        const valorPendente = pendentes.reduce((acc, p) => acc + (p.valorTotalEstimado || 0), 0);
        
        return {
            total,
            pendentes: pendentes.length,
            confirmados: confirmados.length,
            valorPendente
        };
    }, [pedidos]);

    const [selectedPedido, setSelectedPedido] = useState<PedidoCompra | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const dispPedidos = useMemo(() => {
        let sortablePedidos = [...pedidos];
        
        if (sortConfig !== null) {
            sortablePedidos.sort((a, b) => {
                let aValue: any = a[sortConfig.key as keyof PedidoCompra];
                let bValue: any = b[sortConfig.key as keyof PedidoCompra];

                if (sortConfig.key === 'criadoPor') {
                    aValue = a.criadoPor?.username || '';
                    bValue = b.criadoPor?.username || '';
                } else if (sortConfig.key === 'criadoEm') {
                    aValue = new Date(a.criadoEm).getTime();
                    bValue = new Date(b.criadoEm).getTime();
                } else if (sortConfig.key === 'prioridade') {
                    const prioriPriority: Record<string, number> = { 'NORMAL': 1, 'ALTA': 2, 'URGENTE': 3 };
                    aValue = prioriPriority[a.prioridade] || 0;
                    bValue = prioriPriority[b.prioridade] || 0;
                }

                if (aValue === undefined || aValue === null) aValue = '';
                if (bValue === undefined || bValue === null) bValue = '';

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortablePedidos;
    }, [pedidos, sortConfig]);

    const renderSortIcon = (key: string) => {
        if (!sortConfig || sortConfig.key !== key) return <ArrowUpDown size={12} className="opacity-40 transition-opacity group-hover:opacity-100" />;
        return sortConfig.direction === 'asc' 
            ? <ArrowUp size={12} className="text-emerald-600" />
            : <ArrowDown size={12} className="text-emerald-600" />;
    };

    return (
        <>
            <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pedidos de Compra</h1>
                        <p className="mt-1 text-sm text-slate-500">Visualização e integração dos pedidos.</p>
                    </div>
                    {!isFinance && (
                        <button
                            onClick={() => navigate('/pedidos/novo')}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                        >
                            <Plus size={18} /> Novo pedido
                        </button>
                    )}
                </div>

                {isFinance && !loading && !error && pedidos.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center shrink-0">
                                <FileText size={24} className="text-slate-400" />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total de Pedidos</p>
                                <p className="text-2xl font-black text-slate-900 leading-none mt-1">{stats.total}</p>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-2xl border border-amber-200 p-5 shadow-sm flex items-center gap-4 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
                            <div className="w-12 h-12 bg-amber-50 rounded-xl border border-amber-100 flex items-center justify-center shrink-0">
                                <Clock size={24} className="text-amber-500" />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Pendentes</p>
                                <p className="text-2xl font-black text-slate-900 leading-none mt-1">{stats.pendentes}</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-sm flex items-center gap-4 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-400"></div>
                            <div className="w-12 h-12 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-center shrink-0">
                                <CheckCircle2 size={24} className="text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Aprovados</p>
                                <p className="text-2xl font-black text-slate-900 leading-none mt-1">{stats.confirmados}</p>
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-md flex items-center gap-4 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                <DollarSign size={64} className="text-white" />
                            </div>
                            <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center shrink-0 z-10 border border-slate-700">
                                <DollarSign size={24} className="text-emerald-400" />
                            </div>
                            <div className="z-10">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Faturação Pendente</p>
                                <p className="text-xl font-black text-white leading-none mt-1">{formatCurrency(stats.valorPendente)}</p>
                            </div>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center items-center h-64 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <Loader2 className="animate-spin text-emerald-600" />
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-xl">{error}</div>
                ) : dispPedidos.length === 0 ? (
                    <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm text-center">
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Nenhum pedido por enquanto</h3>
                        <p className="text-sm text-slate-500 mb-6">
                            {isFinance ? 'Atualmente não existem pedidos de compra no sistema.' : 'Crie um novo pedido para começar.'}
                        </p>
                        {!isFinance && (
                            <button
                                onClick={() => navigate('/pedidos/novo')}
                                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm mx-auto"
                            >
                                <Plus size={18} strokeWidth={2.5} /> Adicionar Pedido
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-widest font-bold border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 cursor-pointer group hover:bg-slate-100 transition-colors" onClick={() => handleSort('codigoFormatado')}>
                                            <div className="flex items-center gap-1.5">ID {renderSortIcon('codigoFormatado')}</div>
                                        </th>
                                        <th className="px-6 py-4 cursor-pointer group hover:bg-slate-100 transition-colors" onClick={() => handleSort('criadoEm')}>
                                            <div className="flex items-center gap-1.5">Data {renderSortIcon('criadoEm')}</div>
                                        </th>
                                        <th className="px-6 py-4 cursor-pointer group hover:bg-slate-100 transition-colors" onClick={() => handleSort('criadoPor')}>
                                            <div className="flex items-center gap-1.5">Emitido por {renderSortIcon('criadoPor')}</div>
                                        </th>
                                        <th className="px-6 py-4 cursor-pointer group hover:bg-slate-100 transition-colors" onClick={() => handleSort('prioridade')}>
                                            <div className="flex items-center gap-1.5">Prioridade {renderSortIcon('prioridade')}</div>
                                        </th>
                                        <th className="px-6 py-4 cursor-pointer group hover:bg-slate-100 transition-colors text-right" onClick={() => handleSort('valorTotalEstimado')}>
                                            <div className="flex items-center justify-end gap-1.5">Total {renderSortIcon('valorTotalEstimado')}</div>
                                        </th>
                                        <th className="px-6 py-4 cursor-pointer group hover:bg-slate-100 transition-colors" onClick={() => handleSort('estado')}>
                                            <div className="flex items-center gap-1.5">Estado {renderSortIcon('estado')}</div>
                                        </th>
                                        <th className="px-6 py-4 text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {dispPedidos.map((p) => (
                                        <tr 
                                            key={p.id} 
                                            onClick={() => setSelectedPedido(p)}
                                            className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                                        >
                                            <td className="px-6 py-4 font-bold text-slate-900">{p.codigoFormatado}</td>
                                            <td className="px-6 py-4 text-slate-600 font-medium">{formatDate(p.criadoEm)}</td>
                                            <td className="px-6 py-4 text-slate-600 font-medium">
                                                {p.criadoPor?.username
                                                    ? `${p.criadoPor.username} (${getRoleLabel(p.criadoPor.role)})`
                                                    : '—'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-200">
                                                    {p.prioridade}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-slate-900">{formatCurrency(p.valorTotalEstimado || 0)}</td>
                                            <td className="px-6 py-4">
                                                {p.estado === 'CONFIRMADO' ? (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                        CONFIRMADO
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-100">
                                                        PENDENTE
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center relative" onClick={(e) => e.stopPropagation()}>
                                                {isFinance && p.estado === 'PENDENTE' ? (
                                                    <button
                                                        onClick={() => handleConfirm(p.id)}
                                                        disabled={isConfirming === p.id}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-all shadow-sm focus:ring-2 focus:ring-emerald-500/50"
                                                    >
                                                        {isConfirming === p.id ? (
                                                            <Loader2 size={14} className="animate-spin" />
                                                        ) : (
                                                            <Check size={14} strokeWidth={2.5} />
                                                        )}
                                                        {isConfirming === p.id ? 'A processar...' : 'Aprovar'}
                                                    </button>
                                                ) : (
                                                    <>
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
                                                                <button
                                                                    disabled
                                                                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-400 cursor-not-allowed transition-colors"
                                                                >
                                                                    Cancelar Pedido
                                                                </button>
                                                            </div>
                                                        )}
                                                    </>
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

            {/* Modal de Detalhes do Pedido */}
            {selectedPedido && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        
                        {/* Header do Modal */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-200 flex flex-col items-center justify-center shrink-0">
                                    <Receipt size={20} className="text-slate-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 leading-tight">Detalhes do Pedido</h2>
                                    <p className="text-sm font-medium text-slate-500">{selectedPedido?.codigoFormatado}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedPedido(null)}
                                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors focus:outline-none"
                            >
                                <X size={20} strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Corpo do Modal (com scroll) */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            
                            {/* Bloco de Info */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Estado</p>
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black ${selectedPedido?.estado === 'CONFIRMADO' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {selectedPedido?.estado}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Data Criação</p>
                                    <p className="font-semibold text-slate-800 text-sm">{selectedPedido?.criadoEm ? formatDate(selectedPedido.criadoEm) : ''}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Prioridade</p>
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black bg-slate-200 text-slate-700">
                                        {selectedPedido?.prioridade}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Emitido por</p>
                                    <p className="font-semibold text-slate-800 text-sm line-clamp-1">
                                        {selectedPedido?.criadoPor?.username || '—'}
                                    </p>
                                </div>
                            </div>

                            {/* Tabela de Itens */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                                    <Box size={16} className="text-emerald-600" /> Itens Requisitados
                                </h3>
                                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                                            <tr>
                                                <th className="px-4 py-3">Produto</th>
                                                <th className="px-4 py-3 text-center">Quantidade</th>
                                                <th className="px-4 py-3 text-right">Custo Un.</th>
                                                <th className="px-4 py-3 text-right">Total Linha</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {selectedPedido?.linhas?.map((l: any, i: number) => (
                                                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-4 py-3 font-semibold text-slate-800">{l.produto?.nome || `Prod ID: ${l.produtoId}`}</td>
                                                    <td className="px-4 py-3 text-center font-bold text-slate-700">x{l.quantidade}</td>
                                                    <td className="px-4 py-3 text-right text-slate-500">{formatCurrency(l.precoUnitario)}</td>
                                                    <td className="px-4 py-3 text-right font-bold text-slate-900 border-l border-slate-50 bg-slate-50/30">
                                                        {formatCurrency(l.valorTotal)}
                                                    </td>
                                                </tr>
                                            ))}
                                            {(!selectedPedido?.linhas || selectedPedido.linhas.length === 0) && (
                                                <tr>
                                                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400 font-medium">Nenhum item encontrado.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                        <tfoot className="bg-slate-50 border-t border-slate-200">
                                            <tr>
                                                <td colSpan={3} className="px-4 py-4 text-right font-semibold text-slate-500 text-xs tracking-wider uppercase">Valor Total Estimado:</td>
                                                <td className="px-4 py-4 text-right font-black text-slate-900 text-lg">
                                                    {formatCurrency(selectedPedido?.valorTotalEstimado || 0)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                        </div>

                        {/* Footer Ações */}
                        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 rounded-b-2xl">
                            <button
                                onClick={() => setSelectedPedido(null)}
                                className="px-5 py-2.5 rounded-xl font-bold text-sm bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                                Fechar
                            </button>
                            {isFinance && selectedPedido?.estado === 'PENDENTE' && typeof selectedPedido.id === 'number' && (
                                <button
                                    onClick={() => handleConfirm(selectedPedido.id)}
                                    disabled={isConfirming === selectedPedido.id}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-sm transition-all shadow-emerald-600/20 disabled:opacity-70 disabled:pointer-events-none"
                                >
                                    {isConfirming === selectedPedido.id ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <Check size={18} strokeWidth={2.5} />
                                    )}
                                    {isConfirming === selectedPedido.id ? 'A processar...' : 'Confirmar Envio'}
                                </button>
                            )}
                        </div>

                    </div>
                </div>
            )}
        </>
    );
}

