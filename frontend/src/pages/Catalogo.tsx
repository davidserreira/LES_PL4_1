import { useState, useEffect } from 'react';
import { 
    Plus, Package, AlertTriangle, CheckCircle2, Trash2, X, AlertCircle, 
    Search, Filter, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown 
} from 'lucide-react';
import { produtoService } from '../services/produtoService';
import CriarProdutoModal from '../components/CriarProdutoModal';

interface Produto {
    id: number;
    nome: string;
    stock: number;
    stockMinimo: number;
    preco?: number;
    categoria?: string;
    descricao?: string;
    criadoEm: string;
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
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<Toast | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Sorting state
    const [sortField, setSortField] = useState<SortField>('nome');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

    // Filter states
    const [filterCategory, setFilterCategory] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<'todos' | 'estavel' | 'critico'>('todos');
    const [isFilterCategoryOpen, setIsFilterCategoryOpen] = useState(false);

    // Delete Confirmation state
    const [productToDelete, setProductToDelete] = useState<Produto | null>(null);

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

    const handleDelete = async () => {
        if (!productToDelete) return;
        try {
            await produtoService.delete(productToDelete.id);
            showToast(`Produto "${productToDelete.nome}" eliminado com sucesso.`, 'success');
            setProductToDelete(null);
            fetchProdutos();
        } catch (error) {
            console.error('Erro ao eliminar produto:', error);
            showToast('Erro ao eliminar o produto. Tente novamente.', 'error');
        }
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

            {/* Delete Confirmation Modal */}
            {productToDelete && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                    <div 
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300" 
                        onClick={() => setProductToDelete(null)} 
                    />
                    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center shrink-0 border border-red-100">
                                    <Trash2 size={22} className="text-red-600" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-bold text-slate-900">Eliminar Produto</h3>
                                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                                        Tem a certeza que deseja eliminar <span className="text-slate-900 font-bold">"{productToDelete.nome}"</span>? Esta ação é irreversível.
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setProductToDelete(null)}
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

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Catálogo</h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Gerencie os produtos do catálogo nesta secção.
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                >
                    <Plus size={18} />
                    Adicionar Produto
                </button>
            </div>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative z-20">
                <div className="flex items-center gap-2 text-slate-500 font-medium text-sm mr-2">
                    <Filter size={16} />
                    Filtros:
                </div>

                {/* Status Filter */}
                <div className="flex p-1 bg-slate-100/50 rounded-lg border border-slate-200/60">
                    <button
                        onClick={() => setFilterStatus('todos')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filterStatus === 'todos' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-600 hover:text-slate-900'} `}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setFilterStatus('estavel')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filterStatus === 'estavel' ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-600 hover:text-slate-900'} `}
                    >
                        Estável
                    </button>
                    <button
                        onClick={() => setFilterStatus('critico')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filterStatus === 'critico' ? 'bg-white text-amber-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-600 hover:text-slate-900'} `}
                    >
                        Crítico
                    </button>
                </div>

                <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>

                {/* Category Dropdown */}
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
                            <button
                                onClick={() => { setFilterCategory(''); setIsFilterCategoryOpen(false); }}
                                className={`w-full text-left px-4 py-2 text-sm transition-colors ${!filterCategory ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
                            >
                                Todas as Categorias
                            </button>
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => { setFilterCategory(cat); setIsFilterCategoryOpen(false); }}
                                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${filterCategory === cat ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Clear Filters */}
                {(filterStatus !== 'todos' || filterCategory !== '' || searchQuery !== '') && (
                    <button
                        onClick={() => { setFilterStatus('todos'); setFilterCategory(''); setSearchQuery(''); }}
                        className="ml-auto text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors px-2"
                    >
                        Limpar filtros
                    </button>
                )}
            </div>

            {produtos.length > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm relative z-10">
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
                                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {sortedProdutos.map((produto) => (
                                        <tr key={produto.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2.5 bg-white border border-slate-100 shadow-sm rounded-xl text-slate-600 group-hover:text-emerald-600 transition-colors">
                                                        <Package size={20} />
                                                    </div>
                                                    <div>
                                                        <span className="block font-bold text-slate-900">{produto.nome}</span>
                                                        {produto.descricao && (
                                                            <span className="text-[11px] text-slate-400 font-medium truncate max-w-[200px] block">{produto.descricao}</span>
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
                                                <div className="flex justify-center">
                                                    <button
                                                        onClick={() => setProductToDelete(produto)}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Eliminar produto"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
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
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Catálogo Vazio</h3>
                    <p className="text-slate-500 max-w-sm font-medium mb-8">
                        O catálogo está atualmente sem produtos. Comece por adicionar os itens essenciais para a sua clínica.
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

            <CriarProdutoModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    fetchProdutos();
                    showToast('Produto registado com sucesso!', 'success');
                }}
            />
        </div>
    );
};

export default Catalogo;
