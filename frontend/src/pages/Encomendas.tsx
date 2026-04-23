import { useEffect, useMemo, useState } from 'react';
import { PackageCheck, Loader2, Clock, CheckCircle2, XCircle, Truck, Building2, ClipboardList, AlertTriangle, ChevronDown, Package } from 'lucide-react';
import { encomendaService } from '../services/encomendaService';
import RececaoModal from '../components/RececaoModal';
import { Utilizador } from '../services/utilizadorService';

const formatCurrency = (v: number) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v || 0);
const formatDate = (d: string | Date | null) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('pt-PT'); } catch { return '—'; }
};

const ESTADO_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    EMITIDA:          { label: 'Emitida',          color: 'text-blue-700 bg-blue-50 border-blue-200',      icon: Clock },
    ENVIADA:          { label: 'Enviada',          color: 'text-amber-700 bg-amber-50 border-amber-200',   icon: Truck },
    ENTREGUE_PARCIAL: { label: 'Parcial',          color: 'text-orange-700 bg-orange-50 border-orange-200', icon: Package },
    ENTREGUE:         { label: 'Entregue',         color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
    CANCELADA:        { label: 'Cancelada',        color: 'text-red-700 bg-red-50 border-red-200',         icon: XCircle },
};

export default function Encomendas({ user }: { user: Utilizador }) {
    const [encomendas, setEncomendas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [highlightPedidoId, setHighlightPedidoId] = useState<number | null>(null);
    const [highlightEncomendaIds, setHighlightEncomendaIds] = useState<number[]>([]);
    const [selectedEncomenda, setSelectedEncomenda] = useState<any | null>(null);
    const [showRececaoModal, setShowRececaoModal] = useState(false);
    const [openStatusId, setOpenStatusId] = useState<number | null>(null);

    const isAdmin = user?.role === 'ADMINISTRADOR';

    const loadEncomendas = () => {
        setLoading(true);
        encomendaService.getAll()
            .then(setEncomendas)
            .catch(() => setError('Erro ao carregar encomendas.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadEncomendas();
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

    // Fechar dropdown ao clicar fora
    useEffect(() => {
        const handleClickOutside = () => setOpenStatusId(null);
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMudarEstado = async (id: number, novoEstado: string) => {
        try {
            await encomendaService.atualizarEstado(id, novoEstado);
            loadEncomendas();
        } catch (err) {
            alert('Erro ao atualizar estado da encomenda.');
        }
    };

    const handleOpenRececao = (enc: any) => {
        setSelectedEncomenda(enc);
        setShowRececaoModal(true);
    };

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
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                {['Código', 'Fornecedor', 'Itens', 'Total', 'Entrega', 'Estado', 'Emissão', 'Ações'].map(h => (
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
                                const isEnviada = enc.estado === 'ENVIADA';
                                const isParcial = enc.estado === 'ENTREGUE_PARCIAL';
                                const isEmitida = enc.estado === 'EMITIDA';
                                const podeReceber = isEnviada || isParcial;
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
                                            <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400 font-bold uppercase">
                                                <ClipboardList size={10} />
                                                {enc.pedidoCompra?.codigoFormatado || `#${enc.pedidoCompraId}`}
                                            </div>
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
                                            {isEntregue && enc.dataEntregaReal ? (
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
                                            <div className="relative inline-block">
                                                {isAdmin && isEmitida ? (
                                                    <>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setOpenStatusId(openStatusId === enc.id ? null : enc.id);
                                                            }}
                                                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-black border transition-all hover:scale-105 active:scale-95 shadow-sm hover:shadow-md ${cfg.color}`}
                                                        >
                                                            <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
                                                            {cfg.label.toUpperCase()}
                                                            <ChevronDown size={12} className={`ml-1.5 opacity-50 transition-transform duration-200 ${openStatusId === enc.id ? 'rotate-180' : ''}`} />
                                                        </button>

                                                        {openStatusId === enc.id && (
                                                            <div
                                                                onMouseDown={(e) => e.stopPropagation()}
                                                                className="absolute left-0 mt-2 w-40 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-[60] animate-in fade-in zoom-in-95 duration-200"
                                                            >
                                                                <button
                                                                    onClick={() => { handleMudarEstado(enc.id, 'ENVIADA'); setOpenStatusId(null); }}
                                                                    className="w-full text-left px-4 py-2 text-[10px] font-black tracking-wider transition-colors flex items-center gap-2 text-slate-700 hover:bg-slate-50 hover:text-blue-600"
                                                                >
                                                                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                                                    ENVIADA
                                                                </button>
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-black border ${cfg.color}`}>
                                                        <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
                                                        {cfg.label.toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Emissão */}
                                        <td className="px-5 py-4 text-slate-500 font-medium text-sm">
                                            {formatDate(enc.dataEmissao)}
                                        </td>
                                        {/* Ações */}
                                        <td className="px-5 py-4">
                                            {podeReceber && (
                                                <button 
                                                    onClick={() => handleOpenRececao(enc)}
                                                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-sm shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95"
                                                >
                                                    <Package size={14} />
                                                    {isParcial ? 'Receber Restante' : 'Receber'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {showRececaoModal && selectedEncomenda && (
                <RececaoModal
                    encomenda={selectedEncomenda}
                    onClose={() => setShowRececaoModal(false)}
                    onSuccess={() => {
                        setShowRececaoModal(false);
                        loadEncomendas();
                    }}
                />
            )}
        </div>
    );
}
