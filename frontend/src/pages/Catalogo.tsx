import { useState, useEffect, useRef } from 'react';
import { 
    Plus, Package, AlertTriangle, CheckCircle2, X, AlertCircle, 
    Search, Filter, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, ShoppingCart, MoreHorizontal, Check,
    MoreVertical, Pencil, MousePointer2, History, Star, BookOpen
} from 'lucide-react';
import { produtoService } from '../services/produtoService';
import CriarProdutoModal from '../components/CriarProdutoModal';
import EditarProdutoModal from '../components/EditarProdutoModal';
import PedidoAutomaticoModal from '../components/PedidoAutomaticoModal';
import CriarPedidoCompraModal from '../components/CriarPedidoCompraModal';
import DetalhesProdutoModal from '../components/DetalhesProdutoModal';
import HistoricoStockModal from '../components/HistoricoStockModal';

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
    fornecedorPreferencial?: { id: number; nome: string } | null;
    linhasPedido?: {
        pedidoCompra: {
            id: number;
            estado: string;
            criadoEm: string;
            prioridade: string;
        }
    }[];
}

interface Toast {
    message: string;
    type: 'success' | 'error';
}

type SortField = 'nome' | 'categoria' | 'stock' | 'stockMinimo' | 'preco' | 'estado';
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
    const [isHistoricoModalOpen, setIsHistoricoModalOpen] = useState(false);

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
    const [productToView, setProductToView] = useState<Produto | null>(null);

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
        if (sortField !== field) return <ArrowUpDown size={14} className="text-slate-400 group-hover:text-slate-600 dark:text-slate-400" />;
        return sortOrder === 'asc' 
            ? <ArrowUp size={14} className="text-emerald-600 dark:text-emerald-400" /> 
            : <ArrowDown size={14} className="text-emerald-600 dark:text-emerald-400" />;
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
        if (sortField === 'estado') {
            const aCritico = a.stock <= a.stockMinimo ? 1 : 0;
            const bCritico = b.stock <= b.stockMinimo ? 1 : 0;
            return sortOrder === 'asc' ? aCritico - bCritico : bCritico - aCritico;
        }

        const aValue = a[sortField as keyof Produto];
        const bValue = b[sortField as keyof Produto];

        if (typeof aValue === 'string' || typeof bValue === 'string') {
            const strA = String(aValue || '');
            const strB = String(bValue || '');
            return sortOrder === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
        }
        
        const numA = Number(aValue || 0);
        const numB = Number(bValue || 0);
        return sortOrder === 'asc' ? numA - numB : numB - numA;
    });

    useEffect(() => {
        fetchProdutos();
    }, []);

    const handleDelete = async (id: number, force?: boolean): Promise<boolean | void> => {
        try {
            await produtoService.delete(id, force);
            showToast('Produto eliminado com sucesso.', 'success');
            setProductToEdit(null);
            fetchProdutos();
            return true;
        } catch (error: any) {
            if (error.response?.data?.code === 'HAS_RELATIONS' && !force) {
                return false;
            }
            console.error('Erro ao eliminar produto:', error);
            showToast('Erro ao eliminar o produto. Tente novamente.', 'error');
            return true;
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
                <div className="fixed bottom-6 right-6 z-[60] animate-in slide-in-from-right-full duration-300">
                    <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border ${toast.type === 'success'
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-800'
                            : 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20 text-red-800'
                        }`}>
                        {toast.type === 'success' ? <CheckCircle2 size={20} className="text-emerald-500" /> : <AlertCircle size={20} className="text-red-500" />}
                        <span className="text-sm font-bold">{toast.message}</span>
                        <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70 transition-opacity">
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* ── Header Principal (Premium Box) ── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                        <BookOpen className="text-emerald-600 dark:text-emerald-400" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-slate-200 tracking-tight">Stock</h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">Gerencie o stock de produtos nesta secção.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto justify-end">
                    {/* Normal mode buttons */}
                    {!isSelectionMode ? (
                        <>
                            <button
                                onClick={() => setIsAutoOrderModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 text-sm font-black rounded-lg hover:bg-blue-50 dark:bg-blue-500/10 transition-all border-2 border-blue-100 dark:border-blue-500/20 hover:border-blue-200 shadow-sm active:scale-95"
                            >
                                <ShoppingCart size={18} />
                                Pedidos Automáticos
                            </button>

                            <button
                                onClick={enterSelectionMode}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-black rounded-lg hover:bg-emerald-700 transition-all shadow-md shadow-emerald-500/20 active:scale-95"
                            >
                                <ShoppingCart size={18} />
                                Criar Pedido
                            </button>

                            <div className="relative" ref={actionsMenuRef}>
                                <button
                                    onClick={() => setIsActionsMenuOpen(prev => !prev)}
                                    className="flex items-center justify-center w-10 h-10 rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900 hover:border-slate-300 dark:border-slate-600 transition-all shadow-sm active:scale-95"
                                    title="Mais ações"
                                >
                                    <MoreHorizontal size={20} />
                                </button>
                                {isActionsMenuOpen && (
                                    <div className="absolute top-[calc(100%+8px)] right-0 w-60 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 py-1.5 animate-in fade-in zoom-in-95 duration-150">
                                        <button
                                            onClick={() => { setIsActionsMenuOpen(false); setIsModalOpen(true); }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900 transition-colors text-left"
                                        >
                                            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400">
                                                <Package size={16} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-800 dark:text-slate-200">Adicionar Produto</p>
                                                <p className="text-[11px] text-slate-400 font-medium">Novo item no stock</p>
                                            </div>
                                        </button>
                                        <div className="my-1 border-t border-slate-100 dark:border-slate-700/50" />
                                        <button
                                            onClick={() => { setIsActionsMenuOpen(false); setIsHistoricoModalOpen(true); }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900 transition-colors text-left"
                                        >
                                            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                                <History size={16} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-800 dark:text-slate-200">Consultar Histórico</p>
                                                <p className="text-[11px] text-slate-400 font-medium">Entradas de stock recebidas</p>
                                            </div>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-2.5 animate-in fade-in slide-in-from-right-4 duration-200">
                            <span className="inline-flex items-center px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-400 tabular-nums whitespace-nowrap">
                                {selectedIds.length} selecionados
                            </span>
                            <button
                                onClick={exitSelectionMode}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900 hover:text-slate-800 dark:text-slate-200 transition-all shadow-sm active:scale-95"
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
                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                                }`}
                            >
                                <ShoppingCart size={16} strokeWidth={2} />
                                Criar Pedido
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Bloco sticky integrado (Layout Filtros) ── */}
            <div className="sticky top-0 z-40 bg-slate-50 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700/50 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 pt-4 pb-4 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)] transition-all mb-2">
                <div className="space-y-5">
                    {/* Linha 2: 2 Blocks (Pesquisa + Filtros separados) */}
                    <div className="flex flex-col xl:flex-row gap-4 items-stretch xl:items-center">
                        
                        {/* Search Bar Container */}
                        {produtos.length > 0 && (
                            <label className="flex flex-row justify-between items-center gap-4 bg-white dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm relative z-10 flex-grow cursor-text">
                                <div className="relative flex-1 min-w-0">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Pesquisar por nome ou descrição..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-transparent border-0 outline-none text-sm placeholder:text-slate-400"
                                    />
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium px-4 whitespace-nowrap hidden sm:block">
                                    <span className="font-bold text-slate-700 dark:text-slate-300">{filteredProdutos.length}</span> / <span className="font-bold text-slate-700 dark:text-slate-300">{produtos.length}</span> produtos
                                </div>
                            </label>
                        )}

                        {/* Filtros Container */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm flex-grow xl:flex-grow-0 relative z-20">
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium text-sm mr-2 hidden sm:flex">
                                <Filter size={16} />
                                Filtros
                            </div>

                            <div className="flex p-1 bg-slate-100 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-700/60 w-full sm:w-auto">
                                <button onClick={() => setFilterStatus('todos')} className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filterStatus === 'todos' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-700/50' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100'}`}>Todos</button>
                                <button onClick={() => setFilterStatus('estavel')} className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filterStatus === 'estavel' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-700/50' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100'}`}>Estável</button>
                                <button onClick={() => setFilterStatus('critico')} className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filterStatus === 'critico' ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-700/50' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100'}`}>Crítico</button>
                            </div>

                            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>

                            <div className="relative min-w-[150px] w-full sm:w-auto">
                                <button
                                    onClick={() => setIsFilterCategoryOpen(!isFilterCategoryOpen)}
                                    className={`w-full flex items-center justify-between gap-2 px-4 py-2 bg-white dark:bg-slate-800 border rounded-lg text-sm font-medium transition-all ${filterCategory ? 'border-blue-500 text-blue-700 ring-4 ring-blue-500/10' : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:border-slate-600'}`}
                                >
                                    {filterCategory || 'Todas as Categorias'}
                                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${isFilterCategoryOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {isFilterCategoryOpen && (
                                    <div className="absolute top-full right-0 mt-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95">
                                        <button onClick={() => { setFilterCategory(''); setIsFilterCategoryOpen(false); }} className={`w-full text-left px-4 py-2 text-sm transition-colors ${!filterCategory ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900'}`}>Todas as Categorias</button>
                                        {CATEGORIES.map(cat => (
                                            <button key={cat} onClick={() => { setFilterCategory(cat); setIsFilterCategoryOpen(false); }} className={`w-full text-left px-4 py-2 text-sm transition-colors ${filterCategory === cat ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900'}`}>{cat}</button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {(filterStatus !== 'todos' || filterCategory !== '' || searchQuery !== '') && (
                                <button onClick={() => { setFilterStatus('todos'); setFilterCategory(''); setSearchQuery(''); }} className="ml-auto text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 transition-colors px-2">
                                    Limpar
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>


            {loading ? (
                <div className="flex justify-center items-center h-64 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                </div>
            ) : produtos.length > 0 ? (
                sortedProdutos.length > 0 ? (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden relative z-0">
                        <div className="w-full overflow-auto max-h-[calc(100vh-280px)] custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 z-30 bg-slate-50 dark:bg-slate-900/95 backdrop-blur-md shadow-sm border-b border-slate-200 dark:border-slate-700">
                                    <tr>
                                        <th className="px-6 py-4">
                                            <button 
                                                onClick={() => handleSort('nome')}
                                                className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest group hover:text-slate-900 dark:text-slate-100 transition-colors"
                                            >
                                                Produto
                                                {getSortIcon('nome')}
                                            </button>
                                        </th>
                                        <th className="px-6 py-4">
                                            <button 
                                                onClick={() => handleSort('categoria')}
                                                className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest group hover:text-slate-900 dark:text-slate-100 transition-colors"
                                            >
                                                Categoria
                                                {getSortIcon('categoria')}
                                            </button>
                                        </th>
                                        <th className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => handleSort('stock')}
                                                className="flex items-center justify-center gap-2 mx-auto text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest group hover:text-slate-900 dark:text-slate-100 transition-colors"
                                            >
                                                Stock
                                                {getSortIcon('stock')}
                                            </button>
                                        </th>
                                        <th className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => handleSort('stockMinimo')}
                                                className="flex items-center justify-center gap-2 mx-auto text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest group hover:text-slate-900 dark:text-slate-100 transition-colors"
                                            >
                                                Stock Mín.
                                                {getSortIcon('stockMinimo')}
                                            </button>
                                        </th>
                                        <th className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => handleSort('preco')}
                                                className="flex items-center justify-end gap-2 ml-auto text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest group hover:text-slate-900 dark:text-slate-100 transition-colors"
                                            >
                                                Preço
                                                {getSortIcon('preco')}
                                            </button>
                                        </th>
                                        <th className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => handleSort('estado')}
                                                className="flex items-center justify-center gap-2 mx-auto text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest group hover:text-slate-900 dark:text-slate-100 transition-colors"
                                            >
                                                Estado
                                                {getSortIcon('estado')}
                                            </button>
                                        </th>
                                        {/* Ações OR Selecionar column */}
                                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                            {isSelectionMode ? 'Selecionar' : 'Ações'}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="">
                                    {sortedProdutos.map((produto) => {
                                        const isSelected = selectedIds.includes(produto.id);

                                        return (
                                            <tr
                                                key={produto.id}
                                                onClick={isSelectionMode ? () => toggleSelect(produto.id) : () => setProductToView(produto)}
                                                className={`group transition-all border-b border-slate-100 dark:border-slate-700/50 last:border-b-0 ${
                                                    isSelectionMode
                                                        ? isSelected
                                                            ? 'bg-blue-50 dark:bg-blue-500/10 cursor-pointer'
                                                            : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900/60 cursor-pointer'
                                                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900/50 cursor-pointer'
                                                }`}
                                                style={isSelectionMode && isSelected ? { boxShadow: 'inset 3px 0 0 #3b82f6' } : isSelectionMode ? { boxShadow: 'inset 3px 0 0 transparent' } : {}}
                                            >
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`p-2.5 border shadow-sm rounded-xl transition-colors ${
                                                            isSelected
                                                                ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 text-blue-500'
                                                                : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 group-hover:text-emerald-600 dark:text-emerald-400'
                                                        }`}>
                                                            <Package size={20} />
                                                        </div>
                                                        <div>
                                                            <span className="block font-bold text-slate-900 dark:text-slate-100">{produto.nome}</span>
                                                            {produto.descricao && (
                                                                <span className="text-[11px] text-slate-400 font-medium truncate max-w-[200px] block">{produto.descricao}</span>
                                                            )}
                                                            {produto.fornecedores && produto.fornecedores.length > 0 && (
                                                                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 flex flex-wrap gap-1 items-center">
                                                                    <span className="text-slate-500 dark:text-slate-400">Fornecedores:</span>
                                                                    {produto.fornecedores.map((f, i) => {
                                                                        const isPreferencial = produto.fornecedorPreferencial?.id === f.id;
                                                                        return (
                                                                            <span key={f.id} className={`inline-flex items-center gap-0.5 ${isPreferencial ? 'text-amber-500 font-black' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                                                {isPreferencial && <Star size={10} className="fill-current" />}
                                                                                {f.nome}{i < produto.fornecedores!.length - 1 ? <span className="text-slate-300 font-normal ml-0.5">, </span> : ''}
                                                                            </span>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                                        {produto.categoria || 'Sem categoria'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{produto.stock}</span>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <span className="font-mono font-medium text-slate-400">{produto.stockMinimo}</span>
                                                </td>
                                                <td className="px-6 py-5 text-right font-bold text-slate-900 dark:text-slate-100">
                                                    {produto.preco ? `${produto.preco.toFixed(2)} €` : '0.00 €'}
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex justify-center">
                                                        {produto.stock <= produto.stockMinimo ? (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20">
                                                                <AlertTriangle size={12} className="animate-pulse" />
                                                                CRÍTICO
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
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
                                                                        : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-blue-400 hover:bg-blue-50 dark:bg-blue-500/10'
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
                                                                    className="p-2 text-slate-400 hover:text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-700/50 rounded-lg transition-colors"
                                                                    title="Ações"
                                                                >
                                                                    <MoreVertical size={18} />
                                                                </button>

                                                                {openRowMenuId === produto.id && (
                                                                    <div className="absolute right-0 top-[calc(100%+4px)] w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-40 py-1 animate-in fade-in zoom-in-95 duration-150">
                                                                        {/* Selecionar */}
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); handleRowSelecionar(produto); }}
                                                                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900 transition-colors text-left"
                                                                        >
                                                                            <MousePointer2 size={15} className="text-slate-400 flex-shrink-0" />
                                                                            Selecionar
                                                                        </button>

                                                                        <div className="my-1 border-t border-slate-100 dark:border-slate-700/50" />

                                                                        {/* Editar Produto */}
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); setOpenRowMenuId(null); setProductToEdit(produto); }}
                                                                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900 transition-colors text-left"
                                                                        >
                                                                            <Pencil size={15} className="text-slate-400 flex-shrink-0" />
                                                                            Editar Produto
                                                                        </button>

                                                                        {/* Criar Pedido */}
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); handleRowCriarPedido(produto); }}
                                                                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900 transition-colors text-left"
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
                    <div className="bg-white dark:bg-slate-800 p-16 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 text-slate-400 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                            <Search size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Nenhum produto encontrado</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Tente ajustar os filtros ou a sua pesquisa.</p>
                    </div>
                )
            ) : (
                <div className="bg-white dark:bg-slate-800 p-20 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                        <Package size={48} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Stock Vazio</h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-sm font-medium mb-8">
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

            <DetalhesProdutoModal
                isOpen={!!productToView}
                onClose={() => setProductToView(null)}
                onEdit={() => {
                    const p = productToView;
                    setProductToView(null);
                    if (p) setProductToEdit(p);
                }}
                produto={productToView!}
            />

            <HistoricoStockModal
                isOpen={isHistoricoModalOpen}
                onClose={() => setIsHistoricoModalOpen(false)}
            />
        </div>
    );
};

export default Catalogo;
