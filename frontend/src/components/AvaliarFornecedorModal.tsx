import { useEffect, useMemo, useState } from 'react';
import { X, AlertCircle, CheckCircle2, Star, Loader2 } from 'lucide-react';
import { fornecedorService } from '../services/fornecedorService';

interface Fornecedor {
    id: number;
    nome: string;
}

interface AvaliarFornecedorModalProps {
    isOpen: boolean;
    fornecedor: Fornecedor | null;
    utilizadorId: number | null;
    onClose: () => void;
    onSuccess: (updated: boolean) => void;
}

type CriterioKey = 'qualidade' | 'pontualidade' | 'comunicacao' | 'preco' | 'conformidade';

const CRITERIOS: { key: CriterioKey; label: string }[] = [
    { key: 'qualidade', label: 'Qualidade dos Produtos' },
    { key: 'pontualidade', label: 'Pontualidade na Entrega' },
    { key: 'comunicacao', label: 'Comunicação / Atendimento' },
    { key: 'preco', label: 'Preço / Condições' },
    { key: 'conformidade', label: 'Conformidade da Encomenda' },
];

const isValidRating = (n: number) => Number.isInteger(n) && n >= 1 && n <= 5;

const StarsRating = ({ value, onChange }: { value: number; onChange: (n: number) => void }) => {
    return (
        <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, idx) => {
                const starValue = idx + 1;
                const active = starValue <= value;
                return (
                    <button
                        key={starValue}
                        type="button"
                        onClick={() => onChange(starValue)}
                        className={`p-1 rounded-lg transition-colors ${active ? 'text-amber-500' : 'text-slate-300 hover:text-slate-400'}`}
                        aria-label={`Selecionar ${starValue} estrelas`}
                    >
                        <Star size={18} className={active ? 'fill-current' : ''} />
                    </button>
                );
            })}
        </div>
    );
};

