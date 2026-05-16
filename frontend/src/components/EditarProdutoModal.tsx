import { useState, useEffect, useRef } from 'react';
import {
    X, Database, AlertCircle, CheckCircle2,
    DollarSign, Tag, FileText, Edit2, Loader2,
    Pill, Syringe, Bath, Stethoscope, Layers, ChevronDown, Trash2, Factory, Check, AlertTriangle, Star
} from 'lucide-react';
import { produtoService } from '../services/produtoService';
import { fornecedorService } from '../services/fornecedorService';

interface Produto {
    id: number;
    nome: string;
    stock: number;
    stockMinimo: number;
    preco?: number;
    categoria?: string;
    descricao?: string;
    fornecedores?: { id: number; nome: string }[];
    fornecedorPreferencial?: { id: number; nome: string } | null;
    precosFornecedores?: { fornecedorId: number; preco: number }[];
    linhasPedido?: {
        pedidoCompra: {
            id: number;
            estado: string;
            criadoEm: string;
            prioridade: string;
        }
    }[];
}

interface EditarProdutoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    onDelete: (id: number, force?: boolean) => Promise<boolean | void> | void;
    produto: Produto;
}

const CATEGORIES = [
    { name: 'Medicamentos', icon: Pill, color: 'text-blue-500' },
    { name: 'Vacinas', icon: Syringe, color: 'text-emerald-500' },
    { name: 'Higiene', icon: Bath, color: 'text-sky-500' },
    { name: 'Equipamento', icon: Stethoscope, color: 'text-violet-500' },
    { name: 'Outros', icon: Layers, color: 'text-slate-500 dark:text-slate-400' },
];

