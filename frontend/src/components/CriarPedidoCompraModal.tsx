import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Trash2, CheckCircle2, ArrowRight, ArrowLeft, Package, ChevronDown, Check, Filter, AlertTriangle } from 'lucide-react';
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

interface LinhaPedido {
    produto: Produto;
    quantidade: number;
}

interface CriarPedidoModalProps {
    isOpen: boolean;
    onClose: (shouldRefresh?: boolean, msg?: string) => void;
    draftId?: number | null;
    pedidoToEdit?: any | null;
    initialProdutos?: Produto[];
    initialLinhas?: { produtoId: number; quantidade: number }[];
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
};

// O utilizador só pode seleccionar NORMAL ou URGENTE.
// ALTA é reservada ao sistema (pedidos revertidos automaticamente).
const PRIORIDADES = [
    { value: 'NORMAL', label: 'Normal', dot: 'bg-blue-500' },
    { value: 'URGENTE', label: 'Urgente', dot: 'bg-red-500' }
];
// Inclui ALTA apenas para efeitos de display (quando o pedido já tem prioridade ALTA)
const TODAS_PRIORIDADES = [
    { value: 'NORMAL', label: 'Normal', dot: 'bg-blue-500' },
    { value: 'ALTA', label: 'Alta', dot: 'bg-amber-400' },
    { value: 'URGENTE', label: 'Urgente', dot: 'bg-red-500' }
];

const CATEGORIES = ['Medicamentos', 'Vacinas', 'Higiene', 'Equipamento', 'Outros'];

