import { useState, useEffect, useRef } from 'react';
import { X, AlertCircle, CheckCircle2, Loader2, ChevronDown, Trash2, Search, Plus, ShoppingCart } from 'lucide-react';
import { pedidoCompraService } from '../services/pedidoCompraService';
import { produtoService } from '../services/produtoService';

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
    produtoId: number;
    produto: Produto;
    quantidade: number;
    precoUnitario: number;
}

interface PedidoCompra {
    id: number;
    codigoFormatado: string;
    prioridade: 'NORMAL' | 'ALTA' | 'URGENTE';
    estado: string;
    linhas: LinhaPedido[];
}

interface EditarPedidoCompraModalProps {
    isOpen: boolean;
    pedido: PedidoCompra | null;
    onClose: () => void;
    onSuccess: () => void;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
};

const PRIORIDADES = [
    { value: 'NORMAL', label: 'Normal', dot: 'bg-slate-400' },
    { value: 'ALTA', label: 'Alta', dot: 'bg-amber-400' },
    { value: 'URGENTE', label: 'Urgente', dot: 'bg-red-500' }
];

const EditarPedidoCompraModal = ({ isOpen, pedido, onClose, onSuccess }: EditarPedidoCompraModalProps) => {
    const [prioridade, setPrioridade] = useState<string>('NORMAL');
    const [linhas, setLinhas] = useState<{ produto: Produto, quantidade: number }[]>([]);
    const [produtos, setProdutos] = useState<Produto[]>([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isClosing, setIsClosing] = useState(false);
    
    const [isPrioridadeOpen, setIsPrioridadeOpen] = useState(false);
    const prioridadeRef = useRef<HTMLDivElement>(null);

    // Produto selection state
    const [isSelectionOpen, setIsSelectionOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory] = useState<string>(''); // removed setFilterCategory as it is unused here 
    const [filterStatus] = useState<'todos' | 'estavel' | 'critico'>('todos'); // removed setFilterStatus

    useEffect(() => {
        if (isOpen && pedido) {
            setIsClosing(false);
            setError(null);
            setIsSelectionOpen(false);
            setPrioridade(pedido.prioridade);
            
            // Reconstruct linhas with available info, 
            // the full produto should be populated by the backend in `linhas.produto`
            setLinhas(pedido.linhas.map(l => ({
                produto: l.produto,
                quantidade: l.quantidade
            })));
        }
    }, [isOpen, pedido]);

    useEffect(() => {
        if (isOpen) {
            produtoService.getAll().then(data => setProdutos(data)).catch(console.error);
        }
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

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setIsClosing(false);
        }, 300);
    };

    if (!isOpen && !isClosing) return null;
    if (!pedido) return null;

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (linhas.length === 0) {
            setError('O pedido tem de ter pelo menos uma linha.');
            return;
        }

        setError(null);
        setLoading(true);
        try {
            await pedidoCompraService.update(pedido.id, {
                prioridade,
                linhas: linhas.map(l => ({
                    produtoId: l.produto.id,
                    quantidade: l.quantidade
                }))
            });
            onSuccess();
            handleClose();
        } catch (err: unknown) {
            const errorMessage = err && typeof err === 'object' && 'response' in err
                ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
                : undefined;
            setError(errorMessage || 'Ocorreu um erro ao guardar as alterações.');
        } finally {
            setLoading(false);
        }
    };

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
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
            <div
                className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
                onClick={handleClose}
            />

            <div className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden transform transition-all duration-300 flex flex-col ${isClosing ? 'scale-95 translate-y-4' : 'scale-100 translate-y-0'} max-h-[90vh]`}>
                <div className="bg-slate-900 p-6 shrink-0">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                Editar Pedido de Compra: {pedido.codigoFormatado}
                            </h2>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="overflow-y-auto custom-scrollbar flex-1 bg-slate-50/30">
                    <form id="edit-pedido-form" onSubmit={handleSubmit} className="p-6 space-y-6">
                        {error && (
                            <div className="animate-shake rounded-lg bg-red-50 border border-red-100 p-3 flex gap-3 items-center">
                                <AlertCircle className="text-red-500 shrink-0" size={18} />
                                <p className="text-sm font-medium text-red-800">{error}</p>
                            </div>
                        )}

                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                            <h3 className="text-[11px] font-bold text-slate-500 tracking-widest uppercase mb-4">Dados Gerais</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-1.5 pt-1">
                                    <label className="text-sm font-medium text-slate-700 ml-0.5">Estado</label>
                                    <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 cursor-not-allowed">
                                        {pedido.estado} (Não editável por aqui)
                                    </div>
                                </div>

                                <div className="space-y-1.5 pt-1 relative" ref={prioridadeRef}>
                                    <label className="text-sm font-medium text-slate-700 ml-0.5">Prioridade *</label>
                                    <button
                                        type="button"
                                        onClick={() => setIsPrioridadeOpen(!isPrioridadeOpen)}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all flex items-center justify-between text-sm group shadow-sm"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${PRIORIDADES.find(p => p.value === prioridade)?.dot}`}></span>
                                            <span className="font-medium text-slate-700">
                                                {PRIORIDADES.find(p => p.value === prioridade)?.label}
                                            </span>
                                        </div>
                                        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isPrioridadeOpen ? 'rotate-180' : ''}`} />
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
                                                    className={`w-full px-4 py-2 flex items-center gap-2 transition-colors text-sm ${prioridade === item.value ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
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

                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-transparent">
                                <h3 className="text-[11px] font-bold text-slate-500 tracking-widest uppercase">Produtos do Pedido</h3>
                                {!isSelectionOpen && (
                                    <button
                                        type="button"
                                        onClick={() => setIsSelectionOpen(true)}
                                        className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 transition-colors shadow-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                    >
                                        <Plus size={14} strokeWidth={2.5} /> Adicionar Produto
                                    </button>
                                )}
                            </div>

                            {isSelectionOpen && (
                                <div className="m-5 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                    <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                                        <h4 className="text-xs font-semibold text-slate-700 tracking-wide uppercase">Selecionar Produto</h4>
                                        <button type="button" onClick={() => setIsSelectionOpen(false)} className="text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-300 rounded p-1">
                                            <X size={18} />
                                        </button>
                                    </div>
                                    
                                    <div className="p-4 space-y-4 bg-white">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm relative z-10 w-full">
                                            <div className="relative flex-1 w-full min-w-[200px]">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                <input
                                                    type="text"
                                                    placeholder="Pesquisar..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="w-full pl-9 pr-3 py-2 bg-transparent border-0 outline-none text-sm placeholder:text-slate-400 text-slate-700 focus:ring-0"
                                                />
                                            </div>
                                        </div>

                                        <div className="border border-slate-200 rounded-lg overflow-hidden max-h-56 overflow-y-auto custom-scrollbar">
                                            <table className="w-full text-left text-sm whitespace-nowrap">
                                                <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider sticky top-0 z-10 font-bold border-b border-slate-200">
                                                    <tr>
                                                        <th className="px-4 py-2">Produto</th>
                                                        <th className="px-4 py-2 text-right">Preço</th>
                                                        <th className="px-4 py-2 text-center">Stock</th>
                                                        <th className="px-4 py-2"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 bg-white">
                                                    {filteredProdutos.map(p => {
                                                        const isSelected = linhas.some(l => l.produto.id === p.id);
                                                        return (
                                                            <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                                                                <td className="px-4 py-3">
                                                                    <p className="font-semibold text-slate-800 text-sm">{p.nome}</p>
                                                                </td>
                                                                <td className="px-4 py-3 text-right text-slate-600 font-medium">{formatCurrency(p.preco)}</td>
                                                                <td className="px-4 py-3 text-center text-slate-700 font-bold">{p.stock}</td>
                                                                <td className="px-4 py-3 text-right">
                                                                    {isSelected ? (
                                                                        <span className="inline-flex items-center justify-center px-3 py-1 bg-slate-100 text-slate-400 text-xs font-bold rounded-lg">
                                                                            Adicionado
                                                                        </span>
                                                                    ) : (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleAdicionar(p)}
                                                                            className="inline-flex items-center justify-center px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors"
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
                                                            <td colSpan={4} className="px-4 py-6 text-center text-slate-500 text-sm">Nenhum produto encontrado.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {linhas.length > 0 ? (
                                <div className="border-t border-slate-100">
                                    <div className="overflow-x-auto max-h-[35vh] overflow-y-auto custom-scrollbar">
                                        <table className="w-full text-left text-sm whitespace-nowrap">
                                            <thead className="bg-slate-50/50 text-slate-500 text-[10px] uppercase tracking-wider font-bold sticky top-0 z-10 shadow-sm">
                                                <tr>
                                                    <th className="px-5 py-3">Produto</th>
                                                    <th className="px-5 py-3 text-center">Stock Atual</th>
                                                    <th className="px-5 py-3 text-center">Quantidade</th>
                                                    <th className="px-5 py-3 text-right">Unitário</th>
                                                    <th className="px-5 py-3 text-right">Total</th>
                                                    <th className="px-5 py-3 text-center">Remover</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {linhas.map(linha => {
                                                    const p = linha.produto;
                                                    const lineTotal = p.preco * linha.quantidade;

                                                    return (
                                                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="px-5 py-3">
                                                                <p className="font-semibold text-slate-900 text-sm">{p.nome}</p>
                                                            </td>
                                                            <td className="px-5 py-3 text-center font-bold text-slate-700">
                                                                {p.stock}
                                                            </td>
                                                            <td className="px-5 py-3">
                                                                <div className="flex items-center justify-center w-full">
                                                                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm w-max">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleQuantidadeChange(p.id, Math.max(1, linha.quantidade - 1))}
                                                                            className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors disabled:opacity-50"
                                                                            disabled={linha.quantidade <= 1}
                                                                        >-</button>
                                                                        <input
                                                                            type="number"
                                                                            min={1}
                                                                            value={linha.quantidade}
                                                                            onChange={e => handleQuantidadeChange(p.id, parseInt(e.target.value) || 1)}
                                                                            className="w-12 h-8 text-center font-bold text-slate-900 focus:outline-none border-x border-slate-200 text-sm"
                                                                            style={{ MozAppearance: 'textfield' }}
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleQuantidadeChange(p.id, linha.quantidade + 1)}
                                                                            className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                                                                        >+</button>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-3 text-right text-slate-600 font-medium">{formatCurrency(p.preco)}</td>
                                                            <td className="px-5 py-3 text-right text-slate-900 font-bold">{formatCurrency(lineTotal)}</td>
                                                            <td className="px-5 py-3 text-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemover(p.id)}
                                                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors inline-block"
                                                                    title="Remover"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="p-4 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center sm:items-end border-t border-slate-200 gap-4">
                                        <div className="flex gap-6 text-sm">
                                            <div className="text-slate-500 font-medium">Linhas: <span className="text-slate-700 font-bold ml-1">{totalLinhas}</span></div>
                                            <div className="text-slate-500 font-medium">Qtd Total: <span className="text-slate-700 font-bold ml-1">{quantidadeTotal}</span></div>
                                        </div>
                                        <div className="flex items-center gap-4 bg-white px-4 py-2 border border-slate-200 rounded-xl shadow-sm">
                                            <span className="font-bold text-slate-700 text-sm">Total Estimado:</span>
                                            <span className="text-lg font-black text-slate-900">{formatCurrency(totalEstimado)}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-10 text-center">
                                    <ShoppingCart className="mx-auto text-slate-300 mb-3" size={32} />
                                    <p className="text-sm font-medium text-slate-500">Este pedido não tem produtos associados.</p>
                                </div>
                            )}
                        </div>
                    </form>
                </div>

                <div className="p-5 border-t border-slate-100 bg-white flex gap-3 justify-end shrink-0">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-5 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-all text-sm"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="edit-pedido-form"
                        disabled={loading || linhas.length === 0}
                        className="px-6 py-2.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50 text-sm flex items-center justify-center gap-2 shadow-sm min-w-[160px]"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={18} />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 size={18} />
                                Guardar alterações
                            </>
                        )}
                    </button>
                </div>
            </div>

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

export default EditarPedidoCompraModal;
