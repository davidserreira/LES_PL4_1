import { useState, useEffect } from 'react';
import { Plus, Factory, AlertCircle, CheckCircle2, X, Search, MoreVertical, ArrowUpDown, ArrowUp, ArrowDown, Filter, ChevronDown, Clock, Truck, HandCoins, CalendarDays, Edit, DollarSign, FileText, Database, Package } from 'lucide-react';
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
    // Condições Comerciais
    valorMinimoEncomenda?: number | null;
    prazoMedioEntrega?: number | null;
    custoTransporte?: number | null;
    metodoPagamento?: string | null;
    diasEntrega?: string | null;
}

type SortField = 'id' | 'nome';
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
        let aValue = a[sortField];
        let bValue = b[sortField];

        // Handle string comparison for names
        if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortOrder === 'asc'
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
        }

        // Handle numeric comparison for IDs
        if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
        }

        return 0;
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
        if (sortField !== field) return <ArrowUpDown size={14} className="text-slate-400 group-hover:text-slate-600" />;
        return sortOrder === 'asc'
            ? <ArrowUp size={14} className="text-emerald-600" />
            : <ArrowDown size={14} className="text-emerald-600" />;
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
                    className="fixed w-44 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-[81] animate-in fade-in zoom-in-95 duration-100"
                    style={{ top, left, transform: 'translateY(-50%)' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={() => {
                            setDetalhesFornecedor(fornecedor);
                            setOpenDropdownId(null);
                            setDropdownAnchor(null);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                    >
                        Ver Detalhes
                    </button>
                    <button
                        onClick={() => {
                            setFornecedorAEditar(fornecedor);
                            setOpenDropdownId(null);
                            setDropdownAnchor(null);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                    >
                        Editar Fornecedor
                    </button>
                    <button
                        onClick={() => {
                            setFornecedorAAvaliar({ id: fornecedor.id, nome: fornecedor.nome });
                            setOpenDropdownId(null);
                            setDropdownAnchor(null);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                    >
                        {user?.id && hasMyAvaliacao[fornecedor.id] ? 'Editar avaliação' : 'Avaliar Fornecedor'}
                    </button>
                    <button
                        onClick={() => {
                            handleToggleEstado(fornecedor.id, fornecedor.estado);
                            setOpenDropdownId(null);
                            setDropdownAnchor(null);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${fornecedor.estado ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                    >
                        {fornecedor.estado ? 'Inativar Fornecedor' : 'Ativar Fornecedor'}
                    </button>
                </div>
            </div>,
            document.body
        );
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

            {/* ── Bloco sticky integrado (Layout 2 Blocos) ── */}
            <div className="sticky top-0 z-40 bg-slate-50/90 backdrop-blur-xl border-b border-slate-200/50 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 pt-4 pb-5 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)] transition-all space-y-5 mb-2">
                <div className="space-y-5">
                    {/* Linha 1: Título e Botões de ação lado a lado */}
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Fornecedores</h1>
                            <p className="mt-2 text-sm text-slate-500">
                                Gerencie as entidades fornecedoras da clínica nesta secção.
                            </p>
                        </div>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-black rounded-lg hover:bg-emerald-700 transition-all shadow-md shadow-emerald-500/20 active:scale-95"
                        >
                            <Plus size={18} />
                            Adicionar Fornecedor
                        </button>
                    </div>

                    {/* ── Linha 2: 2 Blocks Separados (Pesquisa + Filtros) ── */}
                    <div className="flex flex-col xl:flex-row gap-4 items-stretch xl:items-center">
                        
                        {/* Search Bar Container */}
                        {fornecedores.length > 0 && (
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/80 p-2 rounded-xl border border-slate-200/60 shadow-sm relative z-10 flex-grow">
                                <div className="relative w-full max-w-md">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Pesquisar por nome, NIF ou contacto..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-transparent border-0 outline-none text-sm placeholder:text-slate-400"
                                    />
                                </div>
                                <div className="text-xs text-slate-500 font-medium px-4 whitespace-nowrap hidden sm:block">
                                    <span className="font-bold text-slate-700">{filteredFornecedores.length}</span> / <span className="font-bold text-slate-700">{fornecedores.length}</span> fornecedores
                                </div>
                            </div>
                        )}

                        {/* Filtros Container */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white/80 p-3 rounded-xl border border-slate-200/60 shadow-sm flex-grow xl:flex-grow-0 relative z-20">
                            <div className="flex items-center gap-2 text-slate-500 font-medium text-sm mr-2 hidden sm:flex">
                                <Filter size={16} />
                                Filtros
                            </div>

                            {/* Status Segmented Control */}
                            <div className="flex p-1 bg-slate-100/50 rounded-lg border border-slate-200/60 w-full sm:w-auto">
                                <button
                                    onClick={() => setFilterStatus('todos')}
                                    className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filterStatus === 'todos' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-600 hover:text-slate-900'} `}
                                >
                                    Todos
                                </button>
                                <button
                                    onClick={() => setFilterStatus('ativos')}
                                    className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filterStatus === 'ativos' ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-600 hover:text-slate-900'} `}
                                >
                                    Ativos
                                </button>
                                <button
                                    onClick={() => setFilterStatus('inativos')}
                                    className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filterStatus === 'inativos' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-600 hover:text-slate-900'} `}
                                >
                                    Inativos
                                </button>
                            </div>

                            <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>

                            {/* Category Dropdown */}
                            <div className="relative min-w-[150px] w-full sm:w-auto">
                                <button
                                    onClick={() => setIsFilterCategoryOpen(!isFilterCategoryOpen)}
                                    className={`w-full flex items-center justify-between gap-2 px-4 py-2 bg-white border rounded-lg text-sm font-medium transition-all ${filterCategoria ? 'border-blue-500 text-blue-700 ring-4 ring-blue-500/10' : 'border-slate-200 text-slate-700 hover:border-slate-300'}`}
                                >
                                    {filterCategoria || 'Todas as Categorias'}
                                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${isFilterCategoryOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isFilterCategoryOpen && (
                                    <div className="absolute top-full right-0 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95">
                                        <button
                                            onClick={() => { setFilterCategoria(''); setIsFilterCategoryOpen(false); }}
                                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${!filterCategoria ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
                                        >
                                            Todas as Categorias
                                        </button>
                                        {CATEGORIES.map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => { setFilterCategoria(cat); setIsFilterCategoryOpen(false); }}
                                                className={`w-full text-left px-4 py-2 text-sm transition-colors ${filterCategoria === cat ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
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
                                    className="ml-auto text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors px-2"
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
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative z-0">
                        <div className="w-full overflow-auto max-h-[calc(100vh-280px)] custom-scrollbar">
                            <table className="w-full text-left border-collapse relative">
                                <thead className="sticky top-0 z-30 bg-slate-50/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
                                    <tr>
                                    <th
                                        onClick={() => handleSort('nome')}
                                        className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest text-left cursor-pointer hover:bg-slate-100 transition-colors group select-none"
                                    >
                                        <div className="flex items-center gap-2">
                                            Fornecedor
                                            {getSortIcon('nome')}
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest text-left">Categoria</th>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest text-left">Contacto</th>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest text-left">Estado</th>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {sortedFornecedores.map((fornecedor) => (
                                    <tr 
                                        key={fornecedor.id} 
                                        onClick={() => setDetalhesFornecedor(fornecedor)}
                                        className="hover:bg-slate-50/80 transition-all group cursor-pointer"
                                    >
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2.5 bg-white border border-slate-100 shadow-sm rounded-xl text-slate-600 group-hover:text-blue-600 transition-colors">
                                                    <Factory size={20} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="block font-bold text-slate-900">{fornecedor.nome}</span>
                                                    <span className="block text-sm font-medium text-slate-500">{fornecedor.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-left">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                                                {fornecedor.categoria}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-left">
                                            <span className="font-medium text-slate-600">
                                                {fornecedor.contacto}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-left">
                                            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${fornecedor.estado ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                                {fornecedor.estado ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-center relative">
                                            <button
                                                onMouseDown={(e) => handleActionMouseDown(fornecedor.id, e)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
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
                    <div className="bg-white p-16 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-slate-50 text-slate-400 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                            <Search size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Nenhum fornecedor encontrado</h3>
                    </div>
                )
            ) : (
                <div className="bg-white p-20 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                        <Factory size={48} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Sem Fornecedores</h3>
                    <p className="text-slate-500 max-w-sm font-medium mb-8">
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
                    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Header Modal - Light Version (Like Stock Details) */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/80">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100">
                                    <Factory size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 leading-tight">
                                        {detalhesFornecedor.nome}
                                    </h2>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200/70 text-slate-600 uppercase tracking-wider">
                                            ID: {detalhesFornecedor.id}
                                        </span>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-500 tracking-wider">
                                            {detalhesFornecedor.categoria}
                                        </span>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-500 tracking-wider">
                                            {detalhesFornecedor.email}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => { setDetalhesFornecedor(null); setActiveTab('geral'); }}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Tabs Header */}
                        <div className="flex border-b border-slate-200 bg-slate-50/80 px-6">
                            <button 
                                className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${activeTab === 'geral' ? 'border-emerald-500 text-emerald-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'}`}
                                onClick={() => setActiveTab('geral')}
                            >
                                Info Geral
                            </button>
                            <button 
                                className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${activeTab === 'condicoes' ? 'border-emerald-500 text-emerald-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'}`}
                                onClick={() => setActiveTab('condicoes')}
                            >
                                Condições de Compra
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 relative custom-scrollbar space-y-6">
                            {activeTab === 'geral' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Card: Identificação */}
                                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                <FileText size={14} /> Identificação
                                            </h3>
                                            <div>
                                                <p className="text-sm text-slate-500 mb-0.5">NIF</p>
                                                <p className="text-xl font-black text-slate-900 font-mono tracking-tight">{detalhesFornecedor.nif}</p>
                                            </div>
                                            <div className="pt-2 border-t border-slate-100">
                                                <p className="text-sm text-slate-500 mb-0.5">Contacto Telefónico</p>
                                                <p className="text-lg font-bold text-slate-700">{detalhesFornecedor.contacto}</p>
                                            </div>
                                        </div>

                                        {/* Card: Ficha de Fornecedor */}
                                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                <Database size={14} /> Ficha de Fornecedor
                                            </h3>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-slate-500 mb-0.5">Tipo de Produtos</p>
                                                    <p className="text-lg font-bold text-slate-900">{detalhesFornecedor.categoria}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-slate-500 mb-0.5">Estado</p>
                                                    {detalhesFornecedor.estado ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                            <CheckCircle2 size={12} />
                                                            ATIVO
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black bg-slate-100 text-slate-600 border border-slate-200">
                                                            <X size={12} />
                                                            INATIVO
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="pt-2 border-t border-slate-100">
                                                <p className="text-sm text-slate-500 mb-0.5">Parceiro Desde</p>
                                                <p className="text-base font-bold text-slate-700">
                                                    {new Date(detalhesFornecedor.criadoEm).toLocaleDateString('pt-PT', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Avaliação */}
                                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                    <AlertCircle size={14} /> Pontuação Média
                                                </h3>
                                                {avaliacaoMedia && avaliacaoMedia.totalAvaliacoes > 0 && (
                                                    <button
                                                        onClick={() => setIsListAvaliacoesOpen(true)}
                                                        className="text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:underline uppercase tracking-wider"
                                                    >
                                                        {avaliacaoMedia.totalAvaliacoes} {avaliacaoMedia.totalAvaliacoes === 1 ? 'avaliação' : 'avaliações'}
                                                    </button>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-2xl font-black text-slate-900">
                                                    {avaliacaoMedia && avaliacaoMedia.totalAvaliacoes > 0 ? `${avaliacaoMedia.media?.toFixed(1)} / 5` : 'N/A'}
                                                </p>
                                                <p className="text-xs font-medium text-slate-500 mt-0.5">classificação global</p>
                                            </div>
                                        </div>

                                        {/* Observações */}
                                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
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
                                                        className="text-[10px] font-bold text-blue-600 hover:text-blue-700 disabled:text-transparent transition-colors uppercase tracking-wider disabled:opacity-50"
                                                    >
                                                        Guardar
                                                    </button>
                                                )}
                                            </div>
                                            <textarea 
                                                value={detalhesFornecedor.observacoes || ''}
                                                onChange={(e) => setDetalhesFornecedor({ ...detalhesFornecedor, observacoes: e.target.value })}
                                                rows={2}
                                                className="w-full flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 outline-none transition-all placeholder:text-slate-400 text-sm resize-none custom-scrollbar text-slate-700"
                                                placeholder="Informação adicional opcional..."
                                            />
                                        </div>
                                    </div>

                                    {/* Produtos Fornecidos */}
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            <Package size={14} /> Produtos Fornecidos
                                        </h3>
                                        {detalhesFornecedor.produtos && detalhesFornecedor.produtos.length > 0 ? (
                                            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                                                {detalhesFornecedor.produtos.map(prod => (
                                                    <div key={prod.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-colors">
                                                        <div>
                                                            <div className="text-sm font-bold text-slate-900 leading-tight">{prod.nome}</div>
                                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{prod.categoria || 'Sem Categoria'}</div>
                                                        </div>
                                                        <div className="text-[10px] font-black text-emerald-600 bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-md uppercase tracking-wider">
                                                            Stock: {prod.stock}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                                                <Package size={32} strokeWidth={1} className="mb-2 text-slate-300" />
                                                <p className="text-sm">Este fornecedor não fornece produtos de inventário.</p>
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
                                                className="px-4 py-2 bg-emerald-50 text-emerald-700 font-bold rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center gap-2 text-sm shadow-sm"
                                            >
                                                <Edit size={16} />
                                                Editar Condições
                                            </button>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Card: Condições Financeiras */}
                                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                <DollarSign size={14} /> Condições Financeiras
                                            </h3>
                                            <div>
                                                <p className="text-sm text-slate-500 mb-0.5">Valor mínimo por encomenda</p>
                                                <p className="text-2xl font-black text-slate-900">
                                                    {detalhesFornecedor.valorMinimoEncomenda != null ? `${Number(detalhesFornecedor.valorMinimoEncomenda).toFixed(2)} €` : '--'}
                                                </p>
                                            </div>
                                            <div className="pt-2 border-t border-slate-100">
                                                <p className="text-sm text-slate-500 mb-0.5">Custo de transporte</p>
                                                <p className="text-lg font-bold text-slate-700">
                                                    {detalhesFornecedor.custoTransporte != null ? `${Number(detalhesFornecedor.custoTransporte).toFixed(2)} €` : '--'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Card: Logística */}
                                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                <Truck size={14} /> Logística
                                            </h3>
                                            <div>
                                                <p className="text-sm text-slate-500 mb-0.5">Prazo médio de entrega</p>
                                                <p className="text-2xl font-black text-slate-900">
                                                    {detalhesFornecedor.prazoMedioEntrega != null ? `${detalhesFornecedor.prazoMedioEntrega} dias` : '--'}
                                                </p>
                                            </div>
                                            <div className="pt-2 border-t border-slate-100">
                                                <p className="text-sm text-slate-500 mb-0.5">Dias de entrega</p>
                                                <p className="text-lg font-bold text-slate-700">
                                                    {detalhesFornecedor.diasEntrega || '--'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Card: Pagamento */}
                                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                <HandCoins size={14} /> Pagamento
                                            </h3>
                                            <div>
                                                <p className="text-sm text-slate-500 mb-0.5">Método de pagamento</p>
                                                <p className="text-xl font-black text-slate-900">
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
