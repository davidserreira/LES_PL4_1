import { useState, useEffect } from 'react';
import { Plus, Factory, AlertCircle, CheckCircle2, X, Search, MoreVertical, ArrowUpDown, ArrowUp, ArrowDown, Filter, ChevronDown } from 'lucide-react';
import { fornecedorService } from '../services/fornecedorService';
import CriarFornecedorModal from '../components/CriarFornecedorModal';
import EditarFornecedorModal from '../components/EditarFornecedorModal';
import AvaliarFornecedorModal from '../components/AvaliarFornecedorModal';

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
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<Toast | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Sorting state
    const [sortField, setSortField] = useState<SortField>('id');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

    // Actions Dropdown & Details state
    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
    const [detalhesFornecedor, setDetalhesFornecedor] = useState<Fornecedor | null>(null);
    const [fornecedorAEditar, setFornecedorAEditar] = useState<Fornecedor | null>(null);
    const [fornecedorAAvaliar, setFornecedorAAvaliar] = useState<Pick<Fornecedor, 'id' | 'nome'> | null>(null);
    const [savingObs, setSavingObs] = useState(false);
    const [avaliacaoMedia, setAvaliacaoMedia] = useState<{ media: number | null; totalAvaliacoes: number } | null>(null);

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

    const handleActionMouseDown = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setOpenDropdownId(openDropdownId === id ? null : id);
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

            {/* Sticky Integrated Header Area */}
            <div className="sticky top-0 z-40 bg-slate-50/90 backdrop-blur-xl border-b border-slate-200/50 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 pt-4 pb-5 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)] transition-all space-y-5 mb-2">
                
                {/* 1. Header Row */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Fornecedores</h1>
                        <p className="mt-1 text-sm text-slate-500 hidden sm:block">
                            Gerencie as entidades fornecedoras da clínica nesta secção.
                        </p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 shadow-sm hover:shadow-md hover:shadow-emerald-600/20 transition-all active:scale-95 ml-auto"
                    >
                        <Plus size={20} />
                        <span className="hidden sm:inline">Adicionar Fornecedor</span>
                        <span className="sm:hidden">Adicionar</span>
                    </button>
                </div>

                {/* 2. Unified Controls Array (Filters + Search) */}
                <div className="flex flex-col xl:flex-row gap-4 items-stretch xl:items-center">
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
                        <div className="relative min-w-[180px] w-full sm:w-auto">
                            <button
                                onClick={() => setIsFilterCategoryOpen(!isFilterCategoryOpen)}
                                className={`w-full flex items-center justify-between gap-2 px-4 py-2 bg-white border rounded-lg text-sm font-medium transition-all ${filterCategoria ? 'border-blue-500 text-blue-700 ring-4 ring-blue-500/10' : 'border-slate-200 text-slate-700 hover:border-slate-300'}`}
                            >
                                {filterCategoria || 'Todas as Categorias'}
                                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isFilterCategoryOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isFilterCategoryOpen && (
                                <div className="absolute top-full left-0 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95">
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
                        {(filterStatus !== 'todos' || filterCategoria !== '') && (
                            <button
                                onClick={() => { setFilterStatus('todos'); setFilterCategoria(''); setSearchQuery(''); }}
                                className="ml-auto text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors px-2"
                            >
                                Limpar
                            </button>
                        )}
                    </div>

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
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : fornecedores.length > 0 ? (
                filteredFornecedores.length > 0 ? (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-visible">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th
                                        onClick={() => handleSort('nome')}
                                        className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-left cursor-pointer hover:bg-slate-100 transition-colors group select-none"
                                    >
                                        <div className="flex items-center gap-2">
                                            Fornecedor
                                            {getSortIcon('nome')}
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-left">Categoria</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-left">Contacto</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-left">Estado</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {sortedFornecedores.map((fornecedor) => (
                                    <tr key={fornecedor.id} className="hover:bg-slate-50/80 transition-all group">
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
                                            <span className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-bold border ${fornecedor.estado ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                                {fornecedor.estado ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-center relative">
                                            <button
                                                onMouseDown={(e) => handleActionMouseDown(fornecedor.id, e)}
                                                className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                                            >
                                                <MoreVertical size={18} />
                                            </button>

                                            {/* Dropdown Menu */}
                                            {openDropdownId === fornecedor.id && (
                                                <div
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                    className="absolute right-10 top-1/2 -translate-y-1/2 w-44 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-20 animate-in fade-in zoom-in-95 duration-100"
                                                >
                                                    <button
                                                        onClick={() => {
                                                            setDetalhesFornecedor(fornecedor);
                                                            setOpenDropdownId(null);
                                                        }}
                                                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                                                    >
                                                        Ver Detalhes
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setFornecedorAEditar(fornecedor);
                                                            setOpenDropdownId(null);
                                                        }}
                                                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                                                    >
                                                        Editar Fornecedor
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setFornecedorAAvaliar({ id: fornecedor.id, nome: fornecedor.nome });
                                                            setOpenDropdownId(null);
                                                        }}
                                                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                                                    >
                                                        Avaliar Fornecedor
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleEstado(fornecedor.id, fornecedor.estado)}
                                                        className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${fornecedor.estado ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                                                    >
                                                        {fornecedor.estado ? 'Inativar Fornecedor' : 'Ativar Fornecedor'}
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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

            <AvaliarFornecedorModal
                isOpen={fornecedorAAvaliar !== null}
                fornecedor={fornecedorAAvaliar}
                onClose={() => setFornecedorAAvaliar(null)}
                onSuccess={() => {
                    showToast('Avaliação registada com sucesso!', 'success');
                }}
            />

            {/* Detalhes do Fornecedor Modal */}
            {detalhesFornecedor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDetalhesFornecedor(null)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="bg-slate-900 p-6 flex justify-between items-start">
                            <div className="pr-4">
                                <h2 className="text-xl font-bold text-white leading-tight">{detalhesFornecedor.nome}</h2>
                                <p className="text-slate-400 text-sm mt-1">{detalhesFornecedor.email}</p>
                            </div>
                            <button onClick={() => setDetalhesFornecedor(null)} className="p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors rounded-lg flex-shrink-0">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">NIF</span>
                                    <span className="text-slate-800 font-mono font-semibold">{detalhesFornecedor.nif}</span>
                                </div>
                                <div className="flex flex-col bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Contacto</span>
                                    <span className="text-slate-800 font-semibold">{detalhesFornecedor.contacto}</span>
                                </div>
                            </div>
                            <div className="flex flex-col border-b border-slate-100 pb-3">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tipo de Produtos</span>
                                <span className="text-slate-800 font-medium inline-flex">{detalhesFornecedor.categoria}</span>
                            </div>
                            <div className="flex flex-col border-b border-slate-100 pb-3">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Estado</span>
                                <div>
                                    <span className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-sm font-bold border ${detalhesFornecedor.estado ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                        {detalhesFornecedor.estado ? 'Ativo' : 'Inativo'}
                                    </span>
                                </div>
                            </div>
                            {avaliacaoMedia?.totalAvaliacoes ? (
                                <div className="flex flex-col border-b border-slate-100 pb-3">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Pontuação Média</span>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-800 font-semibold">
                                            {avaliacaoMedia.media?.toFixed(1)} / 5
                                        </span>
                                        <span className="text-xs font-bold text-slate-500">
                                            {avaliacaoMedia.totalAvaliacoes} {avaliacaoMedia.totalAvaliacoes === 1 ? 'avaliação' : 'avaliações'}
                                        </span>
                                    </div>
                                </div>
                            ) : null}
                            <div className="flex flex-col border-b border-slate-100 pb-3">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Desde</span>
                                <span className="text-slate-800 font-medium">
                                    {new Date(detalhesFornecedor.criadoEm).toLocaleDateString('pt-PT', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </span>
                            </div>
                            
                            {/* Produtos Fornecidos */}
                            <div className="flex flex-col border-b border-slate-100 pb-3">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Produtos Fornecidos</span>
                                {detalhesFornecedor.produtos && detalhesFornecedor.produtos.length > 0 ? (
                                    <div className="max-h-32 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                                        {detalhesFornecedor.produtos.map(prod => (
                                            <div key={prod.id} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                                                <div>
                                                    <div className="text-sm font-bold text-slate-800 leading-tight">{prod.nome}</div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{prod.categoria || 'Sem Categoria'}</div>
                                                </div>
                                                <div className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                                                    Stock: {prod.stock}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-sm text-slate-500 italic p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
                                        Este fornecedor não tem produtos associados.
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col pt-1">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Observações</span>
                                    <button
                                        onClick={() => handleSaveObservacoes(detalhesFornecedor.id)}
                                        disabled={savingObs}
                                        className="text-xs font-bold text-blue-600 hover:text-blue-700 disabled:opacity-50 transition-opacity"
                                    >
                                        {savingObs ? 'A Guardar...' : 'Guardar'}
                                    </button>
                                </div>
                                <div className="relative">
                                    <textarea
                                        value={detalhesFornecedor.observacoes || ''}
                                        onChange={(e) => setDetalhesFornecedor({ ...detalhesFornecedor, observacoes: e.target.value })}
                                        rows={3}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 outline-none transition-all placeholder:text-slate-400 text-sm resize-none custom-scrollbar"
                                        placeholder="Informação adicional opcional..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Fornecedores;
