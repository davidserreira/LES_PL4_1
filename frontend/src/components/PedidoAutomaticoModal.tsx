import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, Package, AlertTriangle, Check, Search, ShoppingCart } from 'lucide-react';
import { produtoService } from '../services/produtoService';
import { pedidoCompraService } from '../services/pedidoCompraService';
import type { Utilizador } from '../services/utilizadorService';

interface Produto {
    id: number;
    nome: string;
    preco: number;
    stock: number;
    stockMinimo: number;
    categoria?: string;
}

interface ItemPedido {
    produto: Produto;
    quantidade: number;
    selecionado: boolean;
    jaEncomendado: boolean;
}

interface PedidoAutomaticoModalProps {
    isOpen: boolean;
    onClose: (shouldRefresh?: boolean, msg?: string) => void;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
};

export default function PedidoAutomaticoModal({ isOpen, onClose }: PedidoAutomaticoModalProps) {
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [items, setItems] = useState<ItemPedido[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'todos' | 'critico' | 'selecionados'>('todos');

    const userInfo = localStorage.getItem('user');
    const user: Utilizador | null = userInfo ? JSON.parse(userInfo) : null;

    useEffect(() => {
        if (!isOpen) return;

        const loadProducts = async () => {
            try {
                setLoading(true);
                const [products, pedidos] = await Promise.all([
                    produtoService.getAll(),
                    pedidoCompraService.getAll()
                ]);

                // Encontrar produtos que já estão em pedidos PENDENTES
                const produtosEmPedidosPendentes = new Set<number>();
                pedidos.forEach((p: any) => {
                    if (p.estado === 'PENDENTE') {
                        p.linhas?.forEach((l: any) => {
                            produtosEmPedidosPendentes.add(l.produtoId);
                        });
                    }
                });

                const initializedItems = products.map((p: Produto) => {
                    const isCritico = p.stock <= p.stockMinimo;
                    const jaEncomendado = produtosEmPedidosPendentes.has(p.id);

                    return {
                        produto: p,
                        // Sugestão: o que falta para chegar ao mínimo + 1
                        quantidade: isCritico ? Math.max(1, (p.stockMinimo + 1) - p.stock) : 1,
                        selecionado: isCritico && !jaEncomendado,
                        jaEncomendado
                    };
                });
                setItems(initializedItems);
            } catch (error) {
                console.error('Erro ao carregar produtos e pedidos:', error);
            } finally {
                setLoading(false);
            }
        };

        loadProducts();
    }, [isOpen]);

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesSearch = item.produto.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.produto.categoria?.toLowerCase() || '').includes(searchQuery.toLowerCase());

            if (filterStatus === 'critico') {
                return matchesSearch && item.produto.stock <= item.produto.stockMinimo;
            }
            if (filterStatus === 'selecionados') {
                return matchesSearch && item.selecionado;
            }
            return matchesSearch;
        });
    }, [items, searchQuery, filterStatus]);

    const toggleSelecao = (id: number) => {
        setItems(prev => prev.map(item =>
            (item.produto.id === id && !item.jaEncomendado) ? { ...item, selecionado: !item.selecionado } : item
        ));
    };

    const handleQuantidadeChange = (id: number, val: number) => {
        const novaQtd = Math.max(1, val);
        setItems(prev => prev.map(item =>
            item.produto.id === id ? { ...item, quantidade: novaQtd } : item
        ));
    };

    const handleSubmit = async () => {
        const selectedItems = items.filter(i => i.selecionado);
        if (selectedItems.length === 0) return;

        setIsSubmitting(true);
        try {
            await pedidoCompraService.create({
                criadoPorId: user?.id ?? null,
                prioridade: 'NORMAL',
                estado: 'PENDENTE',
                tipo: 'AUTOMATICO',
                linhas: selectedItems.map(i => ({
                    produtoId: i.produto.id,
                    quantidade: i.quantidade
                }))
            });
            onClose(true, 'Pedido automático criado com sucesso!');
        } catch (error) {
            console.error('Erro ao criar pedido automático:', error);
            alert('Erro ao processar o pedido.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const totalItens = items.filter(i => i.selecionado).length;
    const valorTotalEstimado = items
        .filter(i => i.selecionado)
        .reduce((acc, curr) => acc + (curr.quantidade * curr.produto.preco), 0);

    const modalContent = (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                    onClose(false);
                }
            }}
        >
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/80">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-sm border border-blue-100 dark:border-blue-500/20">
                            <ShoppingCart size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight">Pedido Automático</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Sugestão baseada em stock crítico e reposição saudável</p>
                        </div>
                    </div>
                    <button
                        onClick={() => onClose(false)}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Filters */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex p-0.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                            <button
                                onClick={() => setFilterStatus('todos')}
                                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${filterStatus === 'todos' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100'}`}
                            >
                                Todos
                            </button>
                            <button
                                onClick={() => setFilterStatus('critico')}
                                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${filterStatus === 'critico' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100'}`}
                            >
                                Críticos
                            </button>
                            <button
                                onClick={() => setFilterStatus('selecionados')}
                                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${filterStatus === 'selecionados' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100'}`}
                            >
                                Selecionados ({totalItens})
                            </button>
                        </div>
                    </div>

                    <div className="relative w-full max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Procurar produto..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm transition-all"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-900">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                            <p className="text-sm font-medium">A analisar inventário...</p>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                            <table className="w-full text-left text-sm border-collapse">
                                <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest border-b border-slate-200 dark:border-slate-700">
                                    <tr>
                                        <th className="px-6 py-4 w-12 text-center">Sel.</th>
                                        <th className="px-6 py-4">Produto</th>
                                        <th className="px-6 py-4 text-center">Stock Atual</th>
                                        <th className="px-6 py-4 text-center">Stock Mín.</th>
                                        <th className="px-6 py-4 text-center w-32">Qtd. Pedido</th>
                                        <th className="px-6 py-4 text-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredItems.map((item) => {
                                        const isCritico = item.produto.stock <= item.produto.stockMinimo;
                                        return (
                                            <tr
                                                key={item.produto.id}
                                                className={`transition-colors border-l-4 ${item.jaEncomendado ? 'bg-slate-50 dark:bg-slate-900 opacity-60 cursor-not-allowed border-l-slate-200' : item.selecionado ? 'bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-50 dark:bg-blue-500/10 border-l-blue-500' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900 border-l-transparent cursor-pointer'}`}
                                                onClick={() => !item.jaEncomendado && toggleSelecao(item.produto.id)}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center">
                                                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${item.jaEncomendado ? 'bg-slate-100 dark:bg-slate-700/50 border-slate-200 dark:border-slate-700' : item.selecionado ? 'bg-blue-600 border-blue-600' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'}`}>
                                                            {item.jaEncomendado ? (
                                                                <X size={12} className="text-slate-400" strokeWidth={3} />
                                                            ) : item.selecionado && (
                                                                <Check size={14} className="text-white" strokeWidth={4} />
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${item.jaEncomendado ? 'bg-slate-100 dark:bg-slate-700/50 text-slate-400' : isCritico ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400'}`}>
                                                            {item.jaEncomendado ? <ShoppingCart size={16} /> : isCritico ? <AlertTriangle size={16} /> : <Package size={16} />}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className={`font-bold ${item.jaEncomendado ? 'text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>{item.produto.nome}</p>
                                                                {item.jaEncomendado && (
                                                                    <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-[8px] font-black uppercase tracking-tighter border border-slate-200 dark:border-slate-700">
                                                                        Encomenda em curso
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.produto.categoria}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`font-mono font-bold ${isCritico ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'}`}>
                                                        {item.produto.stock}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center font-mono text-slate-400">
                                                    {item.produto.stockMinimo}
                                                </td>
                                                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex items-center justify-center">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            disabled={item.jaEncomendado}
                                                            value={item.quantidade}
                                                            onChange={(e) => handleQuantidadeChange(item.produto.id, parseInt(e.target.value) || 1)}
                                                            className={`w-20 px-2 py-1.5 text-xs font-bold text-center rounded-lg border transition-all outline-none focus:ring-2 focus:ring-blue-500/20 ${item.jaEncomendado ? 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-700/50 text-slate-300 pointer-events-none' : item.selecionado ? 'border-blue-300 bg-white dark:bg-slate-800 shadow-sm' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50'}`}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-slate-100">
                                                    {formatCurrency(item.quantidade * item.produto.preco)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredItems.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                                                Nenhum produto encontrado com estes filtros.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Total do Pedido ({totalItens} itens)</span>
                        <span className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{formatCurrency(valorTotalEstimado)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => onClose(false)}
                            className="px-6 py-2.5 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || totalItens === 0}
                            className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-black rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95"
                        >
                            {isSubmitting ? (
                                <>A processar...</>
                            ) : (
                                <>Confirmar Pedido <CheckCircle2 size={18} strokeWidth={3} /></>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
