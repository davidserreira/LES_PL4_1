import { useState, useEffect } from 'react';
import { Plus, Factory, AlertCircle, CheckCircle2, X, Search, MoreVertical, ArrowUpDown, ArrowUp, ArrowDown, Filter, ChevronDown, Clock, Truck, HandCoins, CalendarDays, Edit, DollarSign, FileText, Database, Package, Pill, Pencil } from 'lucide-react';
import { fornecedorService } from '../services/fornecedorService';
import CriarFornecedorModal from '../components/CriarFornecedorModal';
import EditarFornecedorModal from '../components/EditarFornecedorModal';
import EditarCondicoesModal from '../components/EditarCondicoesModal';
import AvaliarFornecedorModal from '../components/AvaliarFornecedorModal';
import ListarAvaliacoesFornecedorModal from '../components/ListarAvaliacoesFornecedorModal';
import type { Utilizador } from '../services/utilizadorService';
import { createPortal } from 'react-dom';

interface Fornecedor {
    id: number;
    nome: string;
    nif: string;
    contacto: string;
    email: string;
    estado: boolean;
    categoria: string;
    observacoes?: string;
    criadoEm: string;
    produtos?: {
        id: number;
        nome: string;
        categoria: string;
        stock: number;
    }[];
    precosProdutos?: {
        produtoId: number;
        fornecedorId: number;
        preco: number;
    }[];
    // Condições Comerciais
    valorMinimoEncomenda?: number | null;
    prazoMedioEntrega?: number | null;
    custoTransporte?: number | null;
    metodoPagamento?: string | null;
    diasEntrega?: string | null;
}

type SortField = 'id' | 'nome' | 'categoria' | 'contacto' | 'estado';
type SortOrder = 'asc' | 'desc';

interface Toast {
    message: string;
    type: 'success' | 'error';
}

