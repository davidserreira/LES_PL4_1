import { useState, useEffect, useRef } from 'react';
import {
    X, AlertCircle, CheckCircle2, Factory, Hash, Phone, Loader2, Mail, Tag, ChevronDown, Pill, Syringe, Bath, Stethoscope, Layers, FileText, Pencil
} from 'lucide-react';
import { fornecedorService } from '../services/fornecedorService';
import { produtoService } from '../services/produtoService';

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
    produtos?: { id: number; nome: string }[];
}

interface EditarFornecedorModalProps {
    isOpen: boolean;
    fornecedor: Fornecedor | null;
    onClose: () => void;
    onSuccess: () => void;
}

const CATEGORIES = [
    { name: 'Medicamentos', icon: Pill, color: 'text-blue-500' },
    { name: 'Vacinas', icon: Syringe, color: 'text-emerald-500' },
    { name: 'Higiene', icon: Bath, color: 'text-sky-500' },
    { name: 'Equipamento', icon: Stethoscope, color: 'text-violet-500' },
    { name: 'Outros', icon: Layers, color: 'text-slate-500' },
];

const EditarFornecedorModal = ({ isOpen, fornecedor, onClose, onSuccess }: EditarFornecedorModalProps) => {
    const [nome, setNome] = useState('');
    const [nif, setNif] = useState('');
    const [contacto, setContacto] = useState('');
    const [email, setEmail] = useState('');
    const [categoria, setCategoria] = useState('');
    const [observacoes, setObservacoes] = useState('');
    const [estado, setEstado] = useState(true);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isClosing, setIsClosing] = useState(false);
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    
    // Associar produtos
    const [produtoIds, setProdutoIds] = useState<number[]>([]);
    const [produtosLista, setProdutosLista] = useState<{ id: number; nome: string; categoria?: string }[]>([]);

    const categoryRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && fornecedor) {
            setIsClosing(false);
            setError(null);
            setIsCategoryOpen(false);
            setNome(fornecedor.nome);
            setNif(fornecedor.nif);
            setContacto(fornecedor.contacto);
            setEmail(fornecedor.email);
            setCategoria(fornecedor.categoria);
            setObservacoes(fornecedor.observacoes || '');
            setEstado(fornecedor.estado);
            setProdutoIds(fornecedor.produtos?.map(p => p.id) || []);
            
            // Carregar todos os produtos para a lista
            produtoService.getAll()
                .then(data => setProdutosLista(data))
                .catch(err => console.error('Erro ao carregar produtos', err));
        }
    }, [isOpen, fornecedor]);

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
    if (!fornecedor) return null;

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
        if (!categoria) {
            setError('A categoria é obrigatória.');
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
            await fornecedorService.update(fornecedor.id, {
                nome,
                nif,
                contacto,
                email,
                categoria,
                observacoes: observacoes || undefined,
                estado,
                produtoIds,
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

    const SelectedCategoryIcon = CATEGORIES.find(c => c.name === categoria)?.icon || Tag;

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
            <div
                className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
                onClick={handleClose}
            />

            <div className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden transform transition-all duration-300 ${isClosing ? 'scale-95 translate-y-4' : 'scale-100 translate-y-0'}`}>
                <div className="bg-slate-900 p-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Pencil size={20} className="text-amber-400" />
                                Editar Fornecedor
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

                <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
                    {error && (
                        <div className="animate-shake rounded-lg bg-red-50 border border-red-100 p-3 flex gap-3 items-center">
                            <AlertCircle className="text-red-500 shrink-0" size={18} />
                            <p className="text-sm font-medium text-red-800">{error}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Informações do Fornecedor</h3>

                        <div className="space-y-1.5 pt-1">
                            <label className="text-sm font-medium text-slate-700 ml-0.5">Designação / Nome da Empresa</label>
                            <div className="relative">
                                <Factory className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    required
                                    value={nome}
                                    onChange={(e) => setNome(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all placeholder:text-slate-400 text-sm"
                                    placeholder="Ex: Farmácia Vet Lda."
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5 pt-1">
                            <label className="text-sm font-medium text-slate-700 ml-0.5">Email Profissional/Empresa *</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all placeholder:text-slate-400 text-sm"
                                    placeholder="Ex: geral@empresa.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5 pt-1 relative" ref={categoryRef}>
                            <label className="text-sm font-medium text-slate-700 ml-0.5">Categoria de Fornecimento *</label>
                            <button
                                type="button"
                                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all flex items-center justify-between text-sm group"
                            >
                                <div className="flex items-center gap-2">
                                    <SelectedCategoryIcon size={16} className={categoria ? CATEGORIES.find(c => c.name === categoria)?.color : "text-slate-400"} />
                                    <span className={categoria ? "text-slate-900" : "text-slate-400"}>
                                        {categoria || "Selecionar categoria..."}
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5 pt-1">
                                <label className="text-sm font-medium text-slate-700 ml-0.5">NIF *</label>
                                <div className="relative">
                                    <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        required
                                        value={nif}
                                        onChange={(e) => setNif(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all text-sm"
                                        placeholder="Ex: 500123456"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5 pt-1">
                                <label className="text-sm font-medium text-slate-700 ml-0.5">Contacto Telefónico *</label>
                                <div className="relative">
                                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        required
                                        value={contacto}
                                        onChange={(e) => setContacto(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all text-sm"
                                        placeholder="Ex: 912345678"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-xl border border-slate-100">
                            <label className="text-sm font-medium text-slate-700">Estado do fornecedor</label>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={estado}
                                onClick={() => setEstado(!estado)}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${estado ? 'bg-emerald-500' : 'bg-slate-200'}`}
                            >
                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${estado ? 'translate-x-5' : 'translate-x-1'}`} />
                            </button>
                            <span className={`text-sm font-semibold ${estado ? 'text-emerald-600' : 'text-slate-500'}`}>
                                {estado ? 'Ativo' : 'Inativo'}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-1.5 pt-2">
                        <label className="text-sm font-medium text-slate-700 ml-0.5">Observações</label>
                        <div className="relative">
                            <FileText className="absolute left-3.5 top-3 text-slate-400" size={16} />
                            <textarea
                                value={observacoes}
                                onChange={(e) => setObservacoes(e.target.value)}
                                rows={2}
                                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all placeholder:text-slate-400 text-sm resize-none custom-scrollbar"
                                placeholder="Informação adicional opcional..."
                            />
                        </div>
                    </div>

                    {/* Section: Associar Produtos */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                        <div className="flex items-center">
                            <label className="text-sm font-medium text-slate-700 ml-0.5">Produtos Fornecidos</label>
                            {!estado && <span className="text-xs text-red-500 font-bold ml-2">(Ative o fornecedor para associar produtos)</span>}
                        </div>
                        <p className="text-xs text-slate-500 ml-0.5 mb-2">Selecione os produtos que este fornecedor disponibiliza.</p>
                        
                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                            <div className="max-h-48 overflow-y-auto custom-scrollbar p-2">
                                {produtosLista.length > 0 ? (
                                    produtosLista.map(produto => (
                                        <label key={produto.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group">
                                            <div className="relative flex items-center">
                                                <input
                                                    type="checkbox"
                                                    className="w-5 h-5 border-2 border-slate-300 rounded peer checked:bg-blue-600 checked:border-blue-600 appearance-none cursor-pointer text-white transition-all"
                                                    checked={produtoIds.includes(produto.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setProdutoIds([...produtoIds, produto.id]);
                                                        } else {
                                                            setProdutoIds(produtoIds.filter(id => id !== produto.id));
                                                        }
                                                    }}
                                                    disabled={!estado}
                                                />
                                                <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 left-1 top-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">{produto.nome}</p>
                                                {produto.categoria && (
                                                    <span className="text-[10px] uppercase font-bold text-slate-400">{produto.categoria}</span>
                                                )}
                                            </div>
                                        </label>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-sm text-slate-500 italic">
                                        Nenhum produto disponível no sistema.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

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
                            className="flex-[2] bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50 text-sm flex items-center justify-center gap-2 shadow-sm"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    A guardar...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={18} />
                                    Guardar alterações
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditarFornecedorModal;
