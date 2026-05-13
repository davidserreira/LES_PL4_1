import { useEffect, useState } from 'react';
import { Loader2, X, Edit2, AlertCircle } from 'lucide-react';
import { pedidoCompraService } from '../services/pedidoCompraService';
import type { Utilizador } from '../services/utilizadorService';

interface RascunhosModalProps {
    isOpen: boolean;
    onClose: (shouldRefresh?: boolean) => void;
    onEditDraft: (draftId: number) => void;
    user: Utilizador | null;
}

const formatDate = (value: string | Date) => {
    try {
        return new Date(value).toLocaleDateString('pt-PT');
    } catch {
        return '';
    }
};

export default function RascunhosModal({ isOpen, onClose, onEditDraft, user }: RascunhosModalProps) {
    const [drafts, setDrafts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchDrafts = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await pedidoCompraService.getRascunhos();
            // Filter by creator if not admin? Admin can see all, Gestor de Compras too? 
            // the requirements say "Rascunhos (X) - X represents the number of user drafts".
            // So we might want to filter drafts created by `user.id`.
            const userDrafts = data.filter((d: any) => d.criadoPorId === user?.id);
            setDrafts(userDrafts);
        } catch (err) {
            console.error(err);
            setError('Erro ao carregar rascunhos.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && user) {
            fetchDrafts();
        }
    }, [isOpen, user]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/80">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-sm border border-blue-100 dark:border-blue-500/20">
                            <Edit2 size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight">Meus Rascunhos</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Pedidos de compra guardados localmente</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => onClose()}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1 bg-slate-50 dark:bg-slate-900/30">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="animate-spin text-emerald-600 dark:text-emerald-400 w-8 h-8" />
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 dark:bg-red-500/10 text-red-700 p-4 rounded-xl text-sm font-medium border border-red-100 dark:border-red-500/20 mb-4 flex items-center gap-2">
                            <AlertCircle size={16} /> {error}
                        </div>
                    ) : drafts.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Edit2 className="text-slate-300 w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">Sem rascunhos</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Não tem nenhum pedido de compra em rascunho de momento.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {drafts.map((draft) => (
                                <div key={draft.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-blue-200 transition-colors">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-900 dark:text-slate-100">{draft.codigoFormatado}</span>
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider border bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 uppercase">
                                                Rascunho
                                            </span>
                                        </div>
                                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide">
                                            Criado a {formatDate(draft.criadoEm)} • {draft.linhas?.length || 0} produtos preenchidos
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => onEditDraft(draft.id)}
                                        className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-lg transition-colors border border-emerald-200 shadow-sm"
                                    >
                                        <Edit2 size={16} /> Continuar Edição
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
