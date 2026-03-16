import { useState, useEffect, useRef } from 'react';
import {
    X, Database, AlertCircle, CheckCircle2,
    DollarSign, Tag, FileText, Edit2, Loader2,
    Pill, Syringe, Bath, Stethoscope, Layers, ChevronDown, Trash2, Factory, Check
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
}

interface EditarProdutoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    onDelete: (id: number) => void;
    produto: Produto;
}

const CATEGORIES = [
    { name: 'Medicamentos', icon: Pill, color: 'text-blue-500' },
    { name: 'Vacinas', icon: Syringe, color: 'text-emerald-500' },
    { name: 'Higiene', icon: Bath, color: 'text-sky-500' },
    { name: 'Equipamento', icon: Stethoscope, color: 'text-violet-500' },
    { name: 'Outros', icon: Layers, color: 'text-slate-500' },
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
    const [isFornecedoresOpen, setIsFornecedoresOpen] = useState(false);

    // Deletion visual state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
            
            setIsClosing(false);
            setError(null);
            setIsCategoryOpen(false);
            setShowDeleteConfirm(false);
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
                fornecedorIds: selectedFornecedores, // Can be empty array if all are removed
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
                className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden transform transition-all duration-300 ${isClosing ? 'scale-95 translate-y-4' : 'scale-100 translate-y-0'}`}
            >
                {/* Minimal Header */}
                <div className="bg-slate-900 p-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Edit2 size={20} className="text-blue-400" />
                                Editar Produto
                            </h2>
                        </div>
                        <div className="flex items-center gap-2">
                            {showDeleteConfirm ? (
                                <div className="flex items-center gap-2 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 mr-2 animate-in slide-in-from-right-2">
                                    <span className="text-xs font-bold text-red-400 mr-2">Certeza?</span>
                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="text-xs px-2 py-1 bg-slate-800 text-slate-300 font-medium rounded hover:bg-slate-700 transition-colors"
                                    >
                                        Não
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onDelete(produto.id)}
                                        className="text-xs px-2 py-1 bg-red-500 text-white font-bold rounded hover:bg-red-600 transition-colors shadow-sm"
                                    >
                                        Sim, Apagar
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="p-1.5 mr-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                    title="Apagar produto"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                            <button
                                onClick={handleClose}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
                    {error && (
                        <div className="animate-shake rounded-lg bg-red-50 border border-red-100 p-3 flex gap-3 items-center">
                            <AlertCircle className="text-red-500 shrink-0" size={18} />
                            <p className="text-sm font-medium text-red-800">{error}</p>
                        </div>
                    )}

                    {/* Section: Basic Info */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Informações do Item</h3>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700 ml-0.5">Nome do Produto</label>
                            <div className="relative group">
                                <input
                                    type="text"
                                    required
                                    value={nome}
                                    onChange={(e) => setNome(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all placeholder:text-slate-400 text-sm"
                                    placeholder="Ex: Vacina Nobivac L4"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5 relative" ref={categoryRef}>
                                <label className="text-sm font-medium text-slate-700 ml-0.5">Categoria</label>
                                <button
                                    type="button"
                                    onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all flex items-center justify-between text-sm group"
                                >
                                    <div className="flex items-center gap-2">
                                        <SelectedCategoryIcon size={16} className={categoria ? "text-blue-500" : "text-slate-400"} />
                                        <span className={categoria ? "text-slate-900" : "text-slate-400"}>
                                            {categoria || "Selecionar..."}
                                        </span>
                                    </div>
                                    <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isCategoryOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isCategoryOpen && (
                                    <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-20 py-1.5 animate-in fade-in zoom-in-95 duration-200">
                                        {CATEGORIES.map((item) => (
                                            <button
                                                key={item.name}
                                                type="button"
                                                onClick={() => {
                                                    setCategoria(item.name);
                                                    setIsCategoryOpen(false);
                                                }}
                                                className={`w-full px-4 py-2 flex items-center gap-3 hover:bg-blue-50 transition-colors text-sm ${categoria === item.name ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600'}`}
                                            >
                                                <item.icon size={16} className={item.color} />
                                                {item.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-1.5 pt-1">
                                <label className="text-sm font-medium text-slate-700 ml-0.5">Preço (€)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={preco}
                                        onChange={(e) => setPreco(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all text-sm"
                                        placeholder="0,00"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Suppliers Select */}
                        <div className="space-y-1.5 relative" ref={fornecedoresRef}>
                            <label className="text-sm font-medium text-slate-700 ml-0.5">Fornecedores Vinculados (Opcional)</label>
                            <button
                                type="button"
                                onClick={() => setIsFornecedoresOpen(!isFornecedoresOpen)}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all flex items-center justify-between text-sm group"
                            >
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <Factory size={16} className={selectedFornecedores.length > 0 ? "text-emerald-500 shrink-0" : "text-slate-400 shrink-0"} />
                                    <span className={`truncate ${selectedFornecedores.length > 0 ? "text-slate-900" : "text-slate-400"}`}>
                                        {selectedFornecedores.length > 0 
                                            ? `${selectedFornecedores.length} fornecedor(es) selecionado(s)` 
                                            : "Selecionar fornecedores..."}
                                    </span>
                                </div>
                                <ChevronDown size={16} className={`text-slate-400 shrink-0 transition-transform duration-200 ${isFornecedoresOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isFornecedoresOpen && (
                                <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-20 py-1.5 animate-in fade-in zoom-in-95 duration-200 max-h-48 overflow-y-auto custom-scrollbar">
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
                                                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 transition-colors text-sm text-left group"
                                                >
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 group-hover:border-emerald-400'}`}>
                                                        {isSelected && <Check size={12} strokeWidth={3} />}
                                                    </div>
                                                    <span className={`truncate ${isSelected ? 'text-slate-900 font-medium' : 'text-slate-600'}`}>
                                                        {fornecedor.nome}
                                                    </span>
                                                </button>
                                            );
                                        })
                                    ) : (
                                        <div className="px-4 py-3 text-sm text-slate-500 text-center italic">
                                            Nenhum fornecedor ativo disponível.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Section: Stock */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Níveis de Inventário</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5 pt-1">
                                <label className="text-sm font-medium text-slate-700 ml-0.5">Stock Atual</label>
                                <div className="relative">
                                    <Database className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={stock}
                                        onChange={(e) => setStock(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all text-sm font-medium"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5 pt-1">
                                <label className="text-sm font-medium text-slate-700 ml-0.5">Stock Mínimo</label>
                                <div className="relative">
                                    <AlertCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={stockMinimo}
                                        onChange={(e) => setStockMinimo(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all text-sm font-medium"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Description */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 ml-0.5">Descrição Curta</label>
                        <div className="relative">
                            <FileText className="absolute left-3.5 top-3 text-slate-400" size={16} />
                            <textarea
                                value={descricao}
                                onChange={(e) => setDescricao(e.target.value)}
                                rows={2}
                                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all placeholder:text-slate-400 text-sm resize-none"
                                placeholder="Informação adicional opcional..."
                            />
                        </div>
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-all text-sm"
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
        </div>
    );
};

export default EditarProdutoModal;
