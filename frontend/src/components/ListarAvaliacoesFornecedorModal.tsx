import { useState, useEffect } from 'react';
import { X, Star, AlertCircle } from 'lucide-react';
import { fornecedorService } from '../services/fornecedorService';

interface Avaliacao {
    id: number;
    qualidade: number;
    pontualidade: number;
    comunicacao: number;
    preco: number;
    conformidade: number;
    comentario: string | null;
    dataCriacao: string;
    utilizador: { id: number; username: string };
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    fornecedorId: number;
    fornecedorNome: string;
}

const ListarAvaliacoesFornecedorModal = ({ isOpen, onClose, fornecedorId, fornecedorNome }: Props) => {
    const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOpen) return;

        let cancelled = false;
        const fetchAvaliacoes = async () => {
            setLoading(true);
            try {
                const data = await fornecedorService.getAvaliacoes(fornecedorId);
                if (!cancelled) {
                    setAvaliacoes(data);
                }
            } catch (error) {
                console.error('Erro ao carregar avaliações:', error);
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchAvaliacoes();

        return () => { cancelled = true; };
    }, [isOpen, fornecedorId]);

    if (!isOpen) return null;

    const calculateMedia = (aval: Avaliacao) => {
        return ((aval.qualidade + aval.pontualidade + aval.comunicacao + aval.preco + aval.conformidade) / 5).toFixed(1);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[85vh]">
                <div className="bg-slate-900 p-6 flex justify-between items-start shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-white leading-tight">Avaliações do Fornecedor</h2>
                        <p className="text-slate-400 text-sm mt-1">{fornecedorNome}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-slate-400 hover:bg-white dark:bg-slate-800/10 hover:text-white transition-colors rounded-lg flex-shrink-0">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-50 dark:bg-slate-900/50">
                    {loading ? (
                        <div className="flex justify-center items-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : avaliacoes.length > 0 ? (
                        <div className="space-y-4">
                            {avaliacoes.map((aval) => (
                                <div key={aval.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="font-bold text-slate-800 dark:text-slate-200">{aval.utilizador.username}</div>
                                            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                                                {new Date(aval.dataCriacao).toLocaleDateString('pt-PT', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-700 px-2.5 py-1 rounded-lg border border-amber-100 dark:border-amber-500/20 font-bold">
                                            <span>{calculateMedia(aval)}</span>
                                            <Star size={14} className="fill-amber-500 text-amber-500" />
                                        </div>
                                    </div>

                                    {aval.comentario && (
                                        <div className="mt-3 bg-slate-50 dark:bg-slate-900 rounded-lg p-3 text-sm text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-700/50 italic">
                                            "{aval.comentario}"
                                        </div>
                                    )}

                                    <div className="mt-4 grid grid-cols-5 gap-2 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                                        <div className="text-center">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase">Qualid.</div>
                                            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">{aval.qualidade}/5</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase">Pontual.</div>
                                            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">{aval.pontualidade}/5</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase">Comun.</div>
                                            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">{aval.comunicacao}/5</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase">Preço</div>
                                            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">{aval.preco}/5</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase">Confor.</div>
                                            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">{aval.conformidade}/5</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-48 text-center text-slate-500 dark:text-slate-400">
                            <AlertCircle size={40} className="mb-3 text-slate-400" />
                            <p className="font-semibold text-slate-700 dark:text-slate-300">Sem avaliações para este fornecedor.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ListarAvaliacoesFornecedorModal;
