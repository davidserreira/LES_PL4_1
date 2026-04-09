import { useState, useEffect } from 'react';
import { X, CheckCircle2, Loader2, FileText, AlertCircle, TrendingUp, HandCoins, Truck, CalendarDays } from 'lucide-react';
import { fornecedorService } from '../services/fornecedorService';

interface Fornecedor {
    id: number;
    nome: string;
    nif: string;
    contacto: string;
    email: string;
    categoria: string;
    estado: boolean;
    observacoes?: string;
    valorMinimoEncomenda?: number | null;
    prazoMedioEntrega?: number | null;
    custoTransporte?: number | null;
    metodoPagamento?: string | null;
    diasEntrega?: string | null;
}

interface EditarCondicoesModalProps {
    isOpen: boolean;
    fornecedor: Fornecedor | null;
    onClose: () => void;
    onSuccess: () => void;
}

const EditarCondicoesModal = ({ isOpen, fornecedor, onClose, onSuccess }: EditarCondicoesModalProps) => {
    const [valorMinimo, setValorMinimo] = useState('');
    const [prazo, setPrazo] = useState('');
    const [custo, setCusto] = useState('');
    const [pagamento, setPagamento] = useState('');
    const [dias, setDias] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        if (isOpen && fornecedor) {
            setIsClosing(false);
            setError(null);
            setValorMinimo(fornecedor.valorMinimoEncomenda != null ? fornecedor.valorMinimoEncomenda.toString() : '');
            setPrazo(fornecedor.prazoMedioEntrega != null ? fornecedor.prazoMedioEntrega.toString() : '');
            setCusto(fornecedor.custoTransporte != null ? fornecedor.custoTransporte.toString() : '');
            setPagamento(fornecedor.metodoPagamento || '');
            setDias(fornecedor.diasEntrega || '');
        }
    }, [isOpen, fornecedor]);

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
        setError(null);
        setLoading(true);

        const vMinimo = valorMinimo ? parseFloat(valorMinimo) : null;
        const cTransporte = custo ? parseFloat(custo) : null;
        const pEntrega = prazo ? parseInt(prazo, 10) : null;

        if ((valorMinimo && isNaN(vMinimo as number)) || (custo && isNaN(cTransporte as number))) {
            setError('Por favor, informe valores numéricos válidos (use ponto para decimais).');
            setLoading(false);
            return;
        }

        try {
            await fornecedorService.update(fornecedor.id, {
                nome: fornecedor.nome,
                nif: fornecedor.nif,
                contacto: fornecedor.contacto,
                email: fornecedor.email,
                categoria: fornecedor.categoria,
                estado: fornecedor.estado,
                observacoes: fornecedor.observacoes,
                valorMinimoEncomenda: vMinimo !== null ? vMinimo : undefined,
                prazoMedioEntrega: pEntrega !== null ? pEntrega : undefined,
                custoTransporte: cTransporte !== null ? cTransporte : undefined,
                metodoPagamento: pagamento || undefined,
                diasEntrega: dias || undefined,
            });
            onSuccess();
            handleClose();
        } catch (err: any) {
            console.error('Erro na submissão de condições:', err);
            setError('Erro ao guardar as condições comerciais.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 transition-all duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
            <div
                className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
                onClick={handleClose}
            />

            <div className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden transform transition-all duration-300 ${isClosing ? 'scale-95 translate-y-4' : 'scale-100 translate-y-0'}`}>
                <div className="bg-slate-900 p-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <FileText size={20} className="text-emerald-400" />
                            Editar Condições de Compra
                        </h2>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5 pt-1">
                            <label className="text-sm font-medium text-slate-700 ml-0.5">Valor Mínimo Encomenda (€)</label>
                            <div className="relative">
                                <TrendingUp className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={valorMinimo}
                                    onChange={(e) => setValorMinimo(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600/5 focus:border-emerald-600 outline-none transition-all text-sm"
                                    placeholder="Ex: 50.00"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5 pt-1">
                            <label className="text-sm font-medium text-slate-700 ml-0.5">Prazo Médio Entrega (Dias)</label>
                            <div className="relative">
                                <Truck className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="number"
                                    min="0"
                                    value={prazo}
                                    onChange={(e) => setPrazo(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600/5 focus:border-emerald-600 outline-none transition-all text-sm"
                                    placeholder="Ex: 5"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5 pt-1">
                            <label className="text-sm font-medium text-slate-700 ml-0.5">Custo de Transporte (€)</label>
                            <div className="relative">
                                <TrendingUp className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={custo}
                                    onChange={(e) => setCusto(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600/5 focus:border-emerald-600 outline-none transition-all text-sm"
                                    placeholder="Ex: 15.00"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                        <label className="text-sm font-medium text-slate-700 ml-0.5">Método de Pagamento</label>
                        <div className="relative">
                            <HandCoins className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                value={pagamento}
                                onChange={(e) => setPagamento(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600/5 focus:border-emerald-600 outline-none transition-all text-sm"
                                placeholder="Ex: Transferência Bancária (30 dias)"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                        <label className="text-sm font-medium text-slate-700 ml-0.5">Dias Habituais de Entrega</label>
                        <div className="relative">
                            <CalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                value={dias}
                                onChange={(e) => setDias(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600/5 focus:border-emerald-600 outline-none transition-all text-sm"
                                placeholder="Ex: Terças e Quintas"
                            />
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
                            className="flex-[2] bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-all active:scale-[0.98] disabled:opacity-50 text-sm flex items-center justify-center gap-2 shadow-sm"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    A guardar...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={18} />
                                    Submeter Condições
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditarCondicoesModal;