const AvaliarFornecedorModal = ({ isOpen, fornecedor, utilizadorId, onClose, onSuccess }: AvaliarFornecedorModalProps) => {
    const [isClosing, setIsClosing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingExisting, setLoadingExisting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    const [ratings, setRatings] = useState<Record<CriterioKey, number>>({
        qualidade: 0,
        pontualidade: 0,
        comunicacao: 0,
        preco: 0,
        conformidade: 0,
    });
    const [comentario, setComentario] = useState('');

    const mediaPreview = useMemo(() => {
        const sum = Object.values(ratings).reduce((acc, v) => acc + v, 0);
        return sum / 5;
    }, [ratings]);

    useEffect(() => {
        if (isOpen) {
            setIsClosing(false);
            setError(null);
        }
        if (!isOpen || !fornecedor) return;

        // Reset UI state on open, then try to load existing evaluation (edit flow)
        setIsEditing(false);
        setLoadingExisting(false);
        setRatings({
            qualidade: 0,
            pontualidade: 0,
            comunicacao: 0,
            preco: 0,
            conformidade: 0,
        });
        setComentario('');

        if (!utilizadorId) {
            setError('Utilizador não autenticado.');
            return;
        }

        let cancelled = false;
        (async () => {
            try {
                setLoadingExisting(true);
                const existing = await fornecedorService.getMinhaAvaliacao(fornecedor.id, utilizadorId);
                if (cancelled) return;
                if (existing) {
                    setIsEditing(true);
                    setRatings({
                        qualidade: existing.qualidade,
                        pontualidade: existing.pontualidade,
                        comunicacao: existing.comunicacao,
                        preco: existing.preco,
                        conformidade: existing.conformidade,
                    });
                    setComentario(existing.comentario || '');
                }
            } catch {
                if (!cancelled) {
                    // If we fail to fetch, keep create mode but do not block user from submitting
                    setIsEditing(false);
                }
            } finally {
                if (!cancelled) setLoadingExisting(false);
            }
        })();

        return () => { cancelled = true; };
    }, [isOpen, fornecedor, utilizadorId]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setIsClosing(false);
        }, 250);
    };

    if (!isOpen && !isClosing) return null;
    if (!fornecedor) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!utilizadorId) {
            setError('Utilizador não autenticado.');
            return;
        }

        if (!Object.values(ratings).every(isValidRating)) {
            setError('Seleciona uma pontuação (1–5) em todos os critérios.');
            return;
        }

        setLoading(true);
        try {
            const res = await fornecedorService.avaliar(fornecedor.id, {
                utilizadorId,
                qualidade: ratings.qualidade,
                pontualidade: ratings.pontualidade,
                comunicacao: ratings.comunicacao,
                preco: ratings.preco,
                conformidade: ratings.conformidade,
                comentario: comentario.trim() || undefined,
            });
            onSuccess(Boolean(res?.updated));
            handleClose();
        } catch (err: unknown) {
            const errorMessage = err && typeof err === 'object' && 'response' in err
                ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
                : undefined;
            setError(errorMessage || 'Ocorreu um erro ao registar a avaliação.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
            <div
                className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
                onClick={handleClose}
            />

            <div className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden transform transition-all duration-300 ${isClosing ? 'scale-95 translate-y-4' : 'scale-100 translate-y-0'}`}>
                <div className="bg-slate-900 p-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <CheckCircle2 size={20} className="text-emerald-400" />
                            {isEditing ? 'Editar avaliação' : 'Avaliar Fornecedor'}
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
                    {loadingExisting && (
                        <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 flex gap-3 items-center">
                            <Loader2 className="animate-spin text-slate-500 shrink-0" size={18} />
                            <p className="text-sm font-medium text-slate-700">A carregar a tua avaliação...</p>
                        </div>
                    )}
                    {error && (
                        <div className="animate-shake rounded-lg bg-red-50 border border-red-100 p-3 flex gap-3 items-center">
                            <AlertCircle className="text-red-500 shrink-0" size={18} />
                            <p className="text-sm font-medium text-red-800">{error}</p>
                        </div>
                    )}

                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                        <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Fornecedor</div>
                        <div className="mt-1 text-lg font-bold text-slate-900">{fornecedor.nome}</div>
                        <div className="mt-2 text-sm font-semibold text-slate-600 flex items-center gap-2">
                            <span className="text-slate-400">Média desta avaliação:</span>
                            <span className="text-amber-600 font-bold">
                                {Object.values(ratings).every(isValidRating) ? mediaPreview.toFixed(1) : '—'}
                            </span>
                            <Star size={16} className="text-amber-500 fill-current" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Critérios (1–5)</h3>
                        <div className="space-y-3">
                            {CRITERIOS.map((c) => (
                                <div key={c.key} className="flex items-center justify-between gap-4 p-3 rounded-xl border border-slate-200">
                                    <div className="text-sm font-semibold text-slate-800">{c.label}</div>
                                    <div className="flex items-center gap-3">
                                        <StarsRating
                                            value={ratings[c.key]}
                                            onChange={(n) => setRatings((prev) => ({ ...prev, [c.key]: n }))}
                                        />
                                        <select
                                            value={ratings[c.key]}
                                            onChange={(e) => setRatings((prev) => ({ ...prev, [c.key]: Number(e.target.value) }))}
                                            className="px-3 py-2 text-sm font-bold rounded-xl border border-slate-200 bg-white"
                                        >
                                            <option value={0} disabled>—</option>
                                            {[1, 2, 3, 4, 5].map((n) => (
                                                <option key={n} value={n}>{n}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 ml-0.5">Comentário (opcional)</label>
                        <textarea
                            value={comentario}
                            onChange={(e) => setComentario(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all placeholder:text-slate-400 text-sm resize-none custom-scrollbar"
                            placeholder="Observações adicionais sobre o fornecedor..."
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-all text-sm"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || loadingExisting}
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
                                    {isEditing ? 'Guardar alterações' : 'Registar Avaliação'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AvaliarFornecedorModal;