const EditarProdutoModal = ({ isOpen, onClose, onSuccess, onDelete, produto }: EditarProdutoModalProps) => {
    const [nome, setNome] = useState('');
    const [stock, setStock] = useState('0');
    const [stockMinimo, setStockMinimo] = useState('0');
    const [preco, setPreco] = useState('0.00');
    const [categoria, setCategoria] = useState('');
    const [descricao, setDescricao] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isClosing, setIsClosing] = useState(false);
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    
    // Fornecedores State
    const [fornecedores, setFornecedores] = useState<{ id: number; nome: string; estado: boolean }[]>([]);
    const [selectedFornecedores, setSelectedFornecedores] = useState<number[]>([]);
    const [fornecedorPrecos, setFornecedorPrecos] = useState<Record<number, string>>({});
    const [fornecedorPreferencialId, setFornecedorPreferencialId] = useState<number | null>(null);
    const [isFornecedoresOpen, setIsFornecedoresOpen] = useState(false);

    // Deletion visual state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showForceDeleteConfirm, setShowForceDeleteConfirm] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const categoryRef = useRef<HTMLDivElement>(null);
    const fornecedoresRef = useRef<HTMLDivElement>(null);

    // Fetch active suppliers when modal opens
    useEffect(() => {
        if (isOpen) {
            fornecedorService.getAll().then(data => {
                setFornecedores(data.filter((f: any) => f.estado === true));
            }).catch(err => console.error("Failed to load fornecedores", err));
        }
    }, [isOpen]);

    // Update preferential supplier automatically
    useEffect(() => {
        if (fornecedorPreferencialId && !selectedFornecedores.includes(fornecedorPreferencialId)) {
            setFornecedorPreferencialId(null);
        }
        if (selectedFornecedores.length === 1) {
            setFornecedorPreferencialId(selectedFornecedores[0]);
        }
    }, [selectedFornecedores, fornecedorPreferencialId]);

    useEffect(() => {
        if (isOpen && produto) {
            setNome(produto.nome);
            setStock(produto.stock.toString());
            setStockMinimo(produto.stockMinimo.toString());
            setPreco(produto.preco ? produto.preco.toString() : '0.00');
            setCategoria(produto.categoria || '');
            setDescricao(produto.descricao || '');
            
            // Map existing fornecedores to their IDs
            if (produto.fornecedores && Array.isArray(produto.fornecedores)) {
                setSelectedFornecedores(produto.fornecedores.map(f => f.id));
            } else {
                setSelectedFornecedores([]);
            }
            
            if (produto.precosFornecedores && Array.isArray(produto.precosFornecedores)) {
                const map: Record<number, string> = {};
                produto.precosFornecedores.forEach(pf => {
                    map[pf.fornecedorId] = pf.preco.toString();
                });
                setFornecedorPrecos(map);
            } else {
                setFornecedorPrecos({});
            }
            
            if (produto.fornecedorPreferencial) {
                setFornecedorPreferencialId(produto.fornecedorPreferencial.id);
            } else {
                setFornecedorPreferencialId(null);
            }
            
            setIsClosing(false);
            setError(null);
            setIsCategoryOpen(false);
            setShowDeleteConfirm(false);
            setShowForceDeleteConfirm(false);
            setDeleteLoading(false);
            setIsFornecedoresOpen(false);
        }
    }, [isOpen, produto]);

    // Close dropdowns on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
                setIsCategoryOpen(false);
            }
            if (fornecedoresRef.current && !fornecedoresRef.current.contains(event.target as Node)) {
                setIsFornecedoresOpen(false);
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!nome.trim()) {
            setError('O nome do produto é obrigatório.');
            return;
        }

        const stockNumber = Number(stock);
        const stockMinimoNumber = Number(stockMinimo);
        const precoNumber = Number(preco);

        if (Number.isNaN(stockNumber) || stockNumber < 0) {
            setError('O stock deve ser um número maior ou igual a 0.');
            return;
        }

        if (Number.isNaN(stockMinimoNumber) || stockMinimoNumber < 0) {
            setError('O stock mínimo deve ser um número maior ou igual a 0.');
            return;
        }

        if (Number.isNaN(precoNumber) || precoNumber < 0) {
            setError('O preço deve ser um valor válido.');
            return;
        }

        if (selectedFornecedores.length > 1 && !fornecedorPreferencialId) {
            setError('Deve selecionar um fornecedor preferencial (estrela) quando existem múltiplos fornecedores associados.');
            return;
        }

        const fornecedoresData = selectedFornecedores.map(id => ({
            id,
            preco: parseFloat(fornecedorPrecos[id] || preco) || 0
        }));

        setError(null);
        setLoading(true);
        try {
            await produtoService.update(produto.id, {
                nome,
                stock: stockNumber,
                stockMinimo: stockMinimoNumber,
                preco: precoNumber,
                categoria: categoria || undefined,
                descricao: descricao || undefined,
                fornecedoresData: fornecedoresData.length > 0 ? fornecedoresData : undefined,
                fornecedorPreferencialId: fornecedorPreferencialId || undefined,
            });
            onSuccess();
            handleClose();
        } catch (error) {
            console.error('Erro ao editar produto:', error);
            setError('Ocorreu um erro ao editar o produto. Verifique a sua ligação.');
        } finally {
            setLoading(false);
        }
    };

    const SelectedCategoryIcon = CATEGORIES.find(c => c.name === categoria)?.icon || Tag;

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
        >
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
                onClick={handleClose}
            />

            {/* Modal Content */}
            <div
                className={`relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden transform transition-all duration-300 ${isClosing ? 'scale-95 translate-y-4' : 'scale-100 translate-y-0'}`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/80">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm border border-emerald-100 dark:border-emerald-500/20">
                            <Edit2 size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight">Editar Produto</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{produto.nome}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {showDeleteConfirm ? (
                            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-500/20 mr-2 animate-in slide-in-from-right-2">
                                <span className="text-xs font-bold text-red-600 dark:text-red-400 mr-2">Certeza?</span>
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                >
                                    Não
                                </button>
                                <button
                                    type="button"
                                    disabled={deleteLoading}
                                    onClick={async () => {
                                        setDeleteLoading(true);
                                        const success = await onDelete(produto.id, false);
                                        setDeleteLoading(false);
                                        if (success === false) {
                                            setShowDeleteConfirm(false);
                                            setShowForceDeleteConfirm(true);
                                        }
                                    }}
                                    className="text-xs px-2 py-1 bg-red-500 text-white font-bold rounded hover:bg-red-600 transition-colors shadow-sm disabled:opacity-50"
                                >
                                    Sim, Apagar
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(true)}
                                className="p-2 mr-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                                title="Apagar produto"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                        <button
                            onClick={handleClose}
                            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
                    {error && (
                        <div className="animate-shake rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 p-3 flex gap-3 items-center">
                            <AlertCircle className="text-red-500 shrink-0" size={18} />
                            <p className="text-sm font-medium text-red-800">{error}</p>
                        </div>
                    )}

                    {/* Section: Basic Info */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Informações do Item</h3>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-0.5">Nome do Produto</label>
                            <div className="relative group">
                                <input
                                    type="text"
                                    required
                                    value={nome}
                                    onChange={(e) => setNome(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all placeholder:text-slate-400 text-sm"
                                    placeholder="Ex: Vacina Nobivac L4"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5 relative" ref={categoryRef}>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-0.5">Categoria</label>
                                <button
                                    type="button"
                                    onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all flex items-center justify-between text-sm group"
                                >
                                    <div className="flex items-center gap-2">
                                        <SelectedCategoryIcon size={16} className={categoria ? "text-blue-500" : "text-slate-400"} />
                                        <span className={categoria ? "text-slate-900 dark:text-slate-100" : "text-slate-400"}>
                                            {categoria || "Selecionar..."}
                                        </span>
                                    </div>
                                    <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isCategoryOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isCategoryOpen && (
                                    <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 py-1.5 animate-in fade-in zoom-in-95 duration-200">
                                        {CATEGORIES.map((item) => (
                                            <button
                                                key={item.name}
                                                type="button"
                                                onClick={() => {
                                                    setCategoria(item.name);
                                                    setIsCategoryOpen(false);
                                                }}
                                                className={`w-full px-4 py-2 flex items-center gap-3 hover:bg-blue-50 dark:bg-blue-500/10 transition-colors text-sm ${categoria === item.name ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 font-medium' : 'text-slate-600 dark:text-slate-400'}`}
                                            >
                                                <item.icon size={16} className={item.color} />
                                                {item.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-1.5 pt-1">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-0.5">
                                    Preço Base (€)
                                </label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={preco}
                                        onChange={(e) => setPreco(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all text-sm"
                                        placeholder="0,00"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Suppliers Select */}
                        <div className="space-y-1.5 relative" ref={fornecedoresRef}>
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-0.5">Fornecedores Vinculados (Opcional)</label>
                                {selectedFornecedores.length > 1 && (
                                    <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full font-bold">Requer Preferencial ★</span>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsFornecedoresOpen(!isFornecedoresOpen)}
                                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all flex items-center justify-between text-sm group"
                            >
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <Factory size={16} className={selectedFornecedores.length > 0 ? "text-emerald-500 shrink-0" : "text-slate-400 shrink-0"} />
                                    <span className={`truncate ${selectedFornecedores.length > 0 ? "text-slate-900 dark:text-slate-100" : "text-slate-400"}`}>
                                        {selectedFornecedores.length > 0 
                                            ? `${selectedFornecedores.length} fornecedor(es) selecionado(s)` 
                                            : "Selecionar fornecedores..."}
                                    </span>
                                </div>
                                <ChevronDown size={16} className={`text-slate-400 shrink-0 transition-transform duration-200 ${isFornecedoresOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isFornecedoresOpen && (
                                <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 py-1.5 animate-in fade-in zoom-in-95 duration-200 max-h-48 overflow-y-auto custom-scrollbar">
                                    {fornecedores.length > 0 ? (
                                        fornecedores.map((fornecedor) => {
                                            const isSelected = selectedFornecedores.includes(fornecedor.id);
                                            return (
                                                <button
                                                    key={fornecedor.id}
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedFornecedores(prev => 
                                                            isSelected ? prev.filter(id => id !== fornecedor.id) : [...prev, fornecedor.id]
                                                        );
                                                    }}
                                                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900 transition-colors text-sm text-left group"
                                                >
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600 group-hover:border-emerald-400'}`}>
                                                        {isSelected && <Check size={12} strokeWidth={3} />}
                                                    </div>
                                                    <span className={`truncate flex-1 ${isSelected ? 'text-slate-900 dark:text-slate-100 font-medium' : 'text-slate-600 dark:text-slate-400'}`}>
                                                        {fornecedor.nome}
                                                    </span>
                                                    {isSelected && selectedFornecedores.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setFornecedorPreferencialId(fornecedor.id);
                                                            }}
                                                            className={`p-1 rounded-md transition-colors shrink-0 ${fornecedorPreferencialId === fornecedor.id ? 'text-amber-500 bg-amber-50 dark:bg-amber-500/10' : 'text-slate-300 hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-700/50'}`}
                                                            title={fornecedorPreferencialId === fornecedor.id ? 'Fornecedor Preferencial' : 'Marcar como Preferencial'}
                                                        >
                                                            <Star size={16} className={fornecedorPreferencialId === fornecedor.id ? 'fill-current' : ''} />
                                                        </button>
                                                    )}
                                                </button>
                                            );
                                        })
                                    ) : (
                                        <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 text-center italic">
                                            Nenhum fornecedor ativo disponível.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* List of selected suppliers to define price */}
                        {selectedFornecedores.length > 0 && (
                            <div className="space-y-2 mt-4 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                                    Preços Acordados por Fornecedor
                                </h4>
                                {selectedFornecedores.map(fId => {
                                    const fNome = fornecedores.find(f => f.id === fId)?.nome || '';
                                    return (
                                        <div key={fId} className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${fornecedorPreferencialId === fId ? 'bg-amber-400' : 'bg-emerald-400'}`}></div>
                                                <span className={`text-sm font-medium ${fornecedorPreferencialId === fId ? 'text-amber-700 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>{fNome}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="relative w-24">
                                                    <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={fornecedorPrecos[fId] || ''}
                                                        onChange={(e) => setFornecedorPrecos(prev => ({ ...prev, [fId]: e.target.value }))}
                                                        placeholder={preco || '0.00'}
                                                        className="w-full pl-6 pr-2 py-1 text-sm font-semibold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <p className="text-[10px] text-slate-400 mt-2">
                                    O preço do fornecedor <strong className="text-amber-500">★ Preferencial</strong> substituirá o preço base do produto.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Section: Stock */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Níveis de Inventário</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5 pt-1">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-0.5">Stock Atual</label>
                                <div className="relative">
                                    <Database className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={stock}
                                        onChange={(e) => setStock(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all text-sm font-medium"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5 pt-1">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-0.5">Stock Mínimo</label>
                                <div className="relative">
                                    <AlertCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={stockMinimo}
                                        onChange={(e) => setStockMinimo(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all text-sm font-medium"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Description */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-0.5">Descrição Curta</label>
                        <div className="relative">
                            <FileText className="absolute left-3.5 top-3 text-slate-400" size={16} />
                            <textarea
                                value={descricao}
                                onChange={(e) => setDescricao(e.target.value)}
                                rows={2}
                                className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all placeholder:text-slate-400 text-sm resize-none"
                                placeholder="Informação adicional opcional..."
                            />
                        </div>
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900 transition-all text-sm"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    A atualizar...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={18} />
                                    Guardar Alterações
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Confirm Force Delete Modal */}
            {showForceDeleteConfirm && (
                <div 
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowForceDeleteConfirm(false);
                        }
                    }}
                >
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6">
                            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-4">
                                <AlertTriangle size={24} className="text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Atenção!</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Este produto está associado a uma ou mais encomendas. Tem a certeza que pretende apagá-lo? Será também removido das referidas encomendas.
                            </p>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowForceDeleteConfirm(false)}
                                disabled={deleteLoading}
                                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 transition-colors disabled:opacity-50 focus:outline-none"
                            >
                                Voltar
                            </button>
                            <button
                                type="button"
                                onClick={async () => {
                                    setDeleteLoading(true);
                                    await onDelete(produto.id, true);
                                    setDeleteLoading(false);
                                    setShowForceDeleteConfirm(false);
                                }}
                                disabled={deleteLoading}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm focus:ring-2 focus:ring-red-500 focus:ring-offset-1 flex items-center gap-2 disabled:opacity-50 outline-none"
                            >
                                {deleteLoading ? 'A apagar...' : 'Sim, Apagar Mesmo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EditarProdutoModal;
