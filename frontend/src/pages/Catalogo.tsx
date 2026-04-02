import { useState, useEffect, useRef } from 'react';
import { 
    Plus, Package, AlertTriangle, CheckCircle2, X, AlertCircle, 
    Search, Filter, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, ShoppingCart, MoreHorizontal, Check,
    MoreVertical, Pencil, MousePointer2
} from 'lucide-react';
import { produtoService } from '../services/produtoService';
import CriarProdutoModal from '../components/CriarProdutoModal';
import EditarProdutoModal from '../components/EditarProdutoModal';
import PedidoAutomaticoModal from '../components/PedidoAutomaticoModal';
import CriarPedidoCompraModal from '../components/CriarPedidoCompraModal';

interface Produto {
    id: number;
    nome: string;
    stock: number;
    stockMinimo: number;
    preco?: number;
    categoria?: string;
    descricao?: string;
    criadoEm: string;
    fornecedores?: { id: number; nome: string }[];
}

interface Toast {
    message: string;
    type: 'success' | 'error';
}

type SortField = 'nome' | 'stock' | 'preco';
type SortOrder = 'asc' | 'desc';

const CATEGORIES = ['Medicamentos', 'Vacinas', 'Higiene', 'Equipamento', 'Outros'];

const Catalogo = () => {
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAutoOrderModalOpen, setIsAutoOrderModalOpen] = useState(false);
    const [isCriarPedidoModalOpen, setIsCriarPedidoModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<Toast | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Selection mode state
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [produtosParaPedido, setProdutosParaPedido] = useState<(Omit<Produto, 'preco'> & { preco: number })[]>([]);

    // Header 3-dot actions menu (Adicionar Produto)
    const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
    const actionsMenuRef = useRef<HTMLDivElement>(null);

    // Per-row 3-dot menu
    const [openRowMenuId, setOpenRowMenuId] = useState<number | null>(null);
    const rowMenuRef = useRef<HTMLDivElement | null>(null);

    // Sorting state
    const [sortField, setSortField] = useState<SortField>('nome');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

    // Filter states
    const [filterCategory, setFilterCategory] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<'todos' | 'estavel' | 'critico'>('todos');
    const [isFilterCategoryOpen, setIsFilterCategoryOpen] = useState(false);

    // Edit Modal State
    const [productToEdit, setProductToEdit] = useState<Produto | null>(null);

    // Close header actions menu on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
                setIsActionsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close row menu on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (rowMenuRef.current && !rowMenuRef.current.contains(event.target as Node)) {
                setOpenRowMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchProdutos = async () => {
        try {
            setLoading(true);
            const data = await produtoService.getAll();
            setProdutos(data);
        } catch (error) {
            console.error('Erro ao buscar produtos:', error);
            showToast('Erro ao carregar os produtos.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

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

    const filteredProdutos = produtos.filter((p) => {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
            p.nome.toLowerCase().includes(query) || 
            (p.categoria?.toLowerCase().includes(query)) || 
            (p.descricao?.toLowerCase().includes(query));

        const matchesCategory = filterCategory === '' || p.categoria === filterCategory;
        
        const isCritico = p.stock <= p.stockMinimo;
        const matchesStatus = 
            filterStatus === 'todos' ? true :
            filterStatus === 'critico' ? isCritico :
            !isCritico;

        return matchesSearch && matchesCategory && matchesStatus;
    });

    const sortedProdutos = [...filteredProdutos].sort((a, b) => {
        let aValue = a[sortField] ?? 0;
        let bValue = b[sortField] ?? 0;

        if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
        }
        return 0;
    });

    useEffect(() => {
        fetchProdutos();
    }, []);

    const handleDelete = async (id: number) => {
        try {
            await produtoService.delete(id);
            showToast('Produto eliminado com sucesso.', 'success');
            setProductToEdit(null);
            fetchProdutos();
        } catch (error) {
            console.error('Erro ao eliminar produto:', error);
            showToast('Erro ao eliminar o produto. Tente novamente.', 'error');
        }
    };

    // Selection mode helpers
    const enterSelectionMode = () => {
        setIsSelectionMode(true);
        setSelectedIds([]);
    };

    const exitSelectionMode = () => {
        setIsSelectionMode(false);
        setSelectedIds([]);
    };

    const toggleSelect = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleConfirmarPedido = () => {
        const selecionados = produtos
            .filter(p => selectedIds.includes(p.id))
            .map(p => ({ ...p, preco: p.preco ?? 0 }));
        setProdutosParaPedido(selecionados);
        setIsCriarPedidoModalOpen(true);
        exitSelectionMode();
    };

    // Row menu: Selecionar — enter selection mode + pre-select this product
    const handleRowSelecionar = (produto: Produto) => {
        setOpenRowMenuId(null);
        setIsSelectionMode(true);
        setSelectedIds([produto.id]);
    };

    // Row menu: Criar Pedido — open modal directly with this single product
    const handleRowCriarPedido = (produto: Produto) => {
        setOpenRowMenuId(null);
        setProdutosParaPedido([{ ...produto, preco: produto.preco ?? 0 }]);
        setIsCriarPedidoModalOpen(true);
    };

    return (
        <div className="space-y-6 relative">
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

            {/* Page title — non-sticky */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Stock</h1>
                <p className="mt-2 text-sm text-slate-500">
                    Gerencie o stock de produtos nesta secção.
                </p>
            </div>

            {/* ── Unified sticky header: actions + filters + search ── */}
            <div className="sticky top-0 z-20 -mx-8 px-8 pt-4 pb-3 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm space-y-3">

                {/* Row 1: action buttons */}
                <div className="flex justify-end items-center">
                    {/* Normal mode buttons */}
                    {!isSelectionMode && (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={enterSelectionMode}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-black rounded-lg hover:bg-emerald-700 transition-all shadow-md shadow-emerald-500/20 active:scale-95"
                            >
                                <ShoppingCart size={18} />
                                Criar Pedido
                            </button>

                            <button
                                onClick={() => setIsAutoOrderModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 text-sm font-black rounded-lg hover:bg-blue-50 transition-all border-2 border-blue-100 hover:border-blue-200 shadow-sm active:scale-95"
                            >
                                <ShoppingCart size={18} />
                                Pedidos Automáticos
                            </button>

                            <div className="relative" ref={actionsMenuRef}>
                                <button
                                    onClick={() => setIsActionsMenuOpen(prev => !prev)}
                                    className="flex items-center justify-center w-10 h-10 rounded-lg border-2 border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95"
                                    title="Mais ações"
                                >
                                    <MoreHorizontal size={20} />
                                </button>
                                {isActionsMenuOpen && (
                                    <div className="absolute top-[calc(100%+8px)] right-0 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1.5 animate-in fade-in zoom-in-95 duration-150">
                                        <button
                                            onClick={() => { setIsActionsMenuOpen(false); setIsModalOpen(true); }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                                        >
                                            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                                <Package size={16} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-800">Adicionar Produto</p>
                                                <p className="text-[11px] text-slate-400 font-medium">Novo item no stock</p>
                                            </div>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Selection mode controls */}
                    {isSelectionMode && (
                        <div className="flex items-center gap-2.5 animate-in fade-in slide-in-from-right-4 duration-200">
                            <span className="inline-flex items-center px-3.5 py-2 rounded-lg bg-slate-100 border border-slate-200 text-sm font-semibold text-slate-600 tabular-nums whitespace-nowrap">
                                {selectedIds.length} selecionados
                            </span>
                            <button
                                onClick={exitSelectionMode}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-slate-600 text-sm font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 hover:text-slate-800 transition-all shadow-sm active:scale-95"
                            >
                                <X size={15} strokeWidth={2.5} />
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmarPedido}
                                disabled={selectedIds.length === 0}
                                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all shadow-sm active:scale-95 ${
                                    selectedIds.length > 0
                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/25'
                                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                            >
                                <ShoppingCart size={16} strokeWidth={2} />
                                Criar Pedido
                            </button>
                        </div>
                    )}
                </div>

                {/* Row 2: filters */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative">
                    <div className="flex items-center gap-2 text-slate-500 font-medium text-sm mr-2">
                        <Filter size={16} />
                        Filtros:
                    </div>

                    <div className="flex p-1 bg-slate-100/50 rounded-lg border border-slate-200/60">
                        <button onClick={() => setFilterStatus('todos')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filterStatus === 'todos' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-600 hover:text-slate-900'}`}>Todos</button>
                        <button onClick={() => setFilterStatus('estavel')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filterStatus === 'estavel' ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-600 hover:text-slate-900'}`}>Estável</button>
                        <button onClick={() => setFilterStatus('critico')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filterStatus === 'critico' ? 'bg-white text-amber-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-600 hover:text-slate-900'}`}>Crítico</button>
                    </div>

                    <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>

                    <div className="relative min-w-[200px]">
                        <button
                            onClick={() => setIsFilterCategoryOpen(!isFilterCategoryOpen)}
                            className={`w-full flex items-center justify-between gap-2 px-4 py-2 bg-white border rounded-lg text-sm font-medium transition-all ${filterCategory ? 'border-blue-500 text-blue-700 ring-4 ring-blue-500/10' : 'border-slate-200 text-slate-700 hover:border-slate-300'}`}
                        >
                            {filterCategory || 'Todas as Categorias'}
                            <ChevronDown size={16} className={`text-slate-400 transition-transform ${isFilterCategoryOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isFilterCategoryOpen && (
                            <div className="absolute top-full left-0 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95">
                                <button onClick={() => { setFilterCategory(''); setIsFilterCategoryOpen(false); }} className={`w-full text-left px-4 py-2 text-sm transition-colors ${!filterCategory ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'}`}>Todas as Categorias</button>
                                {CATEGORIES.map(cat => (
                                    <button key={cat} onClick={() => { setFilterCategory(cat); setIsFilterCategoryOpen(false); }} className={`w-full text-left px-4 py-2 text-sm transition-colors ${filterCategory === cat ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'}`}>{cat}</button>
                                ))}
                            </div>
                        )}
                    </div>

                    {(filterStatus !== 'todos' || filterCategory !== '' || searchQuery !== '') && (
                        <button onClick={() => { setFilterStatus('todos'); setFilterCategory(''); setSearchQuery(''); }} className="ml-auto text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors px-2">
                            Limpar filtros
                        </button>
                    )}
                </div>

                {/* Row 3: search (only when there are products) */}
                {produtos.length > 0 && (
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                        <div className="relative w-full max-w-md">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Pesquisar por nome ou descrição..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-transparent border-0 outline-none text-sm placeholder:text-slate-400"
                            />
                        </div>
                        <div className="text-xs text-slate-500 font-medium px-4 whitespace-nowrap">
                            A mostrar <span className="font-bold text-slate-700">{filteredProdutos.length}</span> de <span className="font-bold text-slate-700">{produtos.length}</span> produtos
                        </div>
                    </div>
                )}
            </div>
            {/* ── End sticky header ── */}


            {loading ? (
                <div className="flex justify-center items-center h-64 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                </div>
            ) : produtos.length > 0 ? (
                sortedProdutos.length > 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative z-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50/50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4">
                                            <button 
                                                onClick={() => handleSort('nome')}
                                                className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest group hover:text-slate-900 transition-colors"
                                            >
                                                Produto
                                                {getSortIcon('nome')}
                                            </button>
                                        </th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Categoria</th>
                                        <th className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => handleSort('stock')}
                                                className="flex items-center justify-center gap-2 mx-auto text-xs font-bold text-slate-500 uppercase tracking-widest group hover:text-slate-900 transition-colors"
                                            >
                                                Stock
                                                {getSortIcon('stock')}
                                            </button>
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">Stock Mín.</th>
                                        <th className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => handleSort('preco')}
                                                className="flex items-center justify-end gap-2 ml-auto text-xs font-bold text-slate-500 uppercase tracking-widest group hover:text-slate-900 transition-colors"
                                            >
                                                Preço
                                                {getSortIcon('preco')}
                                            </button>
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">Estado</th>
                                        {/* Ações OR Selecionar column */}
                                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                                            {isSelectionMode ? 'Selecionar' : 'Ações'}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {sortedProdutos.map((produto) => {
                                        const isSelected = selectedIds.includes(produto.id);

                                        return (
                                            <tr
                                                key={produto.id}
                                                onClick={isSelectionMode ? () => toggleSelect(produto.id) : undefined}
                                                className={`group transition-all ${
                                                    isSelectionMode
                                                        ? isSelected
                                                            ? 'bg-blue-50/50 cursor-pointer'
                                                            : 'hover:bg-slate-50/60 cursor-pointer'
                                                        : 'hover:bg-slate-50/50'
                                                }`}
                                                style={isSelectionMode && isSelected ? { boxShadow: 'inset 3px 0 0 #3b82f6' } : isSelectionMode ? { boxShadow: 'inset 3px 0 0 transparent' } : {}}
                                            >
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`p-2.5 border shadow-sm rounded-xl transition-colors ${
                                                            isSelected
                                                                ? 'bg-blue-50 border-blue-200 text-blue-500'
                                                                : 'bg-white border-slate-100 text-slate-600 group-hover:text-emerald-600'
                                                        }`}>
                                                            <Package size={20} />
                                                        </div>
                                                        <div>
                                                            <span className="block font-bold text-slate-900">{produto.nome}</span>
                                                            {produto.descricao && (
                                                                <span className="text-[11px] text-slate-400 font-medium truncate max-w-[200px] block">{produto.descricao}</span>
                                                            )}
                                                            {produto.fornecedores && produto.fornecedores.length > 0 && (
                                                                <span className="text-[10px] text-emerald-600 font-bold block mt-1">
                                                                    Fornecedores: {produto.fornecedores.map(f => f.nome).join(', ')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                                        {produto.categoria || 'Sem categoria'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <span className="font-mono font-bold text-slate-700">{produto.stock}</span>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <span className="font-mono font-medium text-slate-400">{produto.stockMinimo}</span>
                                                </td>
                                                <td className="px-6 py-5 text-right font-bold text-slate-900">
                                                    {produto.preco ? `${produto.preco.toFixed(2)} €` : '0.00 €'}
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex justify-center">
                                                        {produto.stock <= produto.stockMinimo ? (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-600 border border-amber-100">
                                                                <AlertTriangle size={12} className="animate-pulse" />
                                                                CRÍTICO
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                                <CheckCircle2 size={12} />
                                                                ESTÁVEL
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                                                        {isSelectionMode ? (
                                                            /* Custom styled checkbox */
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); toggleSelect(produto.id); }}
                                                                className={`w-[22px] h-[22px] rounded-[5px] border-2 flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
                                                                    isSelected
                                                                        ? 'bg-blue-500 border-blue-500 shadow-sm shadow-blue-200'
                                                                        : 'bg-white border-slate-300 hover:border-blue-400 hover:bg-blue-50/30'
                                                                }`}
                                                            >
                                                                {isSelected && (
                                                                    <Check size={13} strokeWidth={3} className="text-white" />
                                                                )}
                                                            </button>
                                                        ) : (
                                                            /* Row 3-dot actions menu */
                                                            <div
                                                                className="relative"
                                                                ref={openRowMenuId === produto.id ? rowMenuRef : null}
                                                            >
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setOpenRowMenuId(prev => prev === produto.id ? null : produto.id);
                                                                    }}
                                                                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                                                    title="Ações"
                                                                >
                                                                    <MoreVertical size={18} />
                                                                </button>

                                                                {openRowMenuId === produto.id && (
                                                                    <div className="absolute right-0 top-[calc(100%+4px)] w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-40 py-1 animate-in fade-in zoom-in-95 duration-150">
                                                                        {/* Selecionar */}
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); handleRowSelecionar(produto); }}
                                                                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                                                                        >
                                                                            <MousePointer2 size={15} className="text-slate-400 flex-shrink-0" />
                                                                            Selecionar
                                                                        </button>

                                                                        <div className="my-1 border-t border-slate-100" />

                                                                        {/* Editar Produto */}
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); setOpenRowMenuId(null); setProductToEdit(produto); }}
                                                                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                                                                        >
                                                                            <Pencil size={15} className="text-slate-400 flex-shrink-0" />
                                                                            Editar Produto
                                                                        </button>

                                                                        {/* Criar Pedido */}
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); handleRowCriarPedido(produto); }}
                                                                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                                                                        >
                                                                            <ShoppingCart size={15} className="text-slate-400 flex-shrink-0" />
                                                                            Criar Pedido
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white p-16 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-slate-50 text-slate-400 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                            <Search size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Nenhum produto encontrado</h3>
                        <p className="text-sm text-slate-500">Tente ajustar os filtros ou a sua pesquisa.</p>
                    </div>
                )
            ) : (
                <div className="bg-white p-20 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                        <Package size={48} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Stock Vazio</h3>
                    <p className="text-slate-500 max-w-sm font-medium mb-8">
                        O stock está atualmente sem produtos. Comece por adicionar os itens essenciais para a sua clínica.
                    </p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all hover:shadow-xl active:scale-95"
                    >
                        <Plus size={20} />
                        Criar Primeiro Produto
                    </button>
                </div>
            )}

            {/* Modals */}
            <CriarProdutoModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    fetchProdutos();
                    showToast('Produto registado com sucesso!', 'success');
                }}
            />

            <PedidoAutomaticoModal
                isOpen={isAutoOrderModalOpen}
                onClose={(shouldRefresh, msg) => {
                    setIsAutoOrderModalOpen(false);
                    if (shouldRefresh) {
                        fetchProdutos();
                        if (msg) showToast(msg, 'success');
                    }
                }}
            />

            <CriarPedidoCompraModal
                isOpen={isCriarPedidoModalOpen}
                onClose={(shouldRefresh, msg) => {
                    setIsCriarPedidoModalOpen(false);
                    setProdutosParaPedido([]);
                    if (shouldRefresh && msg) showToast(msg, 'success');
                }}
                initialProdutos={produtosParaPedido}
            />

            {productToEdit && (
                <EditarProdutoModal
                    isOpen={!!productToEdit}
                    onClose={() => setProductToEdit(null)}
                    onSuccess={() => {
                        fetchProdutos();
                        showToast('Produto atualizado com sucesso!', 'success');
                        setProductToEdit(null);
                    }}
                    onDelete={handleDelete}
                    produto={productToEdit}
                />
            )}
        </div>
    );
};

export default Catalogo;
