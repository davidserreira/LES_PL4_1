import { useState } from 'react';
import { X, CheckCircle2, Package, AlertCircle, AlertTriangle } from 'lucide-react';
import { encomendaService } from '../services/encomendaService';

interface Linha {
    id: number;
    produto: { nome: string };
    quantidade: number;
    quantidadeRecebida: number;
}

interface Encomenda {
    id: number;
    codigoFormatado: string;
    linhas: Linha[];
}

interface RececaoModalProps {
    encomenda: Encomenda;
    onClose: () => void;
    onSuccess: () => void;
}

export default function RececaoModal({ encomenda, onClose, onSuccess }: RececaoModalProps) {
    const [itens, setItens] = useState(
        encomenda.linhas.map(l => {
            const porReceber = Math.max(0, l.quantidade - (l.quantidadeRecebida || 0));
            return {
                linhaId: l.id,
                nome: l.produto.nome,
                quantidadePedida: l.quantidade,
                jaRecebido: l.quantidadeRecebida || 0,
                porReceber,
                quantidadeRecebida: porReceber // pré-preenchido com o restante
            };
        })
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Calcular se vai ser total ou parcial
    const seraTotal = itens.every(it => it.jaRecebido + it.quantidadeRecebida >= it.quantidadePedida);

    const handleConfirmar = async () => {
        setLoading(true);
        setError(null);
        try {
            await encomendaService.receber(encomenda.id, itens);
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao registar receção.');
        } finally {
            setLoading(false);
        }
    };

    const updateQuantidade = (linhaId: number, value: string) => {
        setItens(prev => prev.map(it => {
            if (it.linhaId !== linhaId) return it;
            let val = parseFloat(value) || 0;
            if (val < 0) val = 0;
            if (val > it.porReceber) val = it.porReceber;
            return { ...it, quantidadeRecebida: val };
        }));
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm uppercase tracking-wider mb-1">
                            <Package size={16} />
                            Registar Receção
                        </div>
                        <h2 className="text-2xl font-black text-slate-900">
                            Encomenda <span className="text-slate-400">#</span>{encomenda.codigoFormatado}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200/50 rounded-xl transition-colors text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 max-h-[60vh] overflow-y-auto">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl flex items-start gap-3">
                            <AlertCircle className="shrink-0 mt-0.5" size={18} />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}

                    {/* Preview total/parcial */}
                    <div className={`mb-5 px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-semibold border ${seraTotal ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
                        {seraTotal
                            ? <><CheckCircle2 size={16} /> Esta receção irá <strong>completar</strong> a encomenda.</>
                            : <><AlertTriangle size={16} /> Esta receção será <strong>parcial</strong> — ainda haverá itens por receber.</>
                        }
                    </div>

                    <div className="space-y-4">
                        {itens.map((item) => (
                            <div key={item.linhaId} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-800">{item.nome}</p>
                                        <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500">
                                            <span>Pedido: <span className="font-bold text-slate-700">{item.quantidadePedida}</span></span>
                                            {item.jaRecebido > 0 && (
                                                <span className="text-emerald-600 font-bold">Já recebido: {item.jaRecebido}</span>
                                            )}
                                            <span className="text-amber-600 font-bold">Por receber: {item.porReceber}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider whitespace-nowrap">Agora:</label>
                                        <input
                                            type="number"
                                            min={0}
                                            max={item.porReceber}
                                            value={item.quantidadeRecebida}
                                            onChange={(e) => updateQuantidade(item.linhaId, e.target.value)}
                                            disabled={item.porReceber === 0}
                                            className="w-24 px-3 py-2 bg-white border border-slate-200 rounded-xl text-center font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                                {/* Progress bar */}
                                <div className="mt-3 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full transition-all"
                                        style={{ width: `${Math.min(100, ((item.jaRecebido + item.quantidadeRecebida) / item.quantidadePedida) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-4">
                    <button onClick={onClose} className="px-6 py-3 font-bold text-slate-600 hover:bg-slate-200/50 rounded-xl transition-all">
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirmar}
                        disabled={loading}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-emerald-600/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
                    >
                        {loading ? 'A processar...' : (
                            <>
                                <CheckCircle2 size={18} />
                                Confirmar Receção
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

