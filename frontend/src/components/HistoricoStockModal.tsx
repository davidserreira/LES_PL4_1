import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, History, Package, Building2, ClipboardList, Loader2, Search, Calendar, AlertTriangle, TrendingUp, CheckCircle2 } from 'lucide-react';
import { historicoStockService, EntradaHistorico } from '../services/historicoStockService';

interface HistoricoStockModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const formatDate = (d: string | null | undefined) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('pt-PT'); } catch { return '—'; }
};

const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v || 0);

// Devolve a data mais relevante para o histórico:
// Se foi totalmente entregue → dataEntregaReal
// Caso contrário → dataEmissao (como referência da encomenda)
const getDataRelevante = (entrada: EntradaHistorico): string => {
    if (entrada.encomenda.dataEntregaReal) return entrada.encomenda.dataEntregaReal;
    if (entrada.encomenda.dataEntregaPrevista) return entrada.encomenda.dataEntregaPrevista;
    return entrada.encomenda.dataEmissao;
};

const getDataLabel = (entrada: EntradaHistorico): string => {
    if (entrada.encomenda.dataEntregaReal) return 'Entregue a';
    if (entrada.encomenda.estado === 'ENTREGUE_PARCIAL') return 'Parcial desde';
    return 'Emitida a';
};

export default function HistoricoStockModal({ isOpen, onClose }: HistoricoStockModalProps) {
    const [entradas, setEntradas] = useState<EntradaHistorico[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!isOpen) return;
        setLoading(true);
        setError(null);
        setSearchQuery('');
        historicoStockService.getAll()
            .then(setEntradas)
            .catch(() => setError('Erro ao carregar o histórico de stock. Verifique a ligação ao servidor.'))
            .finally(() => setLoading(false));
    }, [isOpen]);

    if (!isOpen) return null;

    const filtered = entradas.filter(e => {
        const q = searchQuery.toLowerCase();
        return (
            e.produto.nome.toLowerCase().includes(q) ||
            (e.produto.categoria || '').toLowerCase().includes(q) ||
            e.encomenda.codigoFormatado.toLowerCase().includes(q) ||
            e.encomenda.fornecedor.nome.toLowerCase().includes(q)
        );
    });

    const totalUnidades = filtered.reduce((acc, e) => acc + e.quantidadeRecebida, 0);
    const totalValor = filtered.reduce((acc, e) => acc + (e.quantidadeRecebida * e.precoUnitario), 0);

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
            onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/80">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-sm border border-emerald-100">
                            <History size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 leading-tight">Histórico de Entradas de Stock</h2>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">Produtos recebidos via receção de encomendas</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Search + Stats */}
                <div className="px-6 py-4 border-b border-slate-100 bg-white space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Pesquisar produto, encomenda ou fornecedor..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                        />
                    </div>
                    {!loading && !error && entradas.length > 0 && (
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                <TrendingUp size={14} className="text-emerald-500" />
                                <span>{filtered.length} {filtered.length === 1 ? 'entrada' : 'entradas'}</span>
                            </div>
                            <div className="w-px h-4 bg-slate-200"></div>
                            <span className="text-xs font-bold text-slate-500">
                                Total recebido: <span className="text-slate-900">{totalUnidades} unidades</span>
                            </span>
                            <div className="w-px h-4 bg-slate-200"></div>
                            <span className="text-xs font-bold text-slate-500">
                                Valor total: <span className="text-emerald-700">{formatCurrency(totalValor)}</span>
                            </span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 size={32} className="animate-spin text-emerald-600" />
                            <p className="text-sm text-slate-500 font-medium">A carregar histórico...</p>
                        </div>
                    ) : error ? (
                        <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-700 px-5 py-4 rounded-xl">
                            <AlertTriangle size={18} />
                            <span className="font-bold text-sm">{error}</span>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-20">
                            <History size={48} className="mx-auto text-slate-200 mb-4" />
                            <p className="text-slate-500 font-black text-lg">
                                {searchQuery ? 'Nenhuma entrada encontrada' : 'Ainda sem entradas registadas'}
                            </p>
                            <p className="text-slate-400 text-sm mt-1">
                                {searchQuery
                                    ? 'Tente ajustar a pesquisa.'
                                    : 'O histórico será preenchido automaticamente após a primeira receção de encomenda.'}
                            </p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50/80 border-b border-slate-200 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3 font-black text-slate-500 uppercase tracking-wider">Produto</th>
                                        <th className="px-4 py-3 font-black text-slate-500 uppercase tracking-wider">Encomenda</th>
                                        <th className="px-4 py-3 font-black text-slate-500 uppercase tracking-wider">Fornecedor</th>
                                        <th className="px-4 py-3 font-black text-slate-500 uppercase tracking-wider text-center">Qtd. Recebida</th>
                                        <th className="px-4 py-3 font-black text-slate-500 uppercase tracking-wider text-right">Valor</th>
                                        <th className="px-4 py-3 font-black text-slate-500 uppercase tracking-wider">Data</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filtered.map((entrada) => {
                                        const isCompleta = entrada.encomenda.estado === 'ENTREGUE';
                                        const isParcial = entrada.encomenda.estado === 'ENTREGUE_PARCIAL';
                                        return (
                                            <tr key={entrada.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                                                            <Package size={13} />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-900">{entrada.produto.nome}</p>
                                                            {entrada.produto.categoria && (
                                                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{entrada.produto.categoria}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div>
                                                        <span className="flex items-center gap-1.5 font-bold text-slate-700">
                                                            <ClipboardList size={11} className="text-slate-400 shrink-0" />
                                                            {entrada.encomenda.codigoFormatado}
                                                        </span>
                                                        <span className={`inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                                            isCompleta ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                                            isParcial ? 'bg-orange-50 text-orange-700 border border-orange-100' :
                                                            'bg-blue-50 text-blue-700 border border-blue-100'
                                                        }`}>
                                                            {isCompleta ? <CheckCircle2 size={9} /> : null}
                                                            {isCompleta ? 'Entregue' : isParcial ? 'Parcial' : 'Emitida'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <span className="flex items-center gap-1.5 font-bold text-slate-700">
                                                        <Building2 size={11} className="text-slate-400 shrink-0" />
                                                        {entrada.encomenda.fornecedor.nome}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5 text-center">
                                                    <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-black border border-emerald-100 text-xs">
                                                        +{entrada.quantidadeRecebida}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                                                    {formatCurrency(entrada.quantidadeRecebida * entrada.precoUnitario)}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase">{getDataLabel(entrada)}</span>
                                                        <span className="flex items-center gap-1.5 text-slate-600 font-bold">
                                                            <Calendar size={11} className="text-slate-400 shrink-0" />
                                                            {formatDate(getDataRelevante(entrada))}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-xs text-slate-400 font-medium">
                        Atualizado automaticamente a cada abertura
                    </p>
                    <button
                        onClick={onClose}
                        className="px-5 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-all"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