const Fornecedores = () => {
    const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isListAvaliacoesOpen, setIsListAvaliacoesOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<Toast | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [user] = useState<Utilizador | null>(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [hasMyAvaliacao, setHasMyAvaliacao] = useState<Record<number, boolean>>({});

    // Sorting state
    const [sortField, setSortField] = useState<SortField>('id');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

    // Actions Dropdown & Details state
    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
    const [dropdownAnchor, setDropdownAnchor] = useState<DOMRect | null>(null);
    const [detalhesFornecedor, setDetalhesFornecedor] = useState<Fornecedor | null>(null);
    const [fornecedorAEditar, setFornecedorAEditar] = useState<Fornecedor | null>(null);
    const [fornecedorCondicoesAEditar, setFornecedorCondicoesAEditar] = useState<Fornecedor | null>(null);
    const [fornecedorAAvaliar, setFornecedorAAvaliar] = useState<Pick<Fornecedor, 'id' | 'nome'> | null>(null);
    const [savingObs, setSavingObs] = useState(false);
    const [avaliacaoMedia, setAvaliacaoMedia] = useState<{ media: number | null; totalAvaliacoes: number } | null>(null);
    
    // Tabs in details modal
    const [activeTab, setActiveTab] = useState<'geral' | 'condicoes'>('geral');

    // Filter states
    const [filterStatus, setFilterStatus] = useState<'todos' | 'ativos' | 'inativos'>('todos');
    const [filterCategoria, setFilterCategoria] = useState<string>('');
    const [isFilterCategoryOpen, setIsFilterCategoryOpen] = useState(false);

    // Static Categories (can be imported if centralized)
    const CATEGORIES = ['Medicamentos', 'Vacinas', 'Higiene', 'Equipamento', 'Outros'];

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = () => {
            setOpenDropdownId(null);
            setDropdownAnchor(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredFornecedores = fornecedores.filter((f) => {
        // Text Search
        const query = searchQuery.toLowerCase();
        const matchesSearch =
            f.nome.toLowerCase().includes(query) ||
            f.nif.toLowerCase().includes(query) ||
            f.contacto.toLowerCase().includes(query) ||
            f.email.toLowerCase().includes(query) ||
            f.categoria.toLowerCase().includes(query);

        // Status Filter
        const matchesStatus =
            filterStatus === 'todos' ? true :
                filterStatus === 'ativos' ? f.estado === true :
                    f.estado === false;

        // Category Filter
        const matchesCategory = filterCategoria === '' || f.categoria === filterCategoria;

        return matchesSearch && matchesStatus && matchesCategory;
    });

    const sortedFornecedores = [...filteredFornecedores].sort((a, b) => {
        if (sortField === 'estado') {
            // Ativo (true) vs Inativo (false). We'll treat true as 1, false as 0. Let's make true (Ativo) come first on 'asc'.
            const aEstado = a.estado ? 1 : 0;
            const bEstado = b.estado ? 1 : 0;
            return sortOrder === 'asc' ? bEstado - aEstado : aEstado - bEstado;
        }

        const aValue = a[sortField as keyof Fornecedor];
        const bValue = b[sortField as keyof Fornecedor];

        if (typeof aValue === 'string' || typeof bValue === 'string') {
            const strA = String(aValue || '');
            const strB = String(bValue || '');
            return sortOrder === 'asc'
                ? strA.localeCompare(strB)
                : strB.localeCompare(strA);
        }

        const numA = Number(aValue || 0);
        const numB = Number(bValue || 0);
        return sortOrder === 'asc' ? numA - numB : numB - numA;
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
        if (sortField !== field) return <ArrowUpDown size={14} className="text-slate-400 group-hover:text-slate-600 dark:text-slate-400" />;
        return sortOrder === 'asc'
            ? <ArrowUp size={14} className="text-emerald-600 dark:text-emerald-400" />
            : <ArrowDown size={14} className="text-emerald-600 dark:text-emerald-400" />;
    };

    const handleActionMouseDown = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const willOpen = openDropdownId !== id;
        setOpenDropdownId(willOpen ? id : null);
        setDropdownAnchor(willOpen ? (e.currentTarget as HTMLElement).getBoundingClientRect() : null);

        if (willOpen && user?.id && hasMyAvaliacao[id] === undefined) {
            try {
                const existing = await fornecedorService.getMinhaAvaliacao(id, user.id);
                setHasMyAvaliacao(prev => ({ ...prev, [id]: Boolean(existing) }));
            } catch {
                // fallback: keep default label
            }
        }
    };

    const renderActionsDropdown = (fornecedor: Fornecedor) => {
        if (openDropdownId !== fornecedor.id || !dropdownAnchor) return null;

        const menuWidth = 176; // w-44
        const top = dropdownAnchor.top + dropdownAnchor.height / 2;
        const left = Math.max(12, dropdownAnchor.right - menuWidth - 8);

        return createPortal(
            <div
                onMouseDown={(e) => e.stopPropagation()}
                className="fixed inset-0 z-[80]"
            >
                <div
                    className="absolute inset-0"
                    onMouseDown={() => {
                        setOpenDropdownId(null);
                        setDropdownAnchor(null);
                    }}
                />
                <div
                    className="fixed w-44 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700/50 py-1.5 z-[81] animate-in fade-in zoom-in-95 duration-100"
                    style={{ top, left, transform: 'translateY(-50%)' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={() => {
                            setDetalhesFornecedor(fornecedor);
                            setOpenDropdownId(null);
                            setDropdownAnchor(null);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900 hover:text-blue-600 dark:text-blue-400 transition-colors"
                    >
                        Ver Detalhes
                    </button>
                    {user?.role === 'ADMINISTRADOR' && (
                        <button
                            onClick={() => {
                                setFornecedorAEditar(fornecedor);
                                setOpenDropdownId(null);
                                setDropdownAnchor(null);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900 hover:text-blue-600 dark:text-blue-400 transition-colors"
                        >
                            Editar Fornecedor
                        </button>
                    )}
                    <button
                        onClick={() => {
                            setFornecedorAAvaliar({ id: fornecedor.id, nome: fornecedor.nome });
                            setOpenDropdownId(null);
                            setDropdownAnchor(null);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900 hover:text-blue-600 dark:text-blue-400 transition-colors"
                    >
                        {user?.id && hasMyAvaliacao[fornecedor.id] ? 'Editar avaliação' : 'Avaliar Fornecedor'}
                    </button>
                    <button
                        onClick={() => {
                            handleToggleEstado(fornecedor.id, fornecedor.estado);
                            setOpenDropdownId(null);
                            setDropdownAnchor(null);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${fornecedor.estado ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:bg-red-500/10' : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:bg-emerald-500/10'}`}
                    >
                        {fornecedor.estado ? 'Inativar Fornecedor' : 'Ativar Fornecedor'}
                    </button>
                </div>
            </div>,
            document.body
        );
    };

    const handleEditFromDetalhes = () => {
        if (!detalhesFornecedor) return;
        const fornecedor = detalhesFornecedor;
        setDetalhesFornecedor(null);
        setActiveTab('geral');
        setFornecedorAEditar(fornecedor);
    };

    const handleToggleEstado = async (id: number, currentEstado: boolean) => {
        try {
            await fornecedorService.toggleEstado(id);
            setFornecedores(fornecedores.map(f => f.id === id ? { ...f, estado: !f.estado } : f));
            showToast(`Fornecedor ${currentEstado ? 'inativado' : 'ativado'} com sucesso!`, 'success');
            setOpenDropdownId(null);
        } catch (error) {
            showToast('Erro ao alterar o estado do fornecedor.', 'error');
        }
    };

    const handleSaveObservacoes = async (id: number) => {
        if (!detalhesFornecedor) return;
        try {
            setSavingObs(true);
            await fornecedorService.updateObservacoes(id, detalhesFornecedor.observacoes || '');
            setFornecedores(fornecedores.map(f => f.id === id ? { ...f, observacoes: detalhesFornecedor.observacoes } : f));
            showToast('Observações guardadas com sucesso!', 'success');
        } catch (error) {
            showToast('Erro ao guardar observações.', 'error');
        } finally {
            setSavingObs(false);
        }
    };

    const handleUpdatePreco = async (produtoId: number, novoPreco: string) => {
        if (!detalhesFornecedor) return;
        const precoNum = parseFloat(novoPreco);
        if (isNaN(precoNum)) return;

        try {
            await fornecedorService.updateProdutoPreco(detalhesFornecedor.id, produtoId, precoNum);
            
            // Atualizar estado local do modal
            const updatedPrecos = detalhesFornecedor.precosProdutos?.map(p => 
                p.produtoId === produtoId ? { ...p, preco: precoNum } : p
            ) || [];
            
            if (!detalhesFornecedor.precosProdutos?.some(p => p.produtoId === produtoId)) {
                updatedPrecos.push({ produtoId, fornecedorId: detalhesFornecedor.id, preco: precoNum });
            }

            setDetalhesFornecedor({
                ...detalhesFornecedor,
                precosProdutos: updatedPrecos
            });

            // Atualizar também na lista principal
            setFornecedores(fornecedores.map(f => 
                f.id === detalhesFornecedor.id 
                ? { ...f, precosProdutos: updatedPrecos } 
                : f
            ));

            showToast('Preço acordado atualizado!', 'success');
        } catch (error) {
            showToast('Erro ao atualizar preço.', 'error');
        }
    };

    const fetchFornecedores = async () => {
        try {
            setLoading(true);
            const data = await fornecedorService.getAll();
            setFornecedores(data);
        } catch (error) {
            console.error('Erro ao buscar fornecedores:', error);
            showToast('Erro ao carregar os fornecedores.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        fetchFornecedores();
    }, []);

    useEffect(() => {
        if (!detalhesFornecedor) {
            setAvaliacaoMedia(null);
            return;
        }

        let cancelled = false;
        (async () => {
            try {
                const data = await fornecedorService.getAvaliacaoMedia(detalhesFornecedor.id);
                if (!cancelled) setAvaliacaoMedia(data);
            } catch {
                if (!cancelled) setAvaliacaoMedia(null);
            }
        })();

        return () => { cancelled = true; };
    }, [detalhesFornecedor?.id]);

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
                        <Factory className="text-emerald-600 dark:text-emerald-400" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-slate-200 tracking-tight">Fornecedores</h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">Gerencie as entidades fornecedoras da clínica nesta secção.</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all text-sm font-bold focus:ring-2 focus:ring-emerald-500/50 active:scale-95"
                    >
                        <Plus size={18} />
                        Adicionar Fornecedor
                    </button>
                </div>
            </div>

            {/* ── Bloco sticky integrado (Layout Filtros) ── */}
            <div className="sticky top-0 z-40 bg-slate-50 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700/50 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 pt-4 pb-4 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)] transition-all mb-2">
                <div className="space-y-5">
                    {/* ── Linha 2: 2 Blocks Separados (Pesquisa + Filtros) ── */}
                    <div className="flex flex-col xl:flex-row gap-4 items-stretch xl:items-center">
                        
                        {/* Search Bar Container */}
                        {fornecedores.length > 0 && (
                            <label className="flex flex-row justify-between items-center gap-4 bg-white dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm relative z-10 flex-grow cursor-text">
                                <div className="relative flex-1 min-w-0">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Pesquisar por nome, NIF ou contacto..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-transparent border-0 outline-none text-sm placeholder:text-slate-400"
                                    />
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium px-4 whitespace-nowrap hidden sm:block">
                                    <span className="font-bold text-slate-700 dark:text-slate-300">{filteredFornecedores.length}</span> / <span className="font-bold text-slate-700 dark:text-slate-300">{fornecedores.length}</span> fornecedores
                                </div>
                            </label>
                        )}

                        {/* Filtros Container */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm flex-grow xl:flex-grow-0 relative z-20">
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium text-sm mr-2 hidden sm:flex">
                                <Filter size={16} />
                                Filtros
                            </div>

                            {/* Status Segmented Control */}
                            <div className="flex p-1 bg-slate-100 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-700/60 w-full sm:w-auto">
                                <button
                                    onClick={() => setFilterStatus('todos')}
                                    className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filterStatus === 'todos' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-700/50' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100'} `}
                                >
                                    Todos
                                </button>
                                <button
                                    onClick={() => setFilterStatus('ativos')}
                                    className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filterStatus === 'ativos' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-700/50' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100'} `}
                                >
                                    Ativos
                                </button>
                                <button
                                    onClick={() => setFilterStatus('inativos')}
                                    className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filterStatus === 'inativos' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-700/50' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100'} `}
                                >
                                    Inativos
                                </button>
                            </div>

                            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>

                            {/* Category Dropdown */}
                            <div className="relative min-w-[150px] w-full sm:w-auto">
                                <button
                                    onClick={() => setIsFilterCategoryOpen(!isFilterCategoryOpen)}
                                    className={`w-full flex items-center justify-between gap-2 px-4 py-2 bg-white dark:bg-slate-800 border rounded-lg text-sm font-medium transition-all ${filterCategoria ? 'border-blue-500 text-blue-700 ring-4 ring-blue-500/10' : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:border-slate-600'}`}
                                >
                                    {filterCategoria || 'Todas as Categorias'}
                                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${isFilterCategoryOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isFilterCategoryOpen && (
                                    <div className="absolute top-full right-0 mt-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95">
                                        <button
                                            onClick={() => { setFilterCategoria(''); setIsFilterCategoryOpen(false); }}
                                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${!filterCategoria ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900'}`}
                                        >
                                            Todas as Categorias
                                        </button>
                                        {CATEGORIES.map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => { setFilterCategoria(cat); setIsFilterCategoryOpen(false); }}
                                                className={`w-full text-left px-4 py-2 text-sm transition-colors ${filterCategoria === cat ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900'}`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Clear Filters */}
                            {(filterStatus !== 'todos' || filterCategoria !== '' || searchQuery !== '') && (
                                <button
                                    onClick={() => { setFilterStatus('todos'); setFilterCategoria(''); setSearchQuery(''); }}
                                    className="ml-auto text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 transition-colors px-2"
                                >
                                    Limpar
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : fornecedores.length > 0 ? (
                filteredFornecedores.length > 0 ? (
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden relative z-0">
                        <div className="w-full overflow-auto max-h-[calc(100vh-280px)] custom-scrollbar">
                            <table className="w-full text-left border-collapse relative">
                                <thead className="sticky top-0 z-30 bg-slate-50 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 shadow-sm">
                                    <tr>
                                    <th
                                        onClick={() => handleSort('nome')}
                                        className="px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-left cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-700/50 transition-colors group select-none"
                                    >
                                        <div className="flex items-center gap-2">
                                            Fornecedor
                                            {getSortIcon('nome')}
                                        </div>
                                    </th>
                                    <th
                                        onClick={() => handleSort('categoria')}
                                        className="px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-left cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-700/50 transition-colors group select-none"
                                    >
                                        <div className="flex items-center gap-2">
                                            Categoria
                                            {getSortIcon('categoria')}
                                        </div>
                                    </th>
                                    <th
                                        onClick={() => handleSort('contacto')}
                                        className="px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-left cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-700/50 transition-colors group select-none"
                                    >
                                        <div className="flex items-center gap-2">
                                            Contacto
                                            {getSortIcon('contacto')}
                                        </div>
                                    </th>
                                    <th
                                        onClick={() => handleSort('estado')}
                                        className="px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-left cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-700/50 transition-colors group select-none"
                                    >
                                        <div className="flex items-center gap-2">
                                            Estado
                                            {getSortIcon('estado')}
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="">
                                {sortedFornecedores.map((fornecedor) => (
                                    <tr 
                                        key={fornecedor.id} 
                                        onClick={() => setDetalhesFornecedor(fornecedor)}
                                        className="hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900/80 transition-all group cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-b-0"
                                    >
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 shadow-sm rounded-xl text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:text-blue-400 transition-colors">
                                                    <Factory size={20} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="block font-bold text-slate-900 dark:text-slate-100">{fornecedor.nome}</span>
                                                    <span className="block text-sm font-medium text-slate-500 dark:text-slate-400">{fornecedor.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-left">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400">
                                                {fornecedor.categoria}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-left">
                                            <span className="font-medium text-slate-600 dark:text-slate-400">
                                                {fornecedor.contacto}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-left">
                                            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${fornecedor.estado ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 border-emerald-100 dark:border-emerald-500/20' : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>
                                                {fornecedor.estado ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-center relative">
                                            <button
                                                onMouseDown={(e) => handleActionMouseDown(fornecedor.id, e)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="p-2 text-slate-400 hover:text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-700/50 rounded-lg transition-colors"
                                            >
                                                <MoreVertical size={18} />
                                            </button>

                                            {renderActionsDropdown(fornecedor)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-800 p-16 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 text-slate-400 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                            <Search size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Nenhum fornecedor encontrado</h3>
                    </div>
                )
            ) : (
                <div className="bg-white dark:bg-slate-800 p-20 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                        <Factory size={48} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Sem Fornecedores</h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-sm font-medium mb-8">
                        Ainda não existem fornecedores registados no sistema. Comece por adicionar o seu primeiro fornecedor.
                    </p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all hover:shadow-xl active:scale-95"
                    >
                        <Plus size={20} />
                        Criar Primeiro Fornecedor
                    </button>
                </div>
            )}

            <CriarFornecedorModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    fetchFornecedores();
                    showToast('Fornecedor registado com sucesso!', 'success');
                }}
            />

            <EditarFornecedorModal
                isOpen={fornecedorAEditar !== null}
                fornecedor={fornecedorAEditar}
                onClose={() => setFornecedorAEditar(null)}
                onSuccess={() => {
                    fetchFornecedores();
                    showToast('Fornecedor atualizado com sucesso!', 'success');
                }}
            />

            <EditarCondicoesModal
                isOpen={fornecedorCondicoesAEditar !== null}
                fornecedor={fornecedorCondicoesAEditar}
                onClose={() => setFornecedorCondicoesAEditar(null)}
                onSuccess={() => {
                    if (detalhesFornecedor) {
                        // Immediately reload the supplier from the updated list or fetch it
                        fetchFornecedores();
                        // Also, we can close the details modal or fetch its new details
                        setDetalhesFornecedor(null);
                        setActiveTab('geral');
                    }
                    showToast('Condições de Compra atualizadas com sucesso!', 'success');
                }}
            />

            <AvaliarFornecedorModal
                isOpen={fornecedorAAvaliar !== null}
                fornecedor={fornecedorAAvaliar}
                utilizadorId={user?.id ?? null}
                onClose={() => setFornecedorAAvaliar(null)}
                onSuccess={(updated) => {
                    if (fornecedorAAvaliar?.id) {
                        setHasMyAvaliacao(prev => ({ ...prev, [fornecedorAAvaliar.id]: true }));
                    }
                    showToast(updated ? 'Avaliação atualizada com sucesso!' : 'Avaliação registada com sucesso!', 'success');
                }}
            />

            {/* Detalhes do Fornecedor Modal */}
            {detalhesFornecedor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDetalhesFornecedor(null)} />
                    <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Header Modal - Light Version (Like Stock Details) */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/80">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100">
                                    <Factory size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
                                        {detalhesFornecedor.nome}
                                    </h2>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 dark:bg-slate-700/70 text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                            ID: {detalhesFornecedor.id}
                                        </span>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 tracking-wider">
                                            {detalhesFornecedor.categoria}
                                        </span>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 tracking-wider">
                                            {detalhesFornecedor.email}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                {user?.role === 'ADMINISTRADOR' && (
                                    <button
                                        type="button"
                                        onClick={handleEditFromDetalhes}
                                        className="p-2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
                                        title="Editar fornecedor"
                                    >
                                        <Pencil size={18} />
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => { setDetalhesFornecedor(null); setActiveTab('geral'); }}
                                    className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:bg-slate-700 rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Tabs Header */}
                        <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/80 px-6">
                            <button 
                                className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${activeTab === 'geral' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-800' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-700/50'}`}
                                onClick={() => setActiveTab('geral')}
                            >
                                Info Geral
                            </button>
                            <button 
                                className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${activeTab === 'condicoes' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-800' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-700/50'}`}
                                onClick={() => setActiveTab('condicoes')}
                            >
                                Condições de Compra
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900 relative custom-scrollbar space-y-6">
                            {activeTab === 'geral' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Card: Identificação */}
                                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                <FileText size={14} /> Identificação
                                            </h3>
                                            <div>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-0.5">NIF</p>
                                                <p className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono tracking-tight">{detalhesFornecedor.nif}</p>
                                            </div>
                                            <div className="pt-2 border-t border-slate-100 dark:border-slate-700/50">
                                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-0.5">Contacto Telefónico</p>
                                                <p className="text-lg font-bold text-slate-700 dark:text-slate-300">{detalhesFornecedor.contacto}</p>
                                            </div>
                                        </div>

                                        {/* Card: Ficha de Fornecedor */}
                                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                <Database size={14} /> Ficha de Fornecedor
                                            </h3>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-0.5">Tipo de Produtos</p>
                                                    <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{detalhesFornecedor.categoria}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-0.5">Estado</p>
                                                    {detalhesFornecedor.estado ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
                                                            <CheckCircle2 size={12} />
                                                            ATIVO
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                                            <X size={12} />
                                                            INATIVO
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="pt-2 border-t border-slate-100 dark:border-slate-700/50">
                                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-0.5">Parceiro Desde</p>
                                                <p className="text-base font-bold text-slate-700 dark:text-slate-300">
                                                    {new Date(detalhesFornecedor.criadoEm).toLocaleDateString('pt-PT', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Avaliação */}
                                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                    <AlertCircle size={14} /> Pontuação Média
                                                </h3>
                                                {avaliacaoMedia && avaliacaoMedia.totalAvaliacoes > 0 && (
                                                    <button
                                                        onClick={() => setIsListAvaliacoesOpen(true)}
                                                        className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline uppercase tracking-wider"
                                                    >
                                                        {avaliacaoMedia.totalAvaliacoes} {avaliacaoMedia.totalAvaliacoes === 1 ? 'avaliação' : 'avaliações'}
                                                    </button>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
                                                    {avaliacaoMedia && avaliacaoMedia.totalAvaliacoes > 0 ? `${avaliacaoMedia.media?.toFixed(1)} / 5` : 'N/A'}
                                                </p>
                                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">classificação global</p>
                                            </div>
                                        </div>

                                        {/* Observações */}
                                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
                                            <div className="flex justify-between items-center mb-2">
                                                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                    <FileText size={14} /> Observações
                                                </h3>
                                                {savingObs ? (
                                                    <span className="text-[10px] font-bold text-slate-400 animate-pulse uppercase tracking-wider">A GUARDAR...</span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleSaveObservacoes(detalhesFornecedor.id)}
                                                        disabled={detalhesFornecedor.observacoes === (detalhesFornecedor.observacoes || '') && false /* Wait! Previous code used detalhesFornecedor.observacoes, the old logic was: onChange={(e) => setDetalhesFornecedor({ ...detalhesFornecedor, observacoes: e.target.value })} */}
                                                        className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 disabled:text-transparent transition-colors uppercase tracking-wider disabled:opacity-50"
                                                    >
                                                        Guardar
                                                    </button>
                                                )}
                                            </div>
                                            <textarea 
                                                value={detalhesFornecedor.observacoes || ''}
                                                onChange={(e) => setDetalhesFornecedor({ ...detalhesFornecedor, observacoes: e.target.value })}
                                                rows={2}
                                                className="w-full flex-1 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 outline-none transition-all placeholder:text-slate-400 text-sm resize-none custom-scrollbar text-slate-700 dark:text-slate-300"
                                                placeholder="Informação adicional opcional..."
                                            />
                                        </div>
                                    </div>

                                    {/* Produtos Fornecidos */}
                                    <div className="relative overflow-hidden rounded-2xl border border-indigo-100/90 bg-gradient-to-br from-white via-indigo-50/30 to-violet-50/40 p-4 shadow-sm ring-1 ring-indigo-500/[0.06]">
                                        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-indigo-400/10 blur-2xl" />
                                        <div className="pointer-events-none absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-violet-400/10 blur-2xl" />
                                        <div className="relative flex flex-wrap items-center justify-between gap-3">
                                            <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-900/70 flex items-center gap-2">
                                                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white dark:bg-slate-800 shadow-sm ring-1 ring-indigo-100 text-indigo-600">
                                                    <Pill size={16} strokeWidth={2} />
                                                </span>
                                                Medicamentos e produtos
                                            </h3>
                                            {detalhesFornecedor.produtos && detalhesFornecedor.produtos.length > 0 && (
                                                <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200/80 bg-white dark:bg-slate-800/80 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-indigo-700 shadow-sm backdrop-blur-sm">
                                                    <Package size={12} className="text-indigo-500" />
                                                    {detalhesFornecedor.produtos.length}{' '}
                                                    {detalhesFornecedor.produtos.length === 1 ? 'artigo' : 'artigos'}
                                                </span>
                                            )}
                                        </div>
                                        {detalhesFornecedor.produtos && detalhesFornecedor.produtos.length > 0 ? (
                                            <div className="relative mt-4 space-y-2 max-h-[min(22rem,50vh)] overflow-y-auto custom-scrollbar pr-1">
                                                {detalhesFornecedor.produtos.map((prod) => {
                                                    const precoObj = detalhesFornecedor.precosProdutos?.find(p => p.produtoId === prod.id);
                                                    const currentPreco = precoObj ? precoObj.preco : 0;
                                                    const stockNum = Number(prod.stock);
                                                    const stockLow = stockNum <= 0;

                                                    return (
                                                        <div
                                                            key={prod.id}
                                                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-300 transition-all group"
                                                        >
                                                            <div className="flex items-center gap-4 flex-1">
                                                                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                                                                    <Pill size={20} />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                                                                        {prod.nome}
                                                                    </h4>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                                            {prod.categoria || 'Sem categoria'}
                                                                        </span>
                                                                        <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${stockLow ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700'}`}>
                                                                            {stockLow ? 'Sem Stock' : `${stockNum} un.`}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 p-1.5 rounded-lg border border-slate-100 dark:border-slate-700/50 group-hover:border-indigo-100 group-hover:bg-indigo-50/30 transition-colors">
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Preço:</span>
                                                                <div className="relative w-28">
                                                                    <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                                                                    <input
                                                                        type="number"
                                                                        step="0.01"
                                                                        defaultValue={currentPreco}
                                                                        onBlur={(e) => {
                                                                            if (parseFloat(e.target.value) !== currentPreco) {
                                                                                handleUpdatePreco(prod.id, e.target.value);
                                                                            }
                                                                        }}
                                                                        className="w-full pl-6 pr-2 py-1 text-sm font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="relative mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-indigo-200/70 bg-white dark:bg-slate-800/50 py-10 text-center">
                                                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-300 ring-4 ring-indigo-100/80">
                                                    <Package size={28} strokeWidth={1.25} />
                                                </div>
                                                <p className="max-w-xs text-sm font-medium text-slate-600 dark:text-slate-400">
                                                    Ainda não há medicamentos ou produtos associados a este fornecedor.
                                                </p>
                                                <p className="mt-1 max-w-xs text-xs text-slate-400">
                                                    Edite o fornecedor para ligar artigos do inventário.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'condicoes' && (
                                <div className="space-y-4">
                                    {/* Action Bar */}
                                    {user && (user.role === 'ADMINISTRADOR' || user.role === 'RESPONSAVEL_FINANCEIRO') && (
                                        <div className="flex justify-end pb-2">
                                            <button 
                                                onClick={() => setFornecedorCondicoesAEditar(detalhesFornecedor)}
                                                className="px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 font-bold rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center gap-2 text-sm shadow-sm"
                                            >
                                                <Edit size={16} />
                                                Editar Condições
                                            </button>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Card: Condições Financeiras */}
                                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                <DollarSign size={14} /> Condições Financeiras
                                            </h3>
                                            <div>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-0.5">Valor mínimo por encomenda</p>
                                                <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
                                                    {detalhesFornecedor.valorMinimoEncomenda != null ? `${Number(detalhesFornecedor.valorMinimoEncomenda).toFixed(2)} €` : '--'}
                                                </p>
                                            </div>
                                            <div className="pt-2 border-t border-slate-100 dark:border-slate-700/50">
                                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-0.5">Custo de transporte</p>
                                                <p className="text-lg font-bold text-slate-700 dark:text-slate-300">
                                                    {detalhesFornecedor.custoTransporte != null ? `${Number(detalhesFornecedor.custoTransporte).toFixed(2)} €` : '--'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Card: Logística */}
                                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                <Truck size={14} /> Logística
                                            </h3>
                                            <div>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-0.5">Prazo médio de entrega</p>
                                                <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
                                                    {detalhesFornecedor.prazoMedioEntrega != null ? `${detalhesFornecedor.prazoMedioEntrega} dias` : '--'}
                                                </p>
                                            </div>
                                            <div className="pt-2 border-t border-slate-100 dark:border-slate-700/50">
                                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-0.5">Dias de entrega</p>
                                                <p className="text-lg font-bold text-slate-700 dark:text-slate-300">
                                                    {detalhesFornecedor.diasEntrega || '--'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Card: Pagamento */}
                                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                <HandCoins size={14} /> Pagamento
                                            </h3>
                                            <div>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-0.5">Método de pagamento</p>
                                                <p className="text-xl font-black text-slate-900 dark:text-slate-100">
                                                    {detalhesFornecedor.metodoPagamento || '--'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {detalhesFornecedor && (
                <ListarAvaliacoesFornecedorModal
                    isOpen={isListAvaliacoesOpen}
                    onClose={() => setIsListAvaliacoesOpen(false)}
                    fornecedorId={detalhesFornecedor.id}
                    fornecedorNome={detalhesFornecedor.nome}
                />
            )}
        </div>
    );
};

export default Fornecedores;
