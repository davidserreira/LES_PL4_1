import { useState, useEffect, useRef } from 'react';
import { Trash2, ShoppingCart, Plus, Search, AlertTriangle, X, Check, ChevronDown, Filter } from 'lucide-react';
import { produtoService } from '../services/produtoService';
import { pedidoCompraService } from '../services/pedidoCompraService';

interface Produto {
    id: number;
    nome: string;
    preco: number;
    stock: number;
    stockMinimo: number;
    categoria?: string;
    descricao?: string;
}

interface LinhaPedido {
    produto: Produto;
    quantidade: number;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
};

const CriarPedidoCompra = () => {
    const hoje = new Date().toLocaleDateString('pt-PT');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [linhas, setLinhas] = useState<LinhaPedido[]>([]);
    const [prioridade, setPrioridade] = useState('NORMAL');
    const [isPrioridadeOpen, setIsPrioridadeOpen] = useState(false);

    const prioridadeRef = useRef<HTMLDivElement>(null);

    const [isSelectionOpen, setIsSelectionOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<'todos' | 'estavel' | 'critico'>('todos');
    const [isFilterCategoryOpen, setIsFilterCategoryOpen] = useState(false);
    const CATEGORIES = ['Medicamentos', 'Vacinas', 'Higiene', 'Equipamento', 'Outros'];

    const PRIORIDADES = [
        { value: 'NORMAL', label: 'Normal', dot: 'bg-slate-400' },
        { value: 'ALTA', label: 'Alta', dot: 'bg-amber-400' },
        { value: 'URGENTE', label: 'Urgente', dot: 'bg-red-500' }
    ];

    // Close priority dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (prioridadeRef.current && !prioridadeRef.current.contains(event.target as Node)) {
                setIsPrioridadeOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        produtoService.getAll().then(data => setProdutos(data)).catch(console.error);
    }, []);

    const hasProdutos = linhas.length > 0;

    // Calcula totais
    const totalLinhas = linhas.length;
    const quantidadeTotal = linhas.reduce((acc, l) => acc + l.quantidade, 0);
    const totalEstimado = linhas.reduce((acc, l) => acc + (l.quantidade * l.produto.preco), 0);

    const handleAdicionar = (produto: Produto) => {
        const sugestao = Math.max(0, produto.stockMinimo - produto.stock);
        const qtdInicial = sugestao > 0 ? sugestao : 1;
        setLinhas([...linhas, { produto, quantidade: qtdInicial }]);
    };

    const handleRemover = (produtoId: number) => {
        setLinhas(linhas.filter(l => l.produto.id !== produtoId));
    };

    const handleQuantidadeChange = (produtoId: number, novaQtd: number) => {
        if (novaQtd < 1) return;
        setLinhas(linhas.map(l => l.produto.id === produtoId ? { ...l, quantidade: novaQtd } : l));
    };

    const handleSubmit = async () => {
        if (!hasProdutos) return;
        setIsSubmitting(true);
        try {
            await pedidoCompraService.create({
                criadoPorId: 1, // Mock Temporário de Gestor de Stock
                prioridade: prioridade,
                linhas: linhas.map(l => ({
                    produtoId: l.produto.id,
                    quantidade: l.quantidade
                }))
            });
            alert('Pedido de compra submetido com sucesso!');
            setLinhas([]);
            setPrioridade('NORMAL');
            setIsSelectionOpen(false);
        } catch (e) {
            console.error(e);
            alert('Erro ao submeter pedido.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLimpar = () => {
        if (window.confirm('Tem a certeza que deseja remover todos os produtos deste pedido?')) {
            setLinhas([]);
            setIsSelectionOpen(false);
        }
    };

    // Filtros de Catálogo
    const filteredProdutos = produtos.filter(p => {
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

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Criar Pedido de Compra</h1>
                    <p className="mt-1 text-sm text-slate-500">Crie uma nova requisição interna de compra</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleLimpar}
                        disabled={!hasProdutos || isSubmitting}
                        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-sm ${(!hasProdutos || isSubmitting)
                            ? 'bg-slate-50 border border-slate-200 text-slate-400 cursor-not-allowed opacity-70'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                    >
                        <Trash2 size={16} /> Limpar Pedido
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!hasProdutos || isSubmitting}
                        style={{ opacity: (!hasProdutos || isSubmitting) ? 0.45 : 1 }}
                        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 focus:outline-none ${
                            (!hasProdutos || isSubmitting)
                                ? 'bg-emerald-500 text-white cursor-not-allowed'
                                : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                        }`}
                    >
                        <ShoppingCart size={16} /> Submeter Pedido
                    </button>
                </div>
            </div>

            {/* DADOS GERAIS */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col gap-5">
                <h2 className="text-[11px] font-bold text-slate-500 tracking-widest uppercase">Dados Gerais</h2>
                <div className="flex flex-row items-center w-full gap-8">
                    <div className="flex-1">
                        <p className="text-xs text-slate-500 mb-1">ID do Pedido</p>
                        <p className="text-sm font-bold text-slate-900">PC-2026-001</p>
                    </div>
                    <div className="flex-1">
                        <p className="text-xs text-slate-500 mb-1">Data de Criação</p>
                        <p className="text-sm font-medium text-slate-900">{hoje}</p>
                    </div>
                    <div className="flex-1">
                        <p className="text-xs text-slate-500 mb-1">Tipo de Pedido</p>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            <p className="text-sm font-medium text-slate-900">Manual</p>
                        </div>
                    </div>
                    <div className="flex-1">
                        <p className="text-xs text-slate-500 mb-1">Emitido por</p>
                        <p className="text-sm font-medium text-slate-900">Gestor de Stock</p>
                    </div>
                    <div className="flex-1 relative" ref={prioridadeRef}>
                        <p className="text-xs text-slate-500 mb-1">Prioridade</p>
                        <button
                            type="button"
                            onClick={() => setIsPrioridadeOpen(!isPrioridadeOpen)}
                            className="w-[120px] px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all flex items-center justify-between text-sm group hover:bg-slate-50 shadow-sm"
                        >
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${PRIORIDADES.find(p => p.value === prioridade)?.dot}`}></span>
                                <span className="font-medium text-slate-700">
                                    {PRIORIDADES.find(p => p.value === prioridade)?.label}
                                </span>
                            </div>
                            <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isPrioridadeOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isPrioridadeOpen && (
                            <div className="absolute top-[calc(100%+4px)] left-0 w-[120px] bg-white border border-slate-200 rounded-xl shadow-xl z-20 py-1.5 animate-in fade-in zoom-in-95 duration-200">
                                {PRIORIDADES.map((item) => (
                                    <button
                                        key={item.value}
                                        type="button"
                                        onClick={() => {
                                            setPrioridade(item.value);
                                            setIsPrioridadeOpen(false);
                                        }}
                                        className={`w-full px-3 py-2 flex items-center gap-2 transition-colors text-sm ${prioridade === item.value ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
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

            {/* PRODUTOS */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-transparent">
                    <h2 className="text-[11px] font-bold text-slate-500 tracking-widest uppercase">Produtos</h2>
                    {!isSelectionOpen && (
                        <button
                            onClick={() => setIsSelectionOpen(true)}
                            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 transition-colors shadow-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        >
                            <Plus size={14} strokeWidth={2.5} /> Adicionar Produto
                        </button>
                    )}
                </div>

                {isSelectionOpen && (
                    <div className="m-6 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-xs font-semibold text-slate-700 tracking-wide uppercase">Selecionar Produto</h3>
                            <button onClick={() => setIsSelectionOpen(false)} className="text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-300 rounded p-1">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-5 space-y-4 bg-white">
                            {/* Filtros e Pesquisa parecidos ao Catálogo */}
                            <div className="flex flex-col gap-4 mb-4">
                                {/* Filtros */}
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm relative z-20">
                                    <div className="flex items-center gap-2 text-slate-500 font-medium text-sm mr-2 pl-1">
                                        <Filter size={16} />
                                        Filtros:
                                    </div>

                                    {/* Status Filter */}
                                    <div className="flex p-1 bg-slate-100/50 rounded-lg border border-slate-200/60">
                                        <button
                                            onClick={() => setFilterStatus('todos')}
                                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap ${filterStatus === 'todos' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-600 hover:text-slate-900'} `}
                                        >
                                            Todos
                                        </button>
                                        <button
                                            onClick={() => setFilterStatus('estavel')}
                                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap ${filterStatus === 'estavel' ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-600 hover:text-slate-900'} `}
                                        >
                                            Estável
                                        </button>
                                        <button
                                            onClick={() => setFilterStatus('critico')}
                                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap ${filterStatus === 'critico' ? 'bg-white text-amber-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-600 hover:text-slate-900'} `}
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
                                            className="ml-auto text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors px-2 whitespace-nowrap"
                                        >
                                            Limpar filtros
                                        </button>
                                    )}
                                </div>
                                
                                {/* Barra de Pesquisa */}
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm relative z-10">
                                    <div className="relative w-full max-w-md">
                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Pesquisar por nome ou descrição..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 bg-transparent border-0 outline-none text-sm placeholder:text-slate-400 text-slate-700 focus:ring-0"
                                        />
                                    </div>
                                    <div className="text-xs text-slate-500 font-medium px-4 whitespace-nowrap">
                                        A mostrar <span className="font-bold text-slate-700">{filteredProdutos.length}</span> de <span className="font-bold text-slate-700">{produtos.length}</span> produtos
                                    </div>
                                </div>
                            </div>

                            {/* Tabela de Pesquisa */}
                            <div className="border border-slate-200 rounded-lg overflow-hidden max-h-72 overflow-y-auto custom-scrollbar">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider sticky top-0 z-10 font-bold border-b border-slate-200">
                                        <tr>
                                            <th className="px-5 py-3">Produto</th>
                                            <th className="px-5 py-3 text-right">Preço</th>
                                            <th className="px-5 py-3 text-center">Stock Atual</th>
                                            <th className="px-5 py-3 text-center">Stock Mínimo</th>
                                            <th className="px-5 py-3 text-center">Sugestão</th>
                                            <th className="px-5 py-3"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {filteredProdutos.map(p => {
                                            const isAbaixo = p.stock < p.stockMinimo;
                                            const sugestao = p.stockMinimo - p.stock;
                                            const isSelected = linhas.some(l => l.produto.id === p.id);

                                            return (
                                                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors group">
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                                                                <span className="text-slate-400 font-bold text-sm">📦</span>
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-slate-800 text-sm leading-none">{p.nome}</p>
                                                                {isAbaixo && (
                                                                    <p className="text-[10px] text-red-500 font-semibold flex items-center gap-1 mt-1">
                                                                        <AlertTriangle size={10} strokeWidth={3} /> Abaixo do mínimo
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 text-right text-slate-600 font-medium">{formatCurrency(p.preco)}</td>
                                                    <td className={`px-5 py-4 text-center font-bold ${isAbaixo ? 'text-red-500 bg-red-50/50' : 'text-slate-700'}`}>
                                                        {p.stock}
                                                    </td>
                                                    <td className="px-5 py-4 text-center text-slate-500 font-medium">{p.stockMinimo}</td>
                                                    <td className="px-5 py-4 text-center text-slate-500">
                                                        {sugestao > 0 ? <span className="text-slate-600 font-semibold">+{sugestao}</span> : '-'}
                                                    </td>
                                                    <td className="px-5 py-4 text-right">
                                                        {isSelected ? (
                                                            <button disabled className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 bg-slate-100 text-slate-400 text-xs font-bold rounded-lg cursor-not-allowed">
                                                                <Check size={14} strokeWidth={3} /> Adicionado
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleAdicionar(p)}
                                                                className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 lg:opacity-0 lg:group-hover:opacity-100"
                                                            >
                                                                Adicionar
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {filteredProdutos.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="px-5 py-10 text-center text-slate-500 text-sm font-medium">Nenhum produto encontrado.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {hasProdutos ? (
                    <div className="border-t border-slate-100 bg-white">
                        {/* Tabela de Carrinho */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-slate-50/50 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                                    <tr>
                                        <th className="px-6 py-4">Produto</th>
                                        <th className="px-6 py-4 text-center">Stock Atual</th>
                                        <th className="px-6 py-4 text-center">Stock Mínimo</th>
                                        <th className="px-6 py-4 text-center">Quantidade</th>
                                        <th className="px-6 py-4 text-right">Valor Unitário</th>
                                        <th className="px-6 py-4 text-right">Total</th>
                                        <th className="px-6 py-4 text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {linhas.map(linha => {
                                        const p = linha.produto;
                                        const isAbaixo = p.stock < p.stockMinimo;
                                        const sugestao = p.stockMinimo - p.stock;
                                        const hasSugestao = sugestao > 0;
                                        const lineTotal = p.preco * linha.quantidade;

                                        return (
                                            <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                                                            <span className="text-slate-400 font-bold text-sm">📦</span>
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-slate-900 text-sm leading-none">{p.nome}</p>
                                                            {hasSugestao && (
                                                                <p className="text-[10px] font-medium text-slate-400 mt-1">
                                                                    Sugestão: +{sugestao} unidades
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className={`px-6 py-4 text-center font-bold ${isAbaixo ? 'text-red-500' : 'text-slate-700'}`}>
                                                    {p.stock}
                                                </td>
                                                <td className="px-6 py-4 text-center text-slate-500 font-medium">{p.stockMinimo}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center">
                                                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                                                            <button
                                                                onClick={() => handleQuantidadeChange(p.id, Math.max(1, linha.quantidade - 1))}
                                                                className="w-10 h-9 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors focus:outline-none disabled:opacity-50"
                                                                disabled={linha.quantidade <= 1}
                                                            >-</button>
                                                            <input
                                                                type="number"
                                                                min={1}
                                                                value={linha.quantidade}
                                                                onChange={e => handleQuantidadeChange(p.id, parseInt(e.target.value) || 1)}
                                                                className="w-14 h-9 text-center font-bold text-slate-900 focus:outline-none border-x border-slate-200"
                                                                style={{ MozAppearance: 'textfield' }}
                                                            />
                                                            <button
                                                                onClick={() => handleQuantidadeChange(p.id, linha.quantidade + 1)}
                                                                className="w-10 h-9 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors focus:outline-none"
                                                            >+</button>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right text-slate-600 font-medium">{formatCurrency(p.preco)}</td>
                                                <td className="px-6 py-4 text-right text-slate-900 font-bold text-[15px]">{formatCurrency(lineTotal)}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => handleRemover(p.id)}
                                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                                                        title="Remover"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* SUMÁRIO */}
                        <div className="p-6 bg-slate-50/50 flex flex-col items-end border-t border-slate-200">
                            <div className="w-full sm:w-auto min-w-[320px] pt-4 space-y-3">
                                <div className="flex justify-between items-center text-sm font-medium text-slate-500 px-4">
                                    <span>Linhas do Pedido:</span>
                                    <span className="text-slate-700 font-bold">{totalLinhas}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm font-medium text-slate-500 px-4">
                                    <span>Quantidade Total:</span>
                                    <span className="text-slate-700 font-bold">{quantidadeTotal}</span>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-white border border-slate-200 rounded-xl shadow-sm mt-3">
                                    <span className="font-bold text-slate-700">Total Estimado:</span>
                                    <span className="text-xl font-black text-slate-900 tracking-tight">{formatCurrency(totalEstimado)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : !isSelectionOpen ? (
                    // ESTADO VAZIO (só mostrar quando não estamos a selecionar produtos)
                    <div className="p-6 sm:p-12 bg-white">
                        <div className="flex flex-col items-center justify-center text-center py-16">
                            <div className="w-16 h-16 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center mb-5 shadow-sm">
                                <ShoppingCart className="text-slate-400" size={28} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Nenhum produto adicionado</h3>
                            <p className="text-sm text-slate-500 mb-8 max-w-sm">
                                Comece por adicionar produtos ao seu pedido de compra
                            </p>
                            <button
                                onClick={() => setIsSelectionOpen(true)}
                                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                            >
                                <Plus size={18} strokeWidth={2.5} />
                                Adicionar Produto
                            </button>
                        </div>
                    </div>
                ) : null}
            </div>

            {/* Some CSS for removing arrows in number input */}
            <style>{`
                input[type='number']::-webkit-inner-spin-button,
                input[type='number']::-webkit-outer-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
            `}</style>
        </div>
    );
};

export default CriarPedidoCompra;
