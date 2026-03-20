import { useEffect, useMemo, useState } from 'react';
import { Plus, Loader2, MoreVertical, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { pedidoCompraService } from '../services/pedidoCompraService';
import type { Utilizador } from '../services/utilizadorService';
import EditarPedidoCompraModal from '../components/EditarPedidoCompraModal';

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
    const [toast, setToast] = useState<Toast | null>(null);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    
    // Actions Dropdown & Details state
    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
    const [detalhesPedido, setDetalhesPedido] = useState<PedidoCompra | null>(null);

    // States for EditarPedidoCompraModal
    const [isEditarModalOpen, setIsEditarModalOpen] = useState(false);
    const [pedidoParaEditar, setPedidoParaEditar] = useState<PedidoCompra | null>(null);

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

    const carregarPedidos = () => {
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
    };

    useEffect(() => {
        const cleanup = carregarPedidos();
        return cleanup;
    }, []);



    const pendingPedidos = useMemo(() => {
        // requisito: todos os pedidos criados são com estado pendente,
        // mas deixamos filtro para robustez visual.
        return pedidos.filter((p) => (p.estado || '').toUpperCase() === 'PENDENTE');
    }, [pedidos]);

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

            {loading ? (
                <div className="flex justify-center items-center h-64 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <Loader2 className="animate-spin text-emerald-600" />
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-xl">{error}</div>
            ) : pendingPedidos.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm text-center">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Nenhum pedido por enquanto</h3>
                    <p className="text-sm text-slate-500 mb-6">Crie um novo pedido para começar.</p>
                    <button
                        onClick={() => navigate('/pedidos/novo')}
                        className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm mx-auto"
                    >
                        <Plus size={18} strokeWidth={2.5} /> Adicionar Pedido
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-widest font-bold border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4">ID</th>
                                    <th className="px-6 py-4">Data</th>
                                    <th className="px-6 py-4">Emitido por</th>
                                    <th className="px-6 py-4">Prioridade</th>
                                    <th className="px-6 py-4 text-right">Total</th>
                                    <th className="px-6 py-4">Estado</th>
                                    <th className="px-6 py-4 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {pendingPedidos.map((p) => (
                                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
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
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-100">
                                                PENDENTE
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
                                                    <button
                                                        onClick={() => {
                                                            setDetalhesPedido(p);
                                                            setOpenDropdownId(null);
                                                        }}
                                                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                                                    >
                                                        Ver Detalhes
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setPedidoParaEditar(p);
                                                            setIsEditarModalOpen(true);
                                                            setOpenDropdownId(null);
                                                        }}
                                                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                                                    >
                                                        Editar Pedido
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                await pedidoCompraService.cancelar(p.id);
                                                                showToast('Pedido cancelado com sucesso.', 'success');
                                                                carregarPedidos();
                                                            } catch (error) {
                                                                console.error(error);
                                                                showToast('Erro ao cancelar o pedido.', 'error');
                                                            }
                                                            setOpenDropdownId(null);
                                                        }}
                                                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                                                    >
                                                        Cancelar Pedido
                                                    </button>
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

            {/* Detalhes do Pedido Modal */}
            {detalhesPedido && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDetalhesPedido(null)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="bg-slate-900 p-6 flex justify-between items-start">
                            <div className="pr-4">
                                <h2 className="text-xl font-bold text-white leading-tight">{detalhesPedido.codigoFormatado}</h2>
                                <p className="text-slate-400 text-sm mt-1">{formatDate(detalhesPedido.criadoEm)}</p>
                            </div>
                            <button onClick={() => setDetalhesPedido(null)} className="p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors rounded-lg flex-shrink-0">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Criado Por</span>
                                    <span className="text-slate-800 font-semibold">{detalhesPedido.criadoPor?.username || '—'}</span>
                                </div>
                                <div className="flex flex-col bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Valor Total</span>
                                    <span className="text-slate-800 font-semibold">{formatCurrency(detalhesPedido.valorTotalEstimado || 0)}</span>
                                </div>
                            </div>
                            <div className="flex flex-col border-b border-slate-100 pb-3">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Estado</span>
                                <div>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-100">
                                        PENDENTE
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-col border-b border-slate-100 pb-3">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Prioridade</span>
                                <div>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-700 border border-slate-200">
                                        {detalhesPedido.prioridade}
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-col border-b border-slate-100 pb-3">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Linhas do Pedido</span>
                                {detalhesPedido.linhas && detalhesPedido.linhas.length > 0 ? (
                                    <div className="max-h-40 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                                        {detalhesPedido.linhas.map((linha, index) => (
                                            <div key={index} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                                                <div>
                                                    <div className="text-sm font-bold text-slate-800 leading-tight">
                                                        {linha.produto?.nome || `Produto #${linha.produtoId}`}
                                                    </div>
                                                    <div className="text-xs font-medium text-slate-500 mt-0.5">
                                                        Quantidade: {linha.quantidade}
                                                    </div>
                                                </div>
                                                <div className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                                                    {formatCurrency(linha.valorTotal || (linha.precoUnitario * linha.quantidade) || 0)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-sm text-slate-500 italic p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
                                        Este pedido não tem linhas associadas.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <EditarPedidoCompraModal
                isOpen={isEditarModalOpen}
                pedido={pedidoParaEditar as any}
                onClose={() => setIsEditarModalOpen(false)}
                onSuccess={() => {
                    setIsEditarModalOpen(false);
                    carregarPedidos();
                }}
            />
        </div>
    );
}

