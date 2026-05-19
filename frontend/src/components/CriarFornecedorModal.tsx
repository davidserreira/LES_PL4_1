import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    X, AlertCircle, CheckCircle2, Factory, Hash, Phone, Loader2, Plus, Mail, Tag, ChevronDown, Pill, Syringe, Bath, Stethoscope, Layers, FileText
} from 'lucide-react';
import { fornecedorService } from '../services/fornecedorService';
import { produtoService } from '../services/produtoService';

interface CriarFornecedorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const CATEGORIES = [
    { name: 'Medicamentos', icon: Pill, color: 'text-blue-500' },
    { name: 'Vacinas', icon: Syringe, color: 'text-emerald-500' },
    { name: 'Higiene', icon: Bath, color: 'text-sky-500' },
    { name: 'Equipamento', icon: Stethoscope, color: 'text-violet-500' },
    { name: 'Outros', icon: Layers, color: 'text-slate-500 dark:text-slate-400' },
];

const CriarFornecedorModal = ({ isOpen, onClose, onSuccess }: CriarFornecedorModalProps) => {
    const [nome, setNome] = useState('');
    const [nif, setNif] = useState('');
    const [contacto, setContacto] = useState('');
    const [email, setEmail] = useState('');
    const [categorias, setCategorias] = useState<string[]>([]);
    const [observacoes, setObservacoes] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isClosing, setIsClosing] = useState(false);
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    
    // Associar produtos
    const [produtoIds, setProdutoIds] = useState<number[]>([]);
    const [produtos, setProdutos] = useState<{ id: number; nome: string; categoria?: string }[]>([]);

    const categoryRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setIsClosing(false);
            setError(null);
            setIsCategoryOpen(false);
            setProdutoIds([]);
            
            // Carregar produtos para associação
            produtoService.getAll()
                .then(data => setProdutos(data))
                .catch(err => console.error('Erro ao carregar produtos', err));
        }
    }, [isOpen]);

    useEffect(() => {
        setProdutoIds(prev => {
            const validIds = prev.filter(id => {
                const p = produtos.find(prod => prod.id === id);
                return p && (!p.categoria || categorias.includes(p.categoria));
            });
            return validIds.length !== prev.length ? validIds : prev;
        });
    }, [categorias, produtos]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
                setIsCategoryOpen(false);
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
            setError('O nome do fornecedor é obrigatório.');
            return;
        }

        if (!nif.trim()) {
            setError('O NIF é obrigatório.');
            return;
        }

        if (!contacto.trim()) {
            setError('O contacto telefónico é obrigatório.');
            return;
        }

        if (!email.trim()) {
            setError('O email é obrigatório.');
            return;
        }

        if (categorias.length === 0) {
            setError('É obrigatório selecionar pelo menos uma categoria.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            setError('O email fornecido não é válido.');
            return;
        }

        const numericRegex = /^\d{9}$/;

        if (!numericRegex.test(nif.trim())) {
            setError('O NIF deve conter exatamente 9 números.');
            return;
        }

        if (!numericRegex.test(contacto.trim())) {
            setError('O contacto telefónico deve conter exatamente 9 números.');
            return;
        }

        setError(null);
        setLoading(true);
        try {
            await fornecedorService.create({
                nome,
                nif,
                contacto,
                email,
                categorias,
                observacoes: observacoes || undefined,
                produtoIds,
            });
            onSuccess();
            handleClose();
            // Reset form
            setNome('');
            setNif('');
            setContacto('');
            setEmail('');
            setCategorias([]);
            setObservacoes('');
            setProdutoIds([]);
        } catch (error: any) {
            console.error('Erro ao criar fornecedor:', error);
            setError(error.response?.data?.error || 'Ocorreu um erro ao criar o fornecedor.');
        } finally {
            setLoading(false);
        }
    };

    const produtosFiltrados = produtos.filter(p => !p.categoria || categorias.includes(p.categoria));

    return createPortal(
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
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
                            <Plus size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight">Novo Fornecedor</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Preencha os dados do novo fornecedor</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
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
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Informações do Fornecedor</h3>

                        <div className="space-y-1.5 pt-1">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-0.5">Designação / Nome da Empresa</label>
                            <div className="relative">
                                <Factory className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    required
                                    value={nome}
                                    onChange={(e) => setNome(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all placeholder:text-slate-400 text-sm"
                                    placeholder="Ex: Farmácia Vet Lda."
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5 pt-1">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-0.5">Email Profissional/Empresa *</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all placeholder:text-slate-400 text-sm"
                                    placeholder="Ex: geral@empresa.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5 pt-1 relative" ref={categoryRef}>
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-0.5">Categorias de Fornecimento *</label>
                            <button
                                type="button"
                                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all flex items-center justify-between text-sm group"
                            >
                                <div className="flex items-center gap-2">
                                    <Tag size={16} className={categorias.length > 0 ? "text-blue-500" : "text-slate-400"} />
                                    <span className={categorias.length > 0 ? "text-slate-900 dark:text-slate-100" : "text-slate-400"}>
                                        {categorias.length > 0 ? categorias.join(', ') : "Selecionar categorias..."}
                                    </span>
                                </div>
                                <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isCategoryOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isCategoryOpen && (
                                <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 py-1.5 animate-in fade-in zoom-in-95 duration-200">
                                    {CATEGORIES.map((item) => (
                                        <label
                                            key={item.name}
                                            className={`w-full px-4 py-2 flex items-center gap-3 hover:bg-blue-50 dark:bg-blue-500/10 cursor-pointer transition-colors text-sm ${categorias.includes(item.name) ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 font-medium' : 'text-slate-600 dark:text-slate-400'}`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={categorias.includes(item.name)}
                                                onChange={() => {
                                                    if (categorias.includes(item.name)) {
                                                        setCategorias(categorias.filter(c => c !== item.name));
                                                    } else {
                                                        setCategorias([...categorias, item.name]);
                                                    }
                                                }}
                                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                                            />
                                            <item.icon size={16} className={item.color} />
                                            {item.name}
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5 pt-1">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-0.5">NIF *</label>
                                <div className="relative">
                                    <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        required
                                        value={nif}
                                        onChange={(e) => setNif(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all text-sm"
                                        placeholder="Ex: 500123456"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5 pt-1">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-0.5">Contacto Telefónico *</label>
                                <div className="relative">
                                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        required
                                        value={contacto}
                                        onChange={(e) => setContacto(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all text-sm"
                                        placeholder="Ex: 912345678"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5 pt-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-0.5">Observações</label>
                        <div className="relative">
                            <FileText className="absolute left-3.5 top-3 text-slate-400" size={16} />
                            <textarea
                                value={observacoes}
                                onChange={(e) => setObservacoes(e.target.value)}
                                rows={2}
                                className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all placeholder:text-slate-400 text-sm resize-none custom-scrollbar"
                                placeholder="Informação adicional opcional..."
                            />
                        </div>
                    </div>
                    
                    {/* Section: Associar Produtos */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-0.5">Produtos Fornecidos</label>
                        <p className="text-xs text-slate-500 dark:text-slate-400 ml-0.5 mb-2">Selecione os produtos que este fornecedor disponibiliza.</p>
                        
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                            <div className="max-h-48 overflow-y-auto custom-scrollbar p-2">
                                {categorias.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400 italic">
                                        Selecione pelo menos uma categoria acima para ver os produtos disponíveis.
                                    </div>
                                ) : produtosFiltrados.length > 0 ? (
                                    produtosFiltrados.map(produto => (
                                        <label key={produto.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900 rounded-lg cursor-pointer transition-colors group">
                                            <div className="relative flex items-center">
                                                <input
                                                    type="checkbox"
                                                    className="w-5 h-5 border-2 border-slate-300 dark:border-slate-600 rounded peer checked:bg-blue-600 checked:border-blue-600 appearance-none cursor-pointer text-white transition-all"
                                                    checked={produtoIds.includes(produto.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setProdutoIds([...produtoIds, produto.id]);
                                                        } else {
                                                            setProdutoIds(produtoIds.filter(id => id !== produto.id));
                                                        }
                                                    }}
                                                />
                                                <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 left-1 top-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:text-slate-100 transition-colors">{produto.nome}</p>
                                                {produto.categoria && (
                                                    <span className="text-[10px] uppercase font-bold text-slate-400">{produto.categoria}</span>
                                                )}
                                            </div>
                                        </label>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400 italic">
                                        Nenhum produto encontrado para as categorias selecionadas.
                                    </div>
                                )}
                            </div>
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
                            className="flex-[2] bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50 text-sm flex items-center justify-center gap-2 shadow-sm"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    A processar...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={18} />
                                    Registar Fornecedor
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default CriarFornecedorModal;
