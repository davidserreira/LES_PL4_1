import { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, Trash2, CheckCircle2, ArrowRight, ArrowLeft, Package, ChevronDown, Check, Filter } from 'lucide-react';
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
    onClose: (shouldRefresh?: boolean) => void;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
};

const PRIORIDADES = [
    { value: 'NORMAL', label: 'Normal', dot: 'bg-blue-500' },
    { value: 'ALTA', label: 'Alta', dot: 'bg-amber-400' },
    { value: 'URGENTE', label: 'Urgente', dot: 'bg-red-500' }
];

const CATEGORIES = ['Medicamentos', 'Vacinas', 'Higiene', 'Equipamento', 'Outros'];

export default function CriarPedidoCompraModal({ isOpen, onClose }: CriarPedidoModalProps) {
    const [step, setStep] = useState<1 | 2>(1);
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [linhas, setLinhas] = useState<LinhaPedido[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [prioridade, setPrioridade] = useState('NORMAL');
    const [isPrioridadeOpen, setIsPrioridadeOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
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
        
        produtoService.getAll().then(data => setProdutos(data)).catch(console.error);
        pedidoCompraService.getAll().then((pedidos: any[]) => {
            const maxId = pedidos.reduce((acc, p) => Math.max(acc, p.id ?? 0), 0);
            setNextPedidoId(maxId + 1);
        }).catch(console.error);
    }, [isOpen]);

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
            await pedidoCompraService.create({
                criadoPorId: user?.id ?? null,
                prioridade: prioridade,
                linhas: linhas.map(l => ({
                    produtoId: l.produto.id,
                    quantidade: l.quantidade
                }))
            });
            onClose(true); // close and refresh
        } catch (e) {
            console.error(e);
            alert('Erro ao submeter pedido.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const totalProdutos = linhas.reduce((acc, l) => acc + l.quantidade, 0);
    const totalEstimado = linhas.reduce((acc, l) => acc + (l.quantidade * l.produto.preco), 0);
    const ano = new Date().getFullYear();
    const mockIdStr = `PM-${ano}-${String(nextPedidoId).padStart(3, '0')}`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                
                {/* Header Modal */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Criar Pedido de Compra</h2>
                        <p className="text-sm text-slate-500">
                            {step === 1 ? 'Passo 1: Selecione os produtos para o pedido' : 'Passo 2: Reveja e submeta o pedido'}
                        </p>
                    </div>
                    <button 
                        onClick={() => onClose(false)}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50 relative">
                    {/* Stepper Visual */}
                    <div className="flex items-center justify-center mb-8">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shadow-sm ${step === 1 ? 'bg-emerald-600 text-white' : 'bg-emerald-600 text-white'}`}>
                            {step === 2 ? <Check size={16} strokeWidth={3} /> : '1'}
                        </div>
                        <div className={`w-16 h-1 mx-2 rounded-full ${step === 2 ? 'bg-emerald-600' : 'bg-slate-200'}`}></div>
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shadow-sm ${step === 2 ? 'bg-emerald-600 text-white' : 'bg-white border-2 border-slate-200 text-slate-400'}`}>
                            2
                        </div>
                        <div className="w-16 h-1 mx-2 rounded-full bg-slate-200"></div>
                        <div className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold bg-white border-2 border-slate-200 text-slate-400 shadow-sm">
                            3
                        </div>
                    </div>

                    {step === 1 && (
                        <div className="space-y-6">
                            {/* Filtros e Pesquisa */}
                            <div className="bg-white rounded-xl border border-slate-200 overflow-visible shadow-sm z-20 relative">
                                <div className="p-4 border-b border-slate-100 space-y-4">
                                    {/* Linha 1: Filtros Compactos */}
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className="flex items-center gap-1.5 text-slate-500 font-medium text-xs">
                                            <Filter size={14} />
                                            Filtros:
                                        </div>
                                        
                                        {/* Status Filter */}
                                        <div className="flex p-0.5 bg-slate-100/80 rounded-lg border border-slate-200/60">
                                            <button
                                                onClick={() => setFilterStatus('todos')}
                                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${filterStatus === 'todos' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-600 hover:text-slate-900'} `}
                                            >
                                                Todos
                                            </button>
                                            <button
                                                onClick={() => setFilterStatus('estavel')}
                                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${filterStatus === 'estavel' ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-600 hover:text-slate-900'} `}
                                            >
                                                Estável
                                            </button>
                                            <button
                                                onClick={() => setFilterStatus('critico')}
                                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${filterStatus === 'critico' ? 'bg-white text-amber-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-600 hover:text-slate-900'} `}
                                            >
                                                Crítico
                                            </button>
                                        </div>

                                        {/* Category Dropdown */}
                                        <div className="relative min-w-[150px]">
                                            <button
                                                onClick={() => setIsFilterCategoryOpen(!isFilterCategoryOpen)}
                                                className={`w-full flex items-center justify-between gap-2 px-3 py-1 bg-white border rounded-md text-xs font-medium transition-all ${filterCategory ? 'border-blue-500 text-blue-700 bg-blue-50/10' : 'border-slate-200 text-slate-700 hover:border-slate-300'}`}
                                            >
                                                {filterCategory || 'Todas as Categorias'}
                                                <ChevronDown size={14} className={`text-slate-400 transition-transform ${isFilterCategoryOpen ? 'rotate-180' : ''}`} />
                                            </button>
                                            {isFilterCategoryOpen && (
                                                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-30 animate-in fade-in zoom-in-95">
                                                    <button
                                                        onClick={() => { setFilterCategory(''); setIsFilterCategoryOpen(false); }}
                                                        className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${!filterCategory ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
                                                    >
                                                        Todas as Categorias
                                                    </button>
                                                    {CATEGORIES.map(cat => (
                                                        <button
                                                            key={cat}
                                                            onClick={() => { setFilterCategory(cat); setIsFilterCategoryOpen(false); }}
                                                            className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${filterCategory === cat ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
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
                                                className="ml-auto text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors px-2"
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
                                            className="w-full pl-9 pr-24 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-xs placeholder:text-slate-400"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-medium">
                                             A mostrar {filteredProdutos.length} de {produtos.length}
                                        </div>
                                    </div>
                                </div>
                                <div className="max-h-60 overflow-y-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 sticky top-0 z-10 text-slate-500 text-xs shadow-sm">
                                            <tr>
                                                <th className="px-5 py-3 font-semibold">Produto</th>
                                                <th className="px-5 py-3 font-semibold">Categoria</th>
                                                <th className="px-5 py-3 font-semibold">Stock Atual</th>
                                                <th className="px-5 py-3 font-semibold">Stock Mínimo</th>
                                                <th className="px-5 py-3 font-semibold">Ação</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredProdutos.map((p) => {
                                                const isAdded = linhas.some(l => l.produto.id === p.id);
                                                const isInCritical = p.stock <= p.stockMinimo;
                                                return (
                                                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-5 py-3 text-slate-900 font-medium">{p.nome}</td>
                                                        <td className="px-5 py-3">
                                                            <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 text-[10px] uppercase font-bold tracking-wider">
                                                                {p.categoria || 'Sem categoria'}
                                                            </span>
                                                        </td>
                                                        <td className={`px-5 py-3 font-semibold ${isInCritical ? 'text-red-500' : 'text-emerald-600'}`}>
                                                            {p.stock} un
                                                        </td>
                                                        <td className="px-5 py-3 text-slate-500">{p.stockMinimo} un</td>
                                                        <td className="px-5 py-3 rounded-r-xl align-middle">
                                                            <div className="flex flex-col items-center gap-1.5 w-[90px] mx-auto text-center">
                                                                {isAdded ? (
                                                                    <button disabled className="w-full px-3 py-1.5 text-xs font-bold text-slate-400 bg-white border border-slate-200 rounded-lg cursor-not-allowed">
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
                                                                    <div className="text-[10px] font-bold text-emerald-600 mt-0.5 tracking-tight">
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
                            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                                <h3 className="text-sm font-semibold text-slate-800 mb-4">Produtos na Lista ({linhas.length})</h3>
                                {linhas.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                                        <Package size={48} strokeWidth={1} className="mb-3 text-slate-300" />
                                        <p>Nenhum produto adicionado ainda</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {linhas.map((linha) => (
                                            <div key={linha.produto.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:border-emerald-100 hover:bg-emerald-50/30 transition-colors">
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">{linha.produto.nome}</p>
                                                    <p className="text-xs text-slate-500 mt-0.5">{linha.produto.categoria} &bull; {formatCurrency(linha.produto.preco)} / un</p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-medium text-slate-500">Qtd:</span>
                                                        <input 
                                                            type="number" 
                                                            min="1"
                                                            value={linha.quantidade}
                                                            onChange={(e) => handleQuantidadeChange(linha.produto.id, parseInt(e.target.value) || 1)}
                                                            className="w-20 px-3 py-1.5 text-sm font-bold text-slate-900 text-center bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                                                        />
                                                        <span className="text-xs text-slate-500 w-6">un</span>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleRemover(linha.produto.id)}
                                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
                            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row gap-6 justify-between">
                                <div className="space-y-4 flex-1">
                                    <h3 className="text-sm font-bold text-slate-800">Resumo do Pedido</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">ID</p>
                                            <p className="text-sm font-bold text-slate-900">{mockIdStr}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Data</p>
                                            <p className="text-sm font-medium text-slate-900">{hoje}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Itens do Pedido</p>
                                            <p className="text-sm font-medium text-slate-900">{linhas.length}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Total de Produtos</p>
                                            <p className="text-sm font-medium text-slate-900">{totalProdutos} un</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-800">Definições</h3>
                                    <div className="relative" ref={prioridadeRef}>
                                        <p className="text-xs text-slate-500 mb-1">Prioridade</p>
                                        <button
                                            type="button"
                                            onClick={() => setIsPrioridadeOpen(!isPrioridadeOpen)}
                                            className="w-full sm:w-[160px] px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all flex items-center justify-between text-sm group hover:bg-slate-50 shadow-sm"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2.5 h-2.5 rounded-full ${PRIORIDADES.find(p => p.value === prioridade)?.dot}`}></span>
                                                <span className="font-semibold text-slate-700">
                                                    {PRIORIDADES.find(p => p.value === prioridade)?.label}
                                                </span>
                                            </div>
                                            <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isPrioridadeOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        {isPrioridadeOpen && (
                                            <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-20 py-1.5 animate-in fade-in zoom-in-95 duration-200">
                                                {PRIORIDADES.map((item) => (
                                                    <button
                                                        key={item.value}
                                                        type="button"
                                                        onClick={() => {
                                                            setPrioridade(item.value);
                                                            setIsPrioridadeOpen(false);
                                                        }}
                                                        className={`w-full px-3 py-2 flex items-center gap-2 transition-colors text-sm ${prioridade === item.value ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:bg-slate-50 font-medium'}`}
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
                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                                <h3 className="text-sm font-bold text-slate-800 p-5 border-b border-slate-100">Lista de Produtos</h3>
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50/50 text-slate-500 text-xs border-b border-slate-100 uppercase tracking-wider">
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
                                                <td className="px-5 py-3 font-medium text-slate-900">{linha.produto.nome}</td>
                                                <td className="px-5 py-3">
                                                    <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 text-[10px] uppercase font-bold tracking-wider">
                                                        {linha.produto.categoria || 'Sem categoria'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-center font-bold text-slate-700">{linha.quantidade}</td>
                                                <td className="px-5 py-3 text-right text-slate-500">{formatCurrency(linha.produto.preco)}</td>
                                                <td className="px-5 py-3 text-right font-bold text-slate-900">{formatCurrency(linha.quantidade * linha.produto.preco)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="bg-emerald-50/50 px-6 py-4 flex items-center justify-end gap-6 border-t border-slate-200/60">
                                    <span className="text-sm font-bold text-slate-600 uppercase tracking-wider">Total Estimado:</span>
                                    <span className="text-xl font-bold text-emerald-700">{formatCurrency(totalEstimado)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between">
                    <div>
                        {step === 1 && linhas.length > 0 && (
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
                                className="text-sm font-semibold text-slate-500 hover:text-slate-800 px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                            >
                                <ArrowLeft size={16} /> Voltar
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => onClose(false)}
                            className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors"
                        >
                            Cancelar
                        </button>
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
                                    <>Submeter Pedido <CheckCircle2 size={18} /></>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