export default function CriarPedidoCompraModal({ isOpen, onClose, draftId, pedidoToEdit, initialProdutos, initialLinhas }: CriarPedidoModalProps) {
    const [step, setStep] = useState<1 | 2>(1);
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [linhas, setLinhas] = useState<LinhaPedido[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [prioridade, setPrioridade] = useState('NORMAL');
    const [isPrioridadeOpen, setIsPrioridadeOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentDraftId, setCurrentDraftId] = useState<number | null>(null);
    const [observacoes, setObservacoes] = useState('');
    const [originalDraft, setOriginalDraft] = useState<any>(null);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

    // Filtros catalog-style
    const [filterCategory, setFilterCategory] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<'todos' | 'estavel' | 'critico'>('todos');
    const [isFilterCategoryOpen, setIsFilterCategoryOpen] = useState(false);

    const [nextPedidoId, setNextPedidoId] = useState<number>(1);
    const prioridadeRef = useRef<HTMLDivElement>(null);

    const userInfo = localStorage.getItem('user');
    const user: Utilizador | null = userInfo ? JSON.parse(userInfo) : null;
    const hoje = new Date().toLocaleDateString('pt-PT');

    useEffect(() => {
        if (!isOpen) return;

        setStep(1);
        setLinhas([]);
        setSearchQuery('');
        setPrioridade('NORMAL');
        setFilterCategory('');
        setFilterStatus('todos');
        setCurrentDraftId(draftId || null);
        setOriginalDraft(null);

        produtoService.getAll().then(data => {
            setProdutos(data);

            if (pedidoToEdit) {
                setPrioridade(pedidoToEdit.prioridade);
                setObservacoes(pedidoToEdit.observacoes || '');
                setStep(1);
                const editLinhas = pedidoToEdit.linhas.map((l: any) => {
                    const p = data.find((prod: any) => prod.id === l.produtoId);
                    return { produto: p || l.produto, quantidade: l.quantidade };
                });
                setLinhas(editLinhas);
            } else if (draftId) {
                pedidoCompraService.getRascunhos().then((drafts: any[]) => {
                    const draft = drafts.find((d: any) => d.id === draftId);
                    if (draft) {
                        setOriginalDraft(draft);
                        setPrioridade(draft.prioridade);
                        setObservacoes(draft.observacoes || '');
                        setStep(1);
                        const draftLinhas = draft.linhas.map((l: any) => {
                            const p = data.find((prod: any) => prod.id === l.produtoId);
                            return { produto: p || l.produto, quantidade: l.quantidade };
                        });
                        setLinhas(draftLinhas);
                    }
                }).catch(console.error);
            } else if (initialLinhas && initialLinhas.length > 0) {
                // Pre-seed from cancelled order with exact quantities
                const preSeeded = initialLinhas
                    .map(l => {
                        const p = data.find((prod: any) => prod.id === l.produtoId);
                        return p ? { produto: p, quantidade: l.quantidade } : null;
                    })
                    .filter(Boolean) as { produto: Produto; quantidade: number }[];
                setLinhas(preSeeded);
            } else if (initialProdutos && initialProdutos.length > 0) {
                // Pre-seed from Stock page selection
                const preSeeded = initialProdutos.map(p => {
                    let qtdInicial = 1;
                    if (p.stock < p.stockMinimo) {
                        qtdInicial = (p.stockMinimo + 1) - p.stock;
                    }
                    return { produto: p, quantidade: qtdInicial };
                });
                setLinhas(preSeeded);
            }
        }).catch(console.error);

        pedidoCompraService.getAll().then((pedidos: any[]) => {
            const maxId = pedidos.reduce((acc, p) => Math.max(acc, p.id ?? 0), 0);
            setNextPedidoId(maxId + 1);
        }).catch(console.error);
    }, [isOpen, draftId, pedidoToEdit]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (prioridadeRef.current && !prioridadeRef.current.contains(event.target as Node)) {
                setIsPrioridadeOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredProdutos = useMemo(() => {
        return produtos.filter(p => {
            const query = searchQuery.toLowerCase();
            const matchesSearch =
                p.nome.toLowerCase().includes(query) ||
                (p.categoria?.toLowerCase() || '').includes(query);

            const matchesCategory = filterCategory === '' || p.categoria === filterCategory;

            const isCritico = p.stock <= p.stockMinimo;
            const matchesStatus =
                filterStatus === 'todos' ? true :
                    filterStatus === 'critico' ? isCritico :
                        !isCritico;

            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [produtos, searchQuery, filterCategory, filterStatus]);

    const handleAdicionar = (produto: Produto) => {
        const isAdded = linhas.find(l => l.produto.id === produto.id);
        if (isAdded) return;

        let qtdInicial = 1;
        if (produto.stock < produto.stockMinimo) {
            qtdInicial = (produto.stockMinimo + 1) - produto.stock;
        }

        setLinhas([...linhas, { produto, quantidade: qtdInicial }]);
    };

    const handleRemover = (produtoId: number) => {
        setLinhas(linhas.filter(l => l.produto.id !== produtoId));
    };

    const handleQuantidadeChange = (produtoId: number, novaQtd: number) => {
        if (novaQtd < 1) novaQtd = 1;
        setLinhas(linhas.map(l => l.produto.id === produtoId ? { ...l, quantidade: novaQtd } : l));
    };

    const handleSubmit = async () => {
        if (linhas.length === 0) return;
        setIsSubmitting(true);
        try {
            if (pedidoToEdit) {
                await pedidoCompraService.editarPedido(pedidoToEdit.id, {
                    userId: user?.id ?? 0,
                    role: user?.role ?? '',
                    prioridade,
                    observacoes,
                    linhas: linhas.map(l => ({ produtoId: l.produto.id, quantidade: l.quantidade }))
                });
            } else if (currentDraftId) {
                await pedidoCompraService.updateRascunho(currentDraftId, {
                    userId: user?.id ?? 0,
                    role: user?.role ?? '',
                    prioridade,
                    estado: 'PENDENTE',
                    observacoes,
                    linhas: linhas.map(l => ({ produtoId: l.produto.id, quantidade: l.quantidade }))
                });
            } else {
                await pedidoCompraService.create({
                    criadoPorId: user?.id ?? null,
                    prioridade: prioridade,
                    estado: 'PENDENTE',
                    observacoes,
                    linhas: linhas.map(l => ({
                        produtoId: l.produto.id,
                        quantidade: l.quantidade
                    }))
                });
            }
            setCurrentDraftId(null);
            setLinhas([]);
            onClose(true, 'Pedido processado com sucesso!');
        } catch (e) {
            console.error(e);
            alert('Erro ao submeter pedido.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSaveDraft = async () => {
        if (linhas.length === 0) return; // don't save empty draft
        if (!user || (user.role !== 'ADMINISTRADOR' && user.role !== 'RESPONSAVEL_STOCK')) return;
        setIsSubmitting(true);
        try {
            if (currentDraftId) {
                await pedidoCompraService.updateRascunho(currentDraftId, {
                    userId: user?.id ?? 0,
                    role: user?.role ?? '',
                    prioridade,
                    estado: 'RASCUNHO',
                    observacoes,
                    linhas: linhas.map(l => ({ produtoId: l.produto.id, quantidade: l.quantidade }))
                });
                onClose(true, 'Rascunho atualizado');
            } else {
                await pedidoCompraService.create({
                    criadoPorId: user?.id ?? null,
                    prioridade: prioridade,
                    estado: 'RASCUNHO',
                    observacoes,
                    linhas: linhas.map(l => ({ produtoId: l.produto.id, quantidade: l.quantidade }))
                });
                onClose(true, 'Pedido guardado como rascunho');
            }
            setCurrentDraftId(null);
            setLinhas([]);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteDraft = async () => {
        if (!currentDraftId) return;
        setIsConfirmDeleteOpen(true);
    };

    const confirmDeleteDraft = async () => {
        if (!currentDraftId) return;
        setIsSubmitting(true);
        try {
            await pedidoCompraService.deleteRascunho(currentDraftId, { userId: user?.id ?? 0, role: user?.role ?? '' });
            setCurrentDraftId(null);
            setLinhas([]);
            setIsConfirmDeleteOpen(false);
            onClose(true, 'Rascunho eliminado com sucesso');
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCloseX = () => {
        // Auto-save logic on X
        if (linhas.length > 0 && user && (user.role === 'ADMINISTRADOR' || user.role === 'RESPONSAVEL_STOCK')) {
            handleSaveDraft();
        } else {
            onClose(false);
        }
    };

    const handleCancelClick = () => {
        // Explicit cancel does NOT save as draft, it just closes (and optionally deletes if it was a draft? let's keep it as is or delete)
        onClose(false);
    };

    if (!isOpen) return null;

    const totalProdutos = linhas.reduce((acc, l) => acc + l.quantidade, 0);
    const totalEstimado = linhas.reduce((acc, l) => acc + (l.quantidade * l.produto.preco), 0);
    const ano = new Date().getFullYear();
    const mockIdStr = pedidoToEdit ? pedidoToEdit.codigoFormatado : (originalDraft ? originalDraft.codigoFormatado : `PM-${ano}-${String(nextPedidoId).padStart(3, '0')}`);

    const modalContent = (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                    handleCloseX();
                }
            }}
        >
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">

                {/* Header Modal */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/80">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm border border-emerald-100 dark:border-emerald-500/20">
                            <Package size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
                                {pedidoToEdit ? 'Editar Pedido de Compra' : (currentDraftId ? 'Editar Rascunho' : 'Criar Pedido de Compra')}
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                                {step === 1 ? 'Passo 1: Selecione os produtos para o pedido' : 'Passo 2: Reveja e submeta o pedido'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleCloseX}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900 relative">
                    {/* Stepper Visual */}
                    <div className="flex items-center justify-center mb-8">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shadow-sm ${step === 1 ? 'bg-emerald-600 text-white' : 'bg-emerald-600 text-white'}`}>
                            {step === 2 ? <Check size={16} strokeWidth={3} /> : '1'}
                        </div>
                        <div className={`w-16 h-1 mx-2 rounded-full ${step === 2 ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shadow-sm ${step === 2 ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-400'}`}>
                            2
                        </div>
                        <div className="w-16 h-1 mx-2 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                        <div className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-400 shadow-sm">
                            3
                        </div>
                    </div>

                    {step === 1 && (
                        <div className="space-y-6">
                            {/* Filtros e Pesquisa */}
                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-visible shadow-sm z-20 relative">
                                <div className="p-4 border-b border-slate-100 dark:border-slate-700/50 space-y-4">
                                    {/* Linha 1: Filtros Compactos */}
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium text-xs">
                                            <Filter size={14} />
                                            Filtros:
                                        </div>

                                        {/* Status Filter */}
                                        <div className="flex p-0.5 bg-slate-100 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-700/60">
                                            <button
                                                onClick={() => setFilterStatus('todos')}
                                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${filterStatus === 'todos' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-700/50' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100'} `}
                                            >
                                                Todos
                                            </button>
                                            <button
                                                onClick={() => setFilterStatus('estavel')}
                                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${filterStatus === 'estavel' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-700/50' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100'} `}
                                            >
                                                Estável
                                            </button>
                                            <button
                                                onClick={() => setFilterStatus('critico')}
                                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${filterStatus === 'critico' ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-700/50' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100'} `}
                                            >
                                                Crítico
                                            </button>
                                        </div>

                                        {/* Category Dropdown */}
                                        <div className="relative min-w-[150px]">
                                            <button
                                                onClick={() => setIsFilterCategoryOpen(!isFilterCategoryOpen)}
                                                className={`w-full flex items-center justify-between gap-2 px-3 py-1 bg-white dark:bg-slate-800 border rounded-md text-xs font-medium transition-all ${filterCategory ? 'border-blue-500 text-blue-700 bg-blue-50 dark:bg-blue-500/10' : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:border-slate-600'}`}
                                            >
                                                {filterCategory || 'Todas as Categorias'}
                                                <ChevronDown size={14} className={`text-slate-400 transition-transform ${isFilterCategoryOpen ? 'rotate-180' : ''}`} />
                                            </button>
                                            {isFilterCategoryOpen && (
                                                <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-1 z-30 animate-in fade-in zoom-in-95">
                                                    <button
                                                        onClick={() => { setFilterCategory(''); setIsFilterCategoryOpen(false); }}
                                                        className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${!filterCategory ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900'}`}
                                                    >
                                                        Todas as Categorias
                                                    </button>
                                                    {CATEGORIES.map(cat => (
                                                        <button
                                                            key={cat}
                                                            onClick={() => { setFilterCategory(cat); setIsFilterCategoryOpen(false); }}
                                                            className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${filterCategory === cat ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900'}`}
                                                        >
                                                            {cat}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Limpar Filtros */}
                                        {(filterStatus !== 'todos' || filterCategory !== '' || searchQuery !== '') && (
                                            <button
                                                onClick={() => { setFilterStatus('todos'); setFilterCategory(''); setSearchQuery(''); }}
                                                className="ml-auto text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 transition-colors px-2"
                                            >
                                                Limpar filtros
                                            </button>
                                        )}
                                    </div>

                                    {/* Linha 2: Barra de Pesquisa */}
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Pesquisar produto por nome ou categoria..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-9 pr-24 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-xs placeholder:text-slate-400"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-medium">
                                            A mostrar {filteredProdutos.length} de {produtos.length}
                                        </div>
                                    </div>
                                </div>
                                <div className="max-h-60 overflow-y-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-10 text-slate-500 dark:text-slate-400 text-xs shadow-sm">
                                            <tr>
                                                <th className="px-5 py-3 font-semibold">Produto</th>
                                                <th className="px-5 py-3 font-semibold">Categoria</th>
                                                <th className="px-5 py-3 font-semibold">Stock Atual</th>
                                                <th className="px-5 py-3 font-semibold">Stock Mínimo</th>
                                                <th className="px-5 py-3 font-semibold"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredProdutos.map((p) => {
                                                const isAdded = linhas.some(l => l.produto.id === p.id);
                                                const isInCritical = p.stock <= p.stockMinimo;
                                                return (
                                                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900/50 transition-colors">
                                                        <td className="px-5 py-3 text-slate-900 dark:text-slate-100 font-medium">{p.nome}</td>
                                                        <td className="px-5 py-3">
                                                            <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-[10px] uppercase font-bold tracking-wider">
                                                                {p.categoria || 'Sem categoria'}
                                                            </span>
                                                        </td>
                                                        <td className={`px-5 py-3 font-semibold ${isInCritical ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                            {p.stock} un
                                                        </td>
                                                        <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{p.stockMinimo} un</td>
                                                        <td className="px-5 py-3 rounded-r-xl align-middle">
                                                            <div className="flex flex-col items-center gap-1.5 w-[90px] mx-auto text-center">
                                                                {isAdded ? (
                                                                    <button disabled className="w-full px-3 py-1.5 text-xs font-bold text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-not-allowed">
                                                                        Adicionado
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => handleAdicionar(p)}
                                                                        className="w-full px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm"
                                                                    >
                                                                        Adicionar
                                                                    </button>
                                                                )}
                                                                {isInCritical && !isAdded && (
                                                                    <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 tracking-tight">
                                                                        Sugestão: {(p.stockMinimo + 1) - p.stock} un
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {filteredProdutos.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                                                        Nenhum produto encontrado.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Produtos Selecionados */}
                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">Produtos na Lista ({linhas.length})</h3>
                                {linhas.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                                        <Package size={48} strokeWidth={1} className="mb-3 text-slate-300" />
                                        <p>Nenhum produto adicionado ainda</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {linhas.map((linha) => (
                                            <div key={linha.produto.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/50 hover:border-emerald-100 dark:border-emerald-500/20 hover:bg-emerald-50 dark:bg-emerald-500/10 transition-colors">
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{linha.produto.nome}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{linha.produto.categoria} &bull; {formatCurrency(linha.produto.preco)} / un</p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Qtd:</span>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={linha.quantidade}
                                                            onChange={(e) => handleQuantidadeChange(linha.produto.id, parseInt(e.target.value) || 1)}
                                                            className="w-20 px-3 py-1.5 text-sm font-bold text-slate-900 dark:text-slate-100 text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                                                        />
                                                        <span className="text-xs text-slate-500 dark:text-slate-400 w-6">un</span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemover(linha.produto.id)}
                                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:bg-red-500/10 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            {/* Resumo Geral */}
                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm flex flex-col sm:flex-row gap-6 justify-between">
                                <div className="space-y-4 flex-1">
                                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Resumo do Pedido</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">ID</p>
                                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{mockIdStr}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Data</p>
                                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{hoje}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Itens do Pedido</p>
                                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{linhas.length}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total de Produtos</p>
                                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{totalProdutos} un</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Definições</h3>
                                    <div className="relative" ref={prioridadeRef}>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Prioridade</p>
                                        <button
                                            type="button"
                                            onClick={() => setIsPrioridadeOpen(!isPrioridadeOpen)}
                                            className="w-full sm:w-[160px] px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all flex items-center justify-between text-sm group hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900 shadow-sm"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2.5 h-2.5 rounded-full ${TODAS_PRIORIDADES.find(p => p.value === prioridade)?.dot || 'bg-slate-400'}`}></span>
                                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                    {TODAS_PRIORIDADES.find(p => p.value === prioridade)?.label || prioridade}
                                                </span>
                                            </div>
                                            <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isPrioridadeOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        {isPrioridadeOpen && (
                                            <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 py-1.5 animate-in fade-in zoom-in-95 duration-200">
                                                {/* Apenas NORMAL e URGENTE são selectáveis — ALTA é sistema */}
                                                {PRIORIDADES.map((item) => (
                                                    <button
                                                        key={item.value}
                                                        type="button"
                                                        onClick={() => {
                                                            setPrioridade(item.value);
                                                            setIsPrioridadeOpen(false);
                                                        }}
                                                        className={`w-full px-3 py-2 flex items-center gap-2 transition-colors text-sm ${prioridade === item.value ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900 font-medium'}`}
                                                    >
                                                        <span className={`w-2 h-2 rounded-full ${item.dot}`}></span>
                                                        {item.label}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Produtos Revistos */}
                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 p-5 border-b border-slate-100 dark:border-slate-700/50">Lista de Produtos</h3>
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs border-b border-slate-100 dark:border-slate-700/50 uppercase tracking-wider">
                                        <tr>
                                            <th className="px-5 py-3 font-semibold">Produto</th>
                                            <th className="px-5 py-3 font-semibold">Categoria</th>
                                            <th className="px-5 py-3 font-semibold text-center">Quantidade</th>
                                            <th className="px-5 py-3 font-semibold text-right">Preço Unit.</th>
                                            <th className="px-5 py-3 font-semibold text-right">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {linhas.map((linha) => (
                                            <tr key={linha.produto.id}>
                                                <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100">{linha.produto.nome}</td>
                                                <td className="px-5 py-3">
                                                    <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-[10px] uppercase font-bold tracking-wider">
                                                        {linha.produto.categoria || 'Sem categoria'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-center font-bold text-slate-700 dark:text-slate-300">{linha.quantidade}</td>
                                                <td className="px-5 py-3 text-right text-slate-500 dark:text-slate-400">{formatCurrency(linha.produto.preco)}</td>
                                                <td className="px-5 py-3 text-right font-bold text-slate-900 dark:text-slate-100">{formatCurrency(linha.quantidade * linha.produto.preco)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="bg-emerald-50 dark:bg-emerald-500/10 px-6 py-4 flex items-center justify-end gap-6 border-t border-slate-200 dark:border-slate-700/60">
                                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Total Estimado:</span>
                                    <span className="text-xl font-bold text-emerald-700">{formatCurrency(totalEstimado)}</span>
                                </div>
                            </div>

                            {/* Observações */}
                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 p-5 border-b border-slate-100 dark:border-slate-700/50">Observações</h3>
                                <div className="p-5">
                                    <textarea
                                        value={observacoes}
                                        onChange={(e) => setObservacoes(e.target.value)}
                                        placeholder="Adicione observações relevantes para o pedido (opcional)..."
                                        className="w-full text-sm placeholder-slate-400 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none h-24 transition-colors"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-800 flex items-center justify-between">
                    <div className="flex gap-2">
                        {step === 1 && !currentDraftId && !pedidoToEdit && linhas.length > 0 && (
                            <button
                                onClick={() => setLinhas([])}
                                className="text-sm font-semibold text-slate-400 hover:text-red-500 px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                            >
                                <Trash2 size={16} /> Limpar Tudo
                            </button>
                        )}
                        {step === 2 && (
                            <button
                                onClick={() => setStep(1)}
                                className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                            >
                                <ArrowLeft size={16} /> Voltar
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {!currentDraftId && (
                            <button
                                onClick={handleCancelClick}
                                className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 transition-colors"
                            >
                                Cancelar
                            </button>
                        )}
                        {currentDraftId && !pedidoToEdit && (
                            <button
                                onClick={handleDeleteDraft}
                                disabled={isSubmitting}
                                className="px-4 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-100 dark:border-red-500/20"
                            >
                                Eliminar Rascunho
                            </button>
                        )}

                        {step === 1 ? (
                            <button
                                onClick={() => setStep(2)}
                                disabled={linhas.length === 0}
                                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Rever Lista <ArrowRight size={16} />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || linhas.length === 0}
                                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <>A Submeter...</>
                                ) : (
                                    <>Finalizar Pedido <CheckCircle2 size={18} /></>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Confirm Delete Draft Modal */}
            {isConfirmDeleteOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) {
                            setIsConfirmDeleteOpen(false);
                        }
                    }}
                >
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-4">
                                <AlertTriangle size={24} className="text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Eliminar Rascunho</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Tem a certeza que deseja eliminar este rascunho? Esta ação não pode ser desfeita.
                            </p>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-end gap-3">
                            <button
                                onClick={() => setIsConfirmDeleteOpen(false)}
                                disabled={isSubmitting}
                                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 transition-colors disabled:opacity-50"
                            >
                                Voltar
                            </button>
                            <button
                                onClick={confirmDeleteDraft}
                                disabled={isSubmitting}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm focus:ring-2 focus:ring-red-500 focus:ring-offset-1 flex items-center gap-2 disabled:opacity-50"
                            >
                                {isSubmitting ? 'A eliminar...' : 'Sim, Eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    return createPortal(modalContent, document.body);
}
