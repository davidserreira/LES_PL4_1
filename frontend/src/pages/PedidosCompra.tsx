import { useEffect, useMemo, useState } from 'react';
import { Plus, Loader2, MoreVertical, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, ClipboardList, AlertTriangle, Clock, CheckCircle2, AlertCircle, X, PackagePlus, Undo2 } from 'lucide-react';
import { pedidoCompraService } from '../services/pedidoCompraService';
import { encomendaService } from '../services/encomendaService';
import type { Utilizador } from '../services/utilizadorService';
import CriarPedidoCompraModal from '../components/CriarPedidoCompraModal';
import DetalhesPedidoCompraModal from '../components/DetalhesPedidoCompraModal';
import RascunhosModal from '../components/RascunhosModal';
import ModalAprovarPedido from '../components/ModalAprovarPedido';

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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pedidos, setPedidos] = useState<PedidoCompra[]>([]);

    const [viewMode, setViewMode] = useState<'LISTA' | 'HISTORICO'>('LISTA');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterTipo, setFilterTipo] = useState('Todos');
    const [filterEstado, setFilterEstado] = useState('Todos');
    const [filterPrioridade, setFilterPrioridade] = useState('Todas');
    type SortField = 'id' | 'criadoEm' | 'criador' | 'prioridade' | 'valorTotalEstimado' | 'estado';
    const [sortField, setSortField] = useState<SortField>('criadoEm');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [isFilterEstadoOpen, setIsFilterEstadoOpen] = useState(false);
    const [isFilterPrioridadeOpen, setIsFilterPrioridadeOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isRascunhosModalOpen, setIsRascunhosModalOpen] = useState(false);
    const [isAprovarModalOpen, setIsAprovarModalOpen] = useState(false);
    const [draftsCount, setDraftsCount] = useState(0);
    const [selectedPedido, setSelectedPedido] = useState<PedidoCompra | null>(null);
    const [editingDraftId, setEditingDraftId] = useState<number | null>(null);
    const [pedidoToEdit, setPedidoToEdit] = useState<PedidoCompra | null>(null);
    const [pedidoToCancel, setPedidoToCancel] = useState<number | null>(null);
    const [pedidoToReverter, setPedidoToReverter] = useState<PedidoCompra | null>(null);
    const [pedidoToEmitir, setPedidoToEmitir] = useState<number | null>(null);
    const [toast, setToast] = useState<Toast | null>(null);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const [user] = useState<Utilizador | null>(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const canViewHistorico = user?.role === 'RESPONSAVEL_STOCK' || user?.role === 'RESPONSAVEL_FINANCEIRO';
    const historicoStatuses = useMemo(() => new Set(['CANCELADO', 'RECUSADO', 'APROVADO', 'PROCESSADO']), []);
    const estadoOptions = useMemo(() => ['PENDENTE', 'APROVADO', 'PROCESSADO', 'RECUSADO', 'CANCELADO', 'ENTREGUE'], []);
    const historicoEstadoOptions = useMemo(() => ['APROVADO', 'PROCESSADO', 'RECUSADO', 'CANCELADO'], []);

    useEffect(() => {
        if (canViewHistorico && viewMode === 'HISTORICO' && (filterEstado || '').toUpperCase() === 'PENDENTE') {
            setFilterEstado('Todos');
        }
    }, [canViewHistorico, viewMode, filterEstado]);

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


    const handleRecusar = async (pedidoId: number) => {
        if (!user || (user.role !== 'RESPONSAVEL_FINANCEIRO' && user.role !== 'ADMINISTRADOR')) return;
        
        try {
            await pedidoCompraService.recusarPedido(pedidoId, {
                userId: user.id,
                role: user.role
            });
            
            setPedidos(pedidos.map(p => 
                p.id === pedidoId ? { ...p, estado: 'RECUSADO' } : p
            ));
            showToast('Pedido recusado.', 'success');
        } catch (err: any) {
            console.error(err);
            showToast(err.response?.data?.error || 'Não foi possível recusar o pedido.', 'error');
        } finally {
            setOpenDropdownId(null);
        }
    };

    const handleUpdateStatusAdmin = async (pedidoId: number, novoEstado: string) => {
        if (!user || user.role !== 'ADMINISTRADOR') return;

        try {
            await pedidoCompraService.updateStatusAdmin(pedidoId, user.role, novoEstado);
            
            setPedidos(pedidos.map(p => 
                p.id === pedidoId ? { ...p, estado: novoEstado } : p
            ));
            showToast('Estado do pedido atualizado com sucesso!', 'success');
        } catch (err: any) {
            console.error(err);
            showToast(err.response?.data?.error || 'Não foi possível atualizar o estado do pedido.', 'error');
        } finally {
            setOpenStatusAdminId(null);
        }
    };

    const handleReverterPedido = (pedidoId: number) => {
        const ped = pedidos.find(p => p.id === pedidoId) || selectedPedido;
        if (ped) setPedidoToReverter(ped);
    };

    const confirmReverter = async () => {
        if (!pedidoToReverter) return;

        try {
            await pedidoCompraService.reverterPedido(pedidoToReverter.id);
            setPedidos(pedidos.map(p => 
                p.id === pedidoToReverter.id ? { ...p, estado: 'PENDENTE' } : p
            ));
            showToast('Pedido revertido para PENDENTE com sucesso.', 'success');
            setIsDetailsModalOpen(false);
            
            setPedidoToReverter(null);
            setTimeout(() => {
                const revertedPedido = { ...pedidoToReverter, estado: 'PENDENTE' };
                setSelectedPedido(revertedPedido);
                setIsAprovarModalOpen(true);
            }, 100);
        } catch (err: any) {
            console.error(err);
            showToast(err.response?.data?.error || 'Erro ao reverter o pedido.', 'error');
            setPedidoToReverter(null);
        }
    };

    const handleEmitirEncomenda = (pedidoId: number) => {
        setPedidoToEmitir(pedidoId);
    };

    const confirmEmitir = async () => {
        if (!pedidoToEmitir) return;
        try {
            await encomendaService.gerarEncomendas(pedidoToEmitir);
            showToast('Encomendas geradas com sucesso!', 'success');
            setIsDetailsModalOpen(false);
            setSelectedPedido(null);
            fetchPedidos();
        } catch (err: any) {
            console.error(err);
            showToast(err.response?.data?.error || 'Erro ao emitir encomenda.', 'error');
        } finally {
            setPedidoToEmitir(null);
        }
    };

    const fetchPedidos = () => {
        setLoading(true);
        setError(null);
        pedidoCompraService.getAll()
            .then((data: PedidoCompra[]) => setPedidos(data.filter(p => p.estado !== 'RASCUNHO')))
            .catch((e) => {
                console.error(e);
                setError('Erro ao carregar pedidos de compra.');
            })
            .finally(() => setLoading(false));
            
        if (user && (user.role === 'ADMINISTRADOR' || user.role === 'RESPONSAVEL_STOCK')) {
            pedidoCompraService.getRascunhos()
                .then((drafts: any[]) => {
                    const myDrafts = drafts.filter(d => d.criadoPorId === user.id);
                    setDraftsCount(myDrafts.length);
                }).catch(console.error);
        }
    };

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        pedidoCompraService.getAll()
            .then((data: PedidoCompra[]) => {
                if (!cancelled) setPedidos(data.filter(p => p.estado !== 'RASCUNHO'));
            })
            .catch((e) => {
                console.error(e);
                if (!cancelled) setError('Erro ao carregar pedidos de compra.');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        if (user && (user.role === 'ADMINISTRADOR' || user.role === 'RESPONSAVEL_STOCK')) {
            pedidoCompraService.getRascunhos()
                .then((drafts: any[]) => {
                    if (!cancelled) {
                        const myDrafts = drafts.filter(d => d.criadoPorId === user.id);
                        setDraftsCount(myDrafts.length);
                    }
                }).catch(console.error);
        }

        return () => {
            cancelled = true;
        };
    }, []);

    // Dropdown state for operations
    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
    const [openStatusAdminId, setOpenStatusAdminId] = useState<number | null>(null);


    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = () => {
            setOpenDropdownId(null);
            setOpenStatusAdminId(null);
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

        if (canViewHistorico) {
            if (viewMode === 'HISTORICO') {
                result = result.filter(p => historicoStatuses.has((p.estado || '').toUpperCase()));
            } else {
                // Para Gestor de Stock/Financeiro, a lista principal mostra apenas pendentes.
                result = result.filter(p => (p.estado || '').toUpperCase() === 'PENDENTE');
            }
        }

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
                return sortOrder === 'asc' ? valA - valB : valB - valA;
            } else if (sortField === 'criadoEm') {
                valA = new Date(a.criadoEm).getTime();
                valB = new Date(b.criadoEm).getTime();
                return sortOrder === 'asc' ? valA - valB : valB - valA;
            } else if (sortField === 'id') {
                const strA = a.codigoFormatado || '';
                const strB = b.codigoFormatado || '';
                return sortOrder === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
            } else if (sortField === 'criador') {
                const strA = a.criadoPor?.username || '';
                const strB = b.criadoPor?.username || '';
                return sortOrder === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
            } else if (sortField === 'prioridade') {
                const prioMap = { 'URGENTE': 3, 'ALTA': 2, 'NORMAL': 1, 'BAIXA': 0 };
                const numA = a.estado === 'CANCELADO' ? -1 : prioMap[a.prioridade as keyof typeof prioMap] || 0;
                const numB = b.estado === 'CANCELADO' ? -1 : prioMap[b.prioridade as keyof typeof prioMap] || 0;
                return sortOrder === 'asc' ? numA - numB : numB - numA;
            } else if (sortField === 'estado') {
                const strA = a.estado || '';
                const strB = b.estado || '';
                return sortOrder === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
            }
            return 0;
        });

        return result;
    }, [pedidos, canViewHistorico, viewMode, historicoStatuses, searchQuery, filterEstado, filterTipo, filterPrioridade, sortField, sortOrder]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
    };

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ArrowUpDown size={14} className="text-slate-300 group-hover:text-slate-400" />;
        return sortOrder === 'asc' ? <ArrowUp size={14} className="text-emerald-600" /> : <ArrowDown size={14} className="text-emerald-600" />;
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
            case 'PROCESSADO':
                return 'text-white bg-emerald-500 border-emerald-600 shadow-sm ring-1 ring-emerald-500/50';
            case 'CANCELADO':
            case 'RECUSADO':
                return 'text-red-700 bg-red-50 border-red-100';

            case 'ENTREGUE':
                return 'text-blue-700 bg-blue-50 border-blue-100';

            default:
                return 'text-slate-700 bg-slate-50 border-slate-200';
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] animate-in fade-in duration-300 relative">
            <CriarPedidoCompraModal 
                isOpen={isCreateModalOpen} 
                draftId={editingDraftId}
                pedidoToEdit={pedidoToEdit}
                onClose={(shouldRefresh, msg) => {
                    setIsCreateModalOpen(false);
                    setEditingDraftId(null);
                    setPedidoToEdit(null);
                    if (shouldRefresh) {
                        fetchPedidos();
                        showToast(msg || 'Pedido processado com sucesso!', 'success');
                    }
                }} 
            />

            <RascunhosModal
                isOpen={isRascunhosModalOpen}
                user={user}
                onClose={(shouldRefresh) => {
                    setIsRascunhosModalOpen(false);
                    if (shouldRefresh) {
                        fetchPedidos();
                    }
                }}
                onEditDraft={(id) => {
                    setEditingDraftId(id);
                    setIsRascunhosModalOpen(false);
                    setIsCreateModalOpen(true);
                }}
            />

            <DetalhesPedidoCompraModal
                isOpen={isDetailsModalOpen}
                pedido={selectedPedido}
                userRole={user?.role}
                onAprovar={() => {
                    setIsDetailsModalOpen(false);
                    setIsAprovarModalOpen(true);
                }}
                onRecusar={(id) => {
                    handleRecusar(id);
                    setIsDetailsModalOpen(false);
                }}
                onEmitirEncomenda={handleEmitirEncomenda}
                onReverter={handleReverterPedido}
                onClose={() => {
                    setIsDetailsModalOpen(false);
                    setSelectedPedido(null);
                }}
            />

            <ModalAprovarPedido
                isOpen={isAprovarModalOpen}
                pedido={selectedPedido}
                onClose={(shouldRefresh, msg) => {
                    setIsAprovarModalOpen(false);
                    if (shouldRefresh) {
                        fetchPedidos();
                        showToast(msg || 'Pedido aprovado com sucesso!', 'success');
                    } else {
                        setSelectedPedido(null);
                    }
                }}
            />

            {/* Toast Notification */}
            {toast && (
                <div className="fixed bottom-6 right-6 z-[60] animate-in slide-in-from-right-full duration-300">
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

            {/* Reverter Modal */}
            {pedidoToReverter !== null && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mb-4">
                                <Undo2 size={24} className="text-amber-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Reverter para Pendente</h3>
                            <p className="text-sm text-slate-500">
                                Tem a certeza que pretende reverter este pedido para PENDENTE? Isto libertará todos os fornecedores alocados.
                            </p>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                            <button
                                onClick={() => setPedidoToReverter(null)}
                                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors"
                            >
                                Voltar
                            </button>
                            <button
                                onClick={() => confirmReverter()}
                                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm focus:ring-2 focus:ring-amber-500 focus:ring-offset-1"
                            >
                                Reverter Pedido
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Emitir Modal */}
            {pedidoToEmitir !== null && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                                <PackagePlus size={24} className="text-emerald-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Emitir Encomendas</h3>
                            <p className="text-sm text-slate-500">
                                Tem a certeza que pretende emitir a(s) encomenda(s) para os fornecedores selecionados?
                            </p>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                            <button
                                onClick={() => setPedidoToEmitir(null)}
                                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors"
                            >
                                Mudar de ideias
                            </button>
                            <button
                                onClick={() => confirmEmitir()}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1"
                            >
                                Sim, Emitir
                            </button>
                        </div>
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

            {/* ── Bloco sticky integrado (Command Center) ── */}
            <div className="shrink-0 bg-slate-50/90 backdrop-blur-xl border-b border-slate-200/50 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 pt-4 pb-4 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)] transition-all flex flex-col gap-4 mb-4 z-40">
                
                {/* Linha 1: Título e Botões */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pedidos de Compra</h1>
                        <p className="mt-0.5 text-xs text-slate-500 hidden sm:block">Visualização dos pedidos criados.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {user?.role !== 'RESPONSAVEL_FINANCEIRO' && (
                            <button
                                onClick={() => setIsRascunhosModalOpen(true)}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-blue-600 text-sm font-black rounded-lg hover:bg-blue-50 transition-all border-2 border-blue-100 hover:border-blue-200 shadow-sm active:scale-95"
                            >
                                <span>Rascunhos</span>
                                {draftsCount >= 0 && (
                                    <span className="bg-blue-50 border border-blue-200 text-blue-700 text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-black">
                                        {draftsCount}
                                    </span>
                                )}
                            </button>
                        )}
                        {user?.role !== 'RESPONSAVEL_FINANCEIRO' && (
                            <button
                                onClick={() => {
                                    setEditingDraftId(null);
                                    setPedidoToEdit(null);
                                    setIsCreateModalOpen(true);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-black rounded-lg hover:bg-emerald-700 transition-all shadow-md shadow-emerald-500/20 active:scale-95"
                            >
                                <Plus size={18} /> Novo pedido
                            </button>
                        )}
                    </div>
                </div>

                {/* Linha 2: Dashboard Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button 
                        onClick={() => { setFilterTipo('Todos'); setFilterEstado('Todos'); setFilterPrioridade('Todas'); setSearchQuery(''); }}
                        className={`p-2 rounded-xl border shadow-sm flex items-center justify-between text-left transition-all ${filterTipo === 'Todos' && filterEstado === 'Todos' && filterPrioridade === 'Todas' && !searchQuery ? 'bg-blue-50/70 border-blue-200 ring-2 ring-blue-500/20' : 'bg-white border-slate-200 hover:border-blue-100 hover:shadow-md'}`}
                    >
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total</p>
                            <h3 className="text-xl font-black text-slate-800 leading-none">{pedidos.length}</h3>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <ClipboardList size={16} />
                        </div>
                    </button>
                    
                    <button 
                        onClick={() => { setFilterPrioridade('URGENTE'); setSearchQuery(''); }}
                        className={`p-2 rounded-xl border shadow-sm flex items-center justify-between text-left transition-all ${filterPrioridade === 'URGENTE' ? 'bg-red-50/70 border-red-200 ring-2 ring-red-500/20' : 'bg-white border-slate-200 hover:border-red-100 hover:shadow-md'}`}
                    >
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Urgentes</p>
                            <h3 className="text-xl font-black text-slate-800 leading-none">{pedidos.filter(p => p.prioridade === 'URGENTE' && p.estado !== 'CANCELADO').length}</h3>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                            <AlertTriangle size={16} />
                        </div>
                    </button>

                    <button 
                        onClick={() => { setFilterPrioridade('ALTA'); setSearchQuery(''); }}
                        className={`p-2 rounded-xl border shadow-sm flex items-center justify-between text-left transition-all ${filterPrioridade === 'ALTA' ? 'bg-amber-50/70 border-amber-200 ring-2 ring-amber-500/20' : 'bg-white border-slate-200 hover:border-amber-100 hover:shadow-md'}`}
                    >
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Alta Prioridade</p>
                            <h3 className="text-xl font-black text-slate-800 leading-none">{pedidos.filter(p => p.prioridade === 'ALTA' && p.estado !== 'CANCELADO').length}</h3>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                            <Clock size={16} />
                        </div>
                    </button>
                </div>

                {/* Linha 3: 2 Blocks Separados (Pesquisa + Filtros) */}
                <div className="flex flex-col xl:flex-row gap-3 items-stretch xl:items-center">
                    
                    {/* Search Bar Container */}
                    {pedidos.length > 0 && (
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm relative z-10 flex-grow">
                            <div className="relative w-full max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Pesquisar por ID, data ou criador..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-1.5 bg-transparent border-0 outline-none text-xs placeholder:text-slate-400"
                                />
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium px-3 whitespace-nowrap hidden sm:block">
                                A mostrar <span className="font-bold text-slate-700">{filteredPedidos.length}</span> / <span className="font-bold text-slate-700">{pedidos.length}</span> pedidos
                            </div>
                        </div>
                    )}

                {/* Filtros Container */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex-grow xl:flex-grow-0 relative z-20">
                    <div className="flex items-center gap-2 text-slate-500 font-medium text-sm mr-2 hidden sm:flex">
                        <Filter size={16} />
                        Filtros
                    </div>

                    {/* Vista: Lista / Histórico */}
                    {canViewHistorico && (
                        <div className="flex p-1 bg-slate-100/50 rounded-lg border border-slate-200/60 w-full sm:w-auto">
                            <button
                                onClick={() => {
                                    setViewMode('LISTA');
                                    setFilterEstado('Todos');
                                }}
                                className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'LISTA' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-600 hover:text-slate-900'} `}
                            >
                                Lista
                            </button>
                            <button
                                onClick={() => {
                                    setViewMode('HISTORICO');
                                    setFilterEstado('Todos');
                                }}
                                className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'HISTORICO' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-600 hover:text-slate-900'} `}
                            >
                                Histórico
                            </button>
                        </div>
                    )}

                    {canViewHistorico && <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>}

                    {/* Tipo de Pedido Segmented Tabs */}
                    <div className="flex p-1 bg-slate-100/50 rounded-lg border border-slate-200/60 w-full sm:w-auto overflow-x-auto custom-scrollbar">
                        <button
                            onClick={() => setFilterTipo('Todos')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap ${filterTipo === 'Todos' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-600 hover:text-slate-900'} `}
                        >
                            Todos
                        </button>
                        <button
                            onClick={() => setFilterTipo('MANUAL')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap ${filterTipo === 'MANUAL' ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-600 hover:text-slate-900'} `}
                        >
                            Manuais
                        </button>
                        <button
                            onClick={() => setFilterTipo('AUTOMATICO')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap ${filterTipo === 'AUTOMATICO' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-600 hover:text-slate-900'} `}
                        >
                            Automáticos
                        </button>
                    </div>

                    <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>

                    <div className="flex w-full sm:w-auto gap-2">
                        {/* Dropdown Estado */}
                        {(!canViewHistorico || viewMode === 'HISTORICO') && (
                            <div className="relative flex-1 sm:min-w-[150px]">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setIsFilterPrioridadeOpen(false); setIsFilterEstadoOpen(!isFilterEstadoOpen); }}
                                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 bg-white border rounded-lg text-sm font-medium transition-all ${filterEstado !== 'Todos' ? 'border-blue-500 text-blue-700 ring-4 ring-blue-500/10' : 'border-slate-200 text-slate-700 hover:border-slate-300'}`}
                                >
                                    <span className="truncate">{filterEstado === 'Todos' ? 'Estado' : filterEstado}</span>
                                    <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform ${isFilterEstadoOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isFilterEstadoOpen && (
                                    <div 
                                        onMouseDown={(e) => e.stopPropagation()} 
                                        className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95"
                                    >
                                        <button
                                            onClick={() => { setFilterEstado('Todos'); setIsFilterEstadoOpen(false); }}
                                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${filterEstado === 'Todos' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
                                        >
                                            Todos os estados
                                        </button>
                                        {(canViewHistorico && viewMode === 'HISTORICO' ? historicoEstadoOptions : estadoOptions).map(est => (
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
                        )}

                        {/* Dropdown Prioridade */}
                        <div className="relative flex-1 sm:min-w-[150px]">
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsFilterEstadoOpen(false); setIsFilterPrioridadeOpen(!isFilterPrioridadeOpen); }}
                                className={`w-full flex items-center justify-between gap-2 px-3 py-2 bg-white border rounded-lg text-sm font-medium transition-all ${filterPrioridade !== 'Todas' ? 'border-blue-500 text-blue-700 ring-4 ring-blue-500/10' : 'border-slate-200 text-slate-700 hover:border-slate-300'}`}
                            >
                                <span className="truncate">{filterPrioridade === 'Todas' ? 'Prioridade' : filterPrioridade}</span>
                                <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform ${isFilterPrioridadeOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isFilterPrioridadeOpen && (
                                <div 
                                    onMouseDown={(e) => e.stopPropagation()}
                                    className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95"
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
                    </div>

                    {/* Clear Filters */}
                    {(filterTipo !== 'Todos' || filterEstado !== 'Todos' || filterPrioridade !== 'Todas' || searchQuery !== '') && (
                        <button
                            onClick={() => { setFilterTipo('Todos'); setFilterEstado('Todos'); setFilterPrioridade('Todas'); setSearchQuery(''); }}
                            className="p-1.5 ml-auto text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center shrink-0"
                            title="Limpar filtros"
                        >
                            <X size={18} strokeWidth={2.5} />
                        </button>
                    )}
                </div>
            </div>
            </div>

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
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col flex-1 min-h-0 relative z-0">
                    <div className="w-full h-full overflow-auto custom-scrollbar">
                        <table className="w-full text-left relative">
                            <thead className="sticky top-0 z-30 bg-slate-50/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
                                <tr>
                                    <th 
                                        className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest text-left cursor-pointer hover:bg-slate-100 transition-colors group select-none"
                                        onClick={() => handleSort('id')}
                                    >
                                        <div className="flex items-center gap-2">ID <SortIcon field="id" /></div>
                                    </th>
                                    <th 
                                        className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest text-left cursor-pointer hover:bg-slate-100 transition-colors group select-none"
                                        onClick={() => handleSort('criadoEm')}
                                    >
                                        <div className="flex items-center gap-2">Data <SortIcon field="criadoEm" /></div>
                                    </th>
                                    <th 
                                        className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest text-left cursor-pointer hover:bg-slate-100 transition-colors group select-none"
                                        onClick={() => handleSort('criador')}
                                    >
                                        <div className="flex items-center gap-2">Emitido por <SortIcon field="criador" /></div>
                                    </th>
                                    <th 
                                        className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest text-left cursor-pointer hover:bg-slate-100 transition-colors group select-none"
                                        onClick={() => handleSort('prioridade')}
                                    >
                                        <div className="flex items-center gap-2">Prioridade <SortIcon field="prioridade" /></div>
                                    </th>
                                    <th 
                                        className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest text-right cursor-pointer hover:bg-slate-100 transition-colors group select-none"
                                        onClick={() => handleSort('valorTotalEstimado')}
                                    >
                                        <div className="flex items-center justify-end gap-2"><SortIcon field="valorTotalEstimado" /> Total</div>
                                    </th>
                                    <th 
                                        className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest text-left cursor-pointer hover:bg-slate-100 transition-colors group select-none"
                                        onClick={() => handleSort('estado')}
                                    >
                                        <div className="flex items-center gap-2">Estado <SortIcon field="estado" /></div>
                                    </th>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="">
                                {filteredPedidos.map((p) => (
                                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-b-0">
                                        <td className="px-6 py-3 font-bold text-slate-900">
                                            <div>{p.codigoFormatado}</div>
                                            <div className="text-[10px] text-slate-400 font-medium bg-slate-100 inline-block px-1.5 rounded mt-0.5">{p.tipo}</div>
                                        </td>
                                        <td className="px-6 py-3 text-slate-600 font-medium">{formatDate(p.criadoEm)}</td>
                                        <td className="px-6 py-3 text-slate-600 font-medium">
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
                                                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-black border ${getPriorityStyle(p.prioridade)}`}>
                                                    {p.prioridade}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-900">{formatCurrency(p.valorTotalEstimado || 0)}</td>
                                        <td className="px-6 py-4 relative">
                                            {user?.role === 'ADMINISTRADOR' ? (
                                                <div className="relative inline-block">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenStatusAdminId(openStatusAdminId === p.id ? null : p.id);
                                                            setOpenDropdownId(null);
                                                        }}
                                                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-black border transition-all hover:scale-105 active:scale-95 shadow-sm hover:shadow-md ${getStatusStyle(p.estado || '')}`}
                                                    >
                                                        <span className="w-1.5 h-1.5 rounded-full mr-1.5 currentColor bg-current opacity-70"></span>
                                                        {p.estado || 'PENDENTE'}
                                                        <ChevronDown size={12} className="ml-1.5 opacity-50" />
                                                    </button>

                                                    {openStatusAdminId === p.id && (
                                                        <div
                                                            onMouseDown={(e) => e.stopPropagation()}
                                                            className="absolute left-0 mt-2 w-40 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-[60] animate-in fade-in zoom-in-95 duration-200"
                                                        >
                                                            {['PENDENTE', 'APROVADO', 'PROCESSADO', 'RECUSADO', 'CANCELADO', 'ENTREGUE'].map((status) => (
                                                                <button
                                                                    key={status}
                                                                    onClick={() => handleUpdateStatusAdmin(p.id, status)}
                                                                    className={`w-full text-left px-4 py-2 text-[10px] font-black tracking-wider transition-colors flex items-center gap-2 ${p.estado === status ? 'bg-slate-50 text-slate-400 cursor-default' : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'}`}
                                                                    disabled={p.estado === status}
                                                                >
                                                                    <span className={`w-2 h-2 rounded-full ${getStatusStyle(status).split(' ')[0].replace('text-', 'bg-')}`}></span>
                                                                    {status}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-black border ${getStatusStyle(p.estado || '')}`}>
                                                    <span className="w-1.5 h-1.5 rounded-full mr-1.5 currentColor bg-current opacity-70"></span>
                                                    {p.estado || 'PENDENTE'}
                                                </span>
                                            )}
                                        </td>

                                        <td className="px-6 py-4 relative">
                                            <div className="flex items-center justify-end gap-2 pr-2">
                                                {user && (user.role === 'RESPONSAVEL_FINANCEIRO' || user.role === 'ADMINISTRADOR') && p.estado === 'PENDENTE' && (
                                                    <div className="flex items-center gap-1.5 mr-2">
                                                        <button
                                                            onClick={(e) => { 
                                                                e.stopPropagation(); 
                                                                setSelectedPedido(p);
                                                                setIsAprovarModalOpen(true); 
                                                            }}
                                                            className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 hover:border-emerald-200 rounded-lg transition-all"
                                                            title="Aprovar Pedido"
                                                        >
                                                            <CheckCircle2 size={16} strokeWidth={2.5}/>
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleRecusar(p.id); }}
                                                            className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 hover:border-red-200 rounded-lg transition-all"
                                                            title="Recusar Pedido"
                                                        >
                                                            <X size={16} strokeWidth={2.5}/>
                                                        </button>
                                                    </div>
                                                )}

                                                {user && (user.role === 'RESPONSAVEL_FINANCEIRO' || user.role === 'ADMINISTRADOR') && p.estado === 'APROVADO' && (
                                                    <div className="flex items-center gap-1.5 mr-2">
                                                        <button
                                                            onClick={(e) => { 
                                                                e.stopPropagation(); 
                                                                handleEmitirEncomenda(p.id);
                                                            }}
                                                            className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 hover:border-emerald-200 rounded-lg transition-all"
                                                            title="Emitir Encomenda"
                                                        >
                                                            <PackagePlus size={16} strokeWidth={2.5}/>
                                                        </button>
                                                    </div>
                                                )}

                                                <button
                                                    onMouseDown={(e) => handleActionMouseDown(p.id, e)}
                                                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors group-hover:block"
                                                >
                                                    <MoreVertical size={18} />
                                                </button>
                                            </div>

                                            {/* Dropdown Menu */}
                                            {openDropdownId === p.id && (
                                                <div
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                    className="absolute right-8 top-[75%] w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-100"
                                                >
                                                    <button
                                                        onClick={() => {
                                                            setSelectedPedido(p);
                                                            setIsDetailsModalOpen(true);
                                                            setOpenDropdownId(null);
                                                        }}
                                                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                                                    >
                                                        Ver Detalhes
                                                    </button>
                                                    {user && (user.role === 'ADMINISTRADOR' || user.role === 'RESPONSAVEL_STOCK') && p.estado === 'PENDENTE' && (
                                                        <button
                                                            onClick={() => {
                                                                setPedidoToEdit(p);
                                                                setIsCreateModalOpen(true);
                                                                setOpenDropdownId(null);
                                                            }}
                                                            className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                                                        >
                                                            Editar
                                                        </button>
                                                    )}

                                                    {user && (user.role === 'ADMINISTRADOR' || user.role === 'RESPONSAVEL_STOCK') && (
                                                        p.estado !== 'CANCELADO' ? (
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
                                                        )
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

