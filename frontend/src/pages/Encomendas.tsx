import { useEffect, useMemo, useState } from 'react';
import { PackageCheck, Loader2, Clock, CheckCircle2, XCircle, Truck, Building2, ClipboardList, AlertTriangle } from 'lucide-react';
import { encomendaService } from '../services/encomendaService';

const formatCurrency = (v: number) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v || 0);
const formatDate = (d: string | Date | null) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('pt-PT'); } catch { return '—'; }
};

const ESTADO_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    EMITIDA:  { label: 'Emitida',  color: 'text-blue-700 bg-blue-50 border-blue-200',    icon: Clock },
    ENVIADA:  { label: 'Enviada',  color: 'text-amber-700 bg-amber-50 border-amber-200', icon: Truck },
    ENTREGUE: { label: 'Entregue', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
    CANCELADA:{ label: 'Cancelada',color: 'text-red-700 bg-red-50 border-red-200',       icon: XCircle },
};

export default function Encomendas() {
    const [encomendas, setEncomendas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [highlightPedidoId, setHighlightPedidoId] = useState<number | null>(null);
    const [highlightEncomendaIds, setHighlightEncomendaIds] = useState<number[]>([]);

    useEffect(() => {
        encomendaService.getAll()
            .then(setEncomendas)
            .catch(() => setError('Erro ao carregar encomendas.'))
            .finally(() => setLoading(false));
    }, []);

    // Ao entrar na página, limpar o badge da sidebar (mas manter o highlight)
    useEffect(() => {
        localStorage.removeItem('encomendas:badge');
        window.dispatchEvent(new Event('encomendas:badge'));
    }, []);

    // Ler contexto de highlight (pedido/encomendas criadas) e aplicar efeito temporário
    useEffect(() => {
        try {
            const raw = localStorage.getItem('encomendas:highlight');
            if (!raw) return;
            const parsed = JSON.parse(raw);
            const pid = Number(parsed?.pedidoId);
            const ids = Array.isArray(parsed?.encomendaIds) ? parsed.encomendaIds.map((n: any) => Number(n)).filter((n: any) => Number.isFinite(n)) : [];
            setHighlightPedidoId(Number.isFinite(pid) ? pid : null);
            setHighlightEncomendaIds(ids);

            const clear = () => {
                setHighlightPedidoId(null);
                setHighlightEncomendaIds([]);
                localStorage.removeItem('encomendas:highlight');
                window.removeEventListener('mousedown', clear);
                window.removeEventListener('keydown', clear);
                window.removeEventListener('wheel', clear as any);
            };

            // Some after a few seconds OR next user input
            const t = window.setTimeout(clear, 6000);
            window.addEventListener('mousedown', clear, { once: true });
            window.addEventListener('keydown', clear, { once: true });
            window.addEventListener('wheel', clear as any, { once: true, passive: true } as any);
            return () => window.clearTimeout(t);
        } catch {
            // ignore
        }
    }, []);

    const highlightedSet = useMemo(() => new Set(highlightEncomendaIds), [highlightEncomendaIds]);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        <PackageCheck size={28} className="text-emerald-600" />
                        Encomendas
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Encomendas geradas a partir de pedidos aprovados</p>
                </div>
                <div className="text-sm font-bold text-slate-500 bg-slate-100 border border-slate-200 px-4 py-2 rounded-xl">
                    {encomendas.length} encomenda{encomendas.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={32} className="animate-spin text-emerald-600" />
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl">
                    <AlertTriangle size={18} />
                    <span className="font-medium">{error}</span>
                </div>
            )}

            {/* Empty */}
            {!loading && !error && encomendas.length === 0 && (
                <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl border-dashed">
                    <PackageCheck size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500 font-semibold text-lg">Nenhuma encomenda gerada</p>
                    <p className="text-slate-400 text-sm mt-1">Aprove um pedido e emita a encomenda para ver aqui.</p>
                </div>
            )}

            {/* Table */}
            {!loading && encomendas.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                {['Código', 'Pedido Origem', 'Fornecedor', 'Itens', 'Total', 'Entrega', 'Estado', 'Emissão'].map(h => (
                                    <th key={h} className="px-5 py-3.5 text-[11px] font-black uppercase tracking-wider text-slate-500">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {encomendas.map((enc) => {
                                const cfg = ESTADO_CONFIG[enc.estado] || ESTADO_CONFIG.EMITIDA;
                                const EstadoIcon = cfg.icon;
                                const isEntregue = enc.estado === 'ENTREGUE';
                                const isCancelada = enc.estado === 'CANCELADA';
                                const isFromHighlightedPedido =
                                    (highlightPedidoId != null && Number(enc.pedidoCompraId) === highlightPedidoId) ||
                                    (highlightPedidoId != null && Number(enc.pedidoCompra?.id) === highlightPedidoId);
                                const isHighlighted = highlightedSet.has(Number(enc.id)) || (highlightEncomendaIds.length === 0 && isFromHighlightedPedido);

                                return (
                                    <tr
                                        key={enc.id}
                                        className={`hover:bg-slate-50/60 transition-colors ${
                                            isEntregue ? 'bg-emerald-50/30' : ''
                                        } ${
                                            isHighlighted
                                                ? 'bg-gradient-to-r from-emerald-50/90 via-white to-emerald-50/90 border-l-4 border-emerald-400 ring-1 ring-emerald-200 shadow-[0_12px_35px_rgba(16,185,129,0.14)] animate-in fade-in duration-300'
                                                : ''
                                        }`}
                                    >
                                        {/* Código */}
                                        <td className="px-5 py-4">
                                            <span className="font-black text-slate-900 tracking-wide">{enc.codigoFormatado}</span>
                                        </td>
                                        {/* Pedido Origem */}
                                        <td className="px-5 py-4">
                                            <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                                                <ClipboardList size={14} className="text-slate-400" />
                                                {enc.pedidoCompra?.codigoFormatado || `#${enc.pedidoCompraId}`}
                                            </span>
                                        </td>
                                        {/* Fornecedor */}
                                        <td className="px-5 py-4">
                                            <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                                                <Building2 size={14} className="text-slate-400 shrink-0" />
                                                {enc.fornecedor?.nome || '—'}
                                            </span>
                                        </td>
                                        {/* Itens */}
                                        <td className="px-5 py-4">
                                            <span className="font-bold text-slate-700">{enc.linhas?.length ?? 0}</span>
                                        </td>
                                        {/* Total */}
                                        <td className="px-5 py-4">
                                            <span className="font-black text-slate-900">{formatCurrency(enc.valorTotal)}</span>
                                        </td>
                                        {/* Entrega */}
                                        <td className="px-5 py-4">
                                            {isCancelada ? (
                                                <span className="text-slate-400">—</span>
                                            ) : isEntregue && enc.dataEntregaReal ? (
                                                <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                                                    <CheckCircle2 size={14} className="shrink-0" />
                                                    {formatDate(enc.dataEntregaReal)}
                                                </span>
                                            ) : (
                                                <span className="text-slate-600 font-medium">{formatDate(enc.dataEntregaPrevista)}</span>
                                            )}
                                        </td>
                                        {/* Estado */}
                                        <td className="px-5 py-4">
                                            <span className={`inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full border ${cfg.color}`}>
                                                <EstadoIcon size={11} />
                                                {cfg.label}
                                            </span>
                                        </td>
                                        {/* Emissão */}
                                        <td className="px-5 py-4 text-slate-500 font-medium">
                                            {formatDate(enc.dataEmissao)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
