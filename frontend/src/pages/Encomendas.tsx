import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    PackageCheck, Loader2, Clock, CheckCircle2, XCircle, Truck, 
    Building2, ClipboardList, AlertTriangle, ChevronDown, Package,
    Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, Calendar, Euro, RotateCcw, ShieldAlert
} from 'lucide-react';
import { encomendaService } from '../services/encomendaService';
import RececaoModal from '../components/RececaoModal';
import DetalhesEncomendaModal from '../components/DetalhesEncomendaModal';
import { Utilizador } from '../services/utilizadorService';

const formatCurrency = (v: number) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v || 0);
const formatDate = (d: string | Date | null) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('pt-PT'); } catch { return '—'; }
};

const ESTADO_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    EMITIDA:          { label: 'Emitida',          color: 'text-blue-700 bg-blue-50 dark:bg-blue-500/10 border-blue-200',      icon: Clock },
    ENVIADA:          { label: 'Enviada',          color: 'text-amber-700 bg-amber-50 dark:bg-amber-500/10 border-amber-200',   icon: Truck },
    ENTREGUE_PARCIAL: { label: 'Parcial',          color: 'text-orange-700 bg-orange-50 border-orange-200', icon: Package },
    ENTREGUE:         { label: 'Entregue',         color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200', icon: CheckCircle2 },
    CANCELADA:        { label: 'Cancelada',        color: 'text-red-700 bg-red-50 dark:bg-red-500/10 border-red-200',         icon: XCircle },
    ENCERRADA:        { label: 'Encerrada',        color: 'text-slate-700 bg-slate-100 dark:bg-slate-500/10 border-slate-300 dark:border-slate-600', icon: ClipboardList },
};

export default function Encomendas({ user }: { user: Utilizador }) {
    const [encomendas, setEncomendas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [highlightPedidoId, setHighlightPedidoId] = useState<number | null>(null);
    const [highlightEncomendaIds, setHighlightEncomendaIds] = useState<number[]>([]);
    
    const [selectedEncomenda, setSelectedEncomenda] = useState<any | null>(null);
    const [showRececaoModal, setShowRececaoModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [cancelConfirmId, setCancelConfirmId] = useState<number | null>(null);
    const [encerrarDirectEnc, setEncerrarDirectEnc] = useState<any | null>(null);
    const [encerrarDirectMotivo, setEncerrarDirectMotivo] = useState('');

    // Filtros e Pesquisa
    const [searchQuery, setSearchQuery] = useState('');
    const [filterEstado, setFilterEstado] = useState('Todos');
    const [filterFornecedor, setFilterFornecedor] = useState('Todos');
    const [isFilterEstadoOpen, setIsFilterEstadoOpen] = useState(false);
    const [isFilterFornecedorOpen, setIsFilterFornecedorOpen] = useState(false);

    type SortField = 'codigoFormatado' | 'dataEmissao' | 'fornecedor' | 'valorTotal' | 'estado' | 'dataEntregaPrevista';
    const [sortField, setSortField] = useState<SortField>('dataEmissao');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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

    // Ao entrar na página, limpar o badge da sidebar
    useEffect(() => {
        localStorage.removeItem('encomendas:badge');
        window.dispatchEvent(new Event('encomendas:badge'));
    }, []);

    // Ler contexto de highlight
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
            };

            const t = window.setTimeout(clear, 6000);
            window.addEventListener('mousedown', clear, { once: true });
            window.addEventListener('keydown', clear, { once: true });
            return () => window.clearTimeout(t);
        } catch { /* ignore */ }
    }, []);

    const highlightedSet = useMemo(() => new Set(highlightEncomendaIds), [highlightEncomendaIds]);

    // Fechar dropdowns ao clicar fora
    useEffect(() => {
        const handleClickOutside = () => {
            setIsFilterEstadoOpen(false);
            setIsFilterFornecedorOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fornecedoresDisponiveis = useMemo(() => {
        const unique = new Set(encomendas.map(e => e.fornecedor?.nome).filter(Boolean));
        return Array.from(unique).sort();
    }, [encomendas]);

    const filteredEncomendas = useMemo(() => {
        let result = [...encomendas];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(e => 
                e.codigoFormatado.toLowerCase().includes(query) ||
                (e.fornecedor?.nome || '').toLowerCase().includes(query) ||
                (e.pedidoCompra?.codigoFormatado || '').toLowerCase().includes(query)
            );
        }

        if (filterEstado !== 'Todos') {
            result = result.filter(e => e.estado === filterEstado);
        }

        if (filterFornecedor !== 'Todos') {
            result = result.filter(e => e.fornecedor?.nome === filterFornecedor);
        }

        result.sort((a, b) => {
            let valA, valB;
            switch(sortField) {
                case 'codigoFormatado': valA = a.codigoFormatado; valB = b.codigoFormatado; break;
                case 'dataEmissao': valA = new Date(a.dataEmissao).getTime(); valB = new Date(b.dataEmissao).getTime(); break;
                case 'fornecedor': valA = a.fornecedor?.nome || ''; valB = b.fornecedor?.nome || ''; break;
                case 'valorTotal': valA = a.valorTotal; valB = b.valorTotal; break;
                case 'estado': valA = a.estado; valB = b.estado; break;
                case 'dataEntregaPrevista': valA = new Date(a.dataEntregaPrevista || 0).getTime(); valB = new Date(b.dataEntregaPrevista || 0).getTime(); break;
                default: return 0;
            }
            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [encomendas, searchQuery, filterEstado, filterFornecedor, sortField, sortOrder]);

    const handleMudarEstado = async (id: number, novoEstado: string) => {
        try {
            await encomendaService.atualizarEstado(id, novoEstado);
            loadEncomendas();
            if (showDetailsModal) setShowDetailsModal(false);
        } catch (err) {
            alert('Erro ao atualizar estado da encomenda.');
        }
    };

    const handleEncerrar = async (id: number, observacoes: string) => {
        try {
            await encomendaService.encerrar(id, observacoes);
            loadEncomendas();
            if (showDetailsModal) setShowDetailsModal(false);
            setEncerrarDirectEnc(null);
            setEncerrarDirectMotivo('');
        } catch (err: any) {
            const msg = err?.response?.data?.error || 'Erro ao encerrar encomenda.';
            alert(msg);
        }
    };

    const handleCancelarEncomenda = async (id: number) => {
        try {
            await encomendaService.atualizarEstado(id, 'CANCELADA');
            setCancelConfirmId(null);
            loadEncomendas();
        } catch (err) {
            alert('Erro ao cancelar encomenda.');
        }
    };

    const handleOpenRececao = (enc: any) => {
        setSelectedEncomenda(enc);
        setShowRececaoModal(true);
    };

    const handleOpenDetails = (enc: any) => {
        setSelectedEncomenda(enc);
        setShowDetailsModal(true);
    };

    const navigate = useNavigate();
    const handleReordenar = (linhas: { produtoId: number; quantidade: number }[]) => {
        localStorage.setItem('pedido:reorder', JSON.stringify(linhas));
        setShowDetailsModal(false);
        setSelectedEncomenda(null);
        navigate('/pedidos');
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
    };

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ArrowUpDown size={12} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
        return sortOrder === 'asc' ? <ArrowUp size={12} className="text-emerald-600 dark:text-emerald-400" /> : <ArrowDown size={12} className="text-emerald-600 dark:text-emerald-400" />;
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] animate-in fade-in duration-300 relative space-y-4">
            
            {/* Command Center */}
            <div className="shrink-0 bg-slate-50 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700/50 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 pt-4 pb-4 shadow-sm flex flex-col gap-4 z-40">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
                            <PackageCheck size={28} className="text-emerald-600 dark:text-emerald-400" />
                            Gestão de Encomendas
                        </h1>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 font-medium">Controlo de receção e trânsito de mercadorias.</p>
                    </div>
                </div>

                {/* Dashboard Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <button 
                        onClick={() => { setFilterEstado('Todos'); setFilterFornecedor('Todos'); setSearchQuery(''); }}
                        className={`p-3 rounded-xl border shadow-sm flex items-center gap-4 text-left transition-all hover:shadow-md active:scale-95 ${filterEstado === 'Todos' && filterFornecedor === 'Todos' && !searchQuery ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 ring-2 ring-blue-500/20' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-100 dark:border-blue-500/20'}`}
                    >
                        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <ClipboardList size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</p>
                            <h3 className="text-lg font-black text-slate-800 dark:text-slate-200">{encomendas.length}</h3>
                        </div>
                    </button>
                    <button 
                        onClick={() => { setFilterEstado('ENVIADA'); setSearchQuery(''); }}
                        className={`p-3 rounded-xl border shadow-sm flex items-center gap-4 text-left transition-all hover:shadow-md active:scale-95 ${filterEstado === 'ENVIADA' ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 ring-2 ring-amber-500/20' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-amber-100 dark:border-amber-500/20'}`}
                    >
                        <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                            <Truck size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Em Trânsito</p>
                            <h3 className="text-lg font-black text-slate-800 dark:text-slate-200">{encomendas.filter(e => e.estado === 'ENVIADA').length}</h3>
                        </div>
                    </button>
                    <button 
                        onClick={() => { setFilterEstado('ENTREGUE'); setSearchQuery(''); }}
                        className={`p-3 rounded-xl border shadow-sm flex items-center gap-4 text-left transition-all hover:shadow-md active:scale-95 ${filterEstado === 'ENTREGUE' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 ring-2 ring-emerald-500/20' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-100 dark:border-emerald-500/20'}`}
                    >
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <CheckCircle2 size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entregues</p>
                            <h3 className="text-lg font-black text-slate-800 dark:text-slate-200">{encomendas.filter(e => e.estado === 'ENTREGUE').length}</h3>
                        </div>
                    </button>
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
                            <Euro size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Total</p>
                            <h3 className="text-lg font-black text-slate-800 dark:text-slate-200">{formatCurrency(encomendas.reduce((acc, e) => acc + e.valorTotal, 0))}</h3>
                        </div>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="flex flex-col xl:flex-row gap-3 items-stretch">
                    <label className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex-grow cursor-text">
                        <div className="relative flex-1 min-w-0 w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Pesquisar encomenda, fornecedor ou pedido..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-1.5 bg-transparent border-0 outline-none text-xs font-medium placeholder:text-slate-400"
                            />
                        </div>
                        <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
                        <div className="flex items-center gap-2 px-3">
                            <Filter size={14} className="text-slate-400" />
                            <div className="relative">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setIsFilterEstadoOpen(!isFilterEstadoOpen); setIsFilterFornecedorOpen(false); }}
                                    className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1 hover:text-slate-900 dark:text-slate-100 transition-colors"
                                >
                                    Estado: {filterEstado} <ChevronDown size={12} />
                                </button>
                                {isFilterEstadoOpen && (
                                    <div className="absolute left-0 mt-2 w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95">
                                        {['Todos', 'EMITIDA', 'ENVIADA', 'ENTREGUE_PARCIAL', 'ENTREGUE', 'CANCELADA'].map(est => (
                                            <button
                                                key={est}
                                                onClick={() => { setFilterEstado(est); setIsFilterEstadoOpen(false); }}
                                                className={`w-full text-left px-4 py-2 text-[11px] font-bold transition-colors ${filterEstado === est ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900'}`}
                                            >
                                                {est === 'Todos' ? 'Todos os estados' : (ESTADO_CONFIG[est]?.label || est)}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="w-px h-3 bg-slate-100 dark:bg-slate-700/50 mx-1"></div>
                            <div className="relative">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setIsFilterFornecedorOpen(!isFilterFornecedorOpen); setIsFilterEstadoOpen(false); }}
                                    className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1 hover:text-slate-900 dark:text-slate-100 transition-colors"
                                >
                                    Fornecedor: {filterFornecedor} <ChevronDown size={12} />
                                </button>
                                {isFilterFornecedorOpen && (
                                    <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95">
                                        <button
                                            onClick={() => { setFilterFornecedor('Todos'); setIsFilterFornecedorOpen(false); }}
                                            className={`w-full text-left px-4 py-2 text-[11px] font-bold transition-colors ${filterFornecedor === 'Todos' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900'}`}
                                        >
                                            Todos os fornecedores
                                        </button>
                                        {fornecedoresDisponiveis.map(f => (
                                            <button
                                                key={f}
                                                onClick={() => { setFilterFornecedor(f); setIsFilterFornecedorOpen(false); }}
                                                className={`w-full text-left px-4 py-2 text-[11px] font-bold transition-colors ${filterFornecedor === f ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900'}`}
                                            >
                                                {f}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </label>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-3 bg-red-50 dark:bg-red-500/10 border border-red-200 text-red-700 px-5 py-4 rounded-xl">
                    <AlertTriangle size={18} />
                    <span className="font-bold">{error}</span>
                </div>
            )}

            {/* Table / Content */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 size={32} className="animate-spin text-emerald-600 dark:text-emerald-400" />
                    </div>
                ) : filteredEncomendas.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl border-dashed">
                        <PackageCheck size={48} className="mx-auto text-slate-200 mb-4" />
                        <p className="text-slate-500 dark:text-slate-400 font-black text-lg">Nenhuma encomenda encontrada</p>
                        <p className="text-slate-400 text-sm mt-1">Experimente ajustar os seus filtros de pesquisa.</p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                                <tr>
                                    <th className="px-5 py-4 cursor-pointer group" onClick={() => handleSort('codigoFormatado')}>
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                            Código <SortIcon field="codigoFormatado" />
                                        </div>
                                    </th>
                                    <th className="px-5 py-4 cursor-pointer group" onClick={() => handleSort('fornecedor')}>
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                            Fornecedor <SortIcon field="fornecedor" />
                                        </div>
                                    </th>
                                    <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Itens</th>
                                    <th className="px-5 py-4 cursor-pointer group text-right" onClick={() => handleSort('valorTotal')}>
                                        <div className="flex items-center justify-end gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                            Total <SortIcon field="valorTotal" />
                                        </div>
                                    </th>
                                    <th className="px-5 py-4 cursor-pointer group" onClick={() => handleSort('dataEntregaPrevista')}>
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                            Entrega <SortIcon field="dataEntregaPrevista" />
                                        </div>
                                    </th>
                                    <th className="px-5 py-4 cursor-pointer group" onClick={() => handleSort('estado')}>
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                            Estado <SortIcon field="estado" />
                                        </div>
                                    </th>
                                    <th className="px-5 py-4 cursor-pointer group" onClick={() => handleSort('dataEmissao')}>
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                            Emissão <SortIcon field="dataEmissao" />
                                        </div>
                                    </th>
                                    <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredEncomendas.map((enc) => {
                                    const cfg = ESTADO_CONFIG[enc.estado] || ESTADO_CONFIG.EMITIDA;
                                    const EstadoIcon = cfg.icon;
                                    const isEntregue = enc.estado === 'ENTREGUE';
                                    const isEnviada = enc.estado === 'ENVIADA';
                                    const isParcial = enc.estado === 'ENTREGUE_PARCIAL';
                                    const isEmitida = enc.estado === 'EMITIDA';
                                    const isFinalizada = enc.estado === 'ENTREGUE' || enc.estado === 'CANCELADA' || enc.estado === 'ENCERRADA';
                                    const podeReceber = isEnviada || isParcial;
                                    // Cancelar: só emitida ou enviada (sem entregas parciais)
                                    const podeCancelar = isAdmin && (isEmitida || isEnviada);
                                    // Encerrar: só parcialmente entregue
                                    const podeEncerrar = isAdmin && isParcial;
                                    
                                    const isFromHighlightedPedido =
                                        (highlightPedidoId != null && Number(enc.pedidoCompraId) === highlightPedidoId) ||
                                        (highlightPedidoId != null && Number(enc.pedidoCompra?.id) === highlightPedidoId);
                                    const isHighlighted = highlightedSet.has(Number(enc.id)) || (highlightEncomendaIds.length === 0 && isFromHighlightedPedido);

                                    return (
                                        <tr 
                                            key={enc.id} 
                                            onClick={() => handleOpenDetails(enc)}
                                            className={`group hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900/80 transition-colors cursor-pointer ${
                                                isEntregue ? 'bg-emerald-50 dark:bg-emerald-500/10' : ''
                                            } ${
                                                isHighlighted 
                                                    ? 'bg-gradient-to-r from-emerald-50/90 dark:from-emerald-500/10 via-white dark:via-slate-800 to-emerald-50/90 dark:to-emerald-500/10 border-l-4 border-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-500/20 shadow-[0_12px_35px_rgba(16,185,129,0.14)] animate-in fade-in duration-300' 
                                                    : ''
                                            }`}
                                        >
                                            <td className="px-5 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-slate-900 dark:text-slate-100 tracking-wide text-xs">{enc.codigoFormatado}</span>
                                                    <span className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase">
                                                        <ClipboardList size={10} />
                                                        {enc.pedidoCompra?.codigoFormatado || `#${enc.pedidoCompraId}`}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300 text-xs">
                                                    <Building2 size={12} className="text-slate-400 shrink-0" />
                                                    {enc.fornecedor?.nome || '—'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-slate-600 dark:text-slate-400 font-bold text-xs">
                                                {enc.linhas?.length ?? 0}
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <span className="font-black text-slate-900 dark:text-slate-100 text-xs">{formatCurrency(enc.valorTotal)}</span>
                                            </td>
                                            <td className="px-5 py-4">
                                                {isEntregue && enc.dataEntregaReal ? (
                                                    <span className="flex items-center gap-1.5 text-emerald-700 font-black text-[11px] bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-100 dark:border-emerald-500/20">
                                                        <CheckCircle2 size={12} />
                                                        {formatDate(enc.dataEntregaReal)}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-600 dark:text-slate-400 font-bold text-[11px] flex items-center gap-1.5">
                                                        <Calendar size={12} className="text-slate-400" />
                                                        {formatDate(enc.dataEntregaPrevista)}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border shadow-sm ${cfg.color}`}>
                                                    <EstadoIcon size={10} />
                                                    {cfg.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-slate-400 font-bold text-[10px]">
                                                {formatDate(enc.dataEmissao)}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                    {/* CANCELAR — só emitida ou enviada */}
                                                    {podeCancelar && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setCancelConfirmId(enc.id); }}
                                                            className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider px-3 py-2 rounded-xl transition-all border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 active:scale-95"
                                                            title="Cancelar encomenda"
                                                        >
                                                            <XCircle size={13} />
                                                            Cancelar
                                                        </button>
                                                    )}

                                                    {/* ENCERRAR — só parcialmente entregue */}
                                                    {podeEncerrar && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEncerrarDirectEnc(enc);
                                                                setEncerrarDirectMotivo('');
                                                            }}
                                                            className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider px-3 py-2 rounded-xl transition-all border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95"
                                                            title="Encerrar encomenda"
                                                        >
                                                            <ClipboardList size={13} />
                                                            Encerrar
                                                        </button>
                                                    )}

                                                    {/* MARCAR ENVIADA — só admin em emitida */}
                                                    {isEmitida && isAdmin && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleMudarEstado(enc.id, 'ENVIADA');
                                                            }}
                                                            className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider px-4 py-2 rounded-xl transition-all border bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 hover:scale-105 active:scale-95 border-blue-500/20"
                                                            title="Marcar como Enviada"
                                                        >
                                                            <Truck size={14} />
                                                            Marcar Enviada
                                                        </button>
                                                    )}

                                                    {/* RECEBER */}
                                                    {podeReceber && (
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleOpenRececao(enc);
                                                            }}
                                                            className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider px-4 py-2 rounded-xl transition-all border bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 hover:scale-105 active:scale-95 border-emerald-500/20"
                                                            title="Registar receção"
                                                        >
                                                            <Package size={14} />
                                                            {isParcial ? 'Receber Restante' : 'Receber Encomenda'}
                                                        </button>
                                                    )}

                                                    {/* Estado final — sem ações */}
                                                    {isFinalizada && (
                                                        <span className="text-[11px] text-slate-400 font-bold italic">
                                                            {enc.estado === 'ENTREGUE' ? 'Concluída' : enc.estado === 'ENCERRADA' ? 'Encerrada' : 'Cancelada'}
                                                        </span>
                                                    )}

                                                    {/* REPETIR — sempre disponível */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleReordenar(
                                                                (enc.linhas || []).map((l: any) => ({
                                                                    produtoId: l.produtoId ?? l.produto?.id,
                                                                    quantidade: l.quantidade
                                                                }))
                                                            );
                                                        }}
                                                        className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider px-3 py-2 rounded-xl transition-all border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:border-slate-600 hover:text-slate-700 dark:text-slate-300"
                                                        title="Repetir encomenda"
                                                    >
                                                        <RotateCcw size={13} />
                                                        Repetir
                                                    </button>
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

            {/* Modal de Confirmação de Cancelamento */}
            {cancelConfirmId !== null && (() => {
                const enc = encomendas.find(e => e.id === cancelConfirmId);
                return (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center shrink-0">
                                    <ShieldAlert size={20} className="text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Cancelar Encomenda?</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Esta ação é irreversível.</p>
                                </div>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-5">
                                Tens a certeza que pretendes cancelar a encomenda{' '}
                                <span className="font-black text-slate-900 dark:text-slate-100">{enc?.codigoFormatado}</span>?
                                O estado não poderá ser revertido.
                            </p>
                            <div className="flex items-center justify-end gap-3">
                                <button
                                    onClick={() => setCancelConfirmId(null)}
                                    className="px-4 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-700/50 rounded-lg transition-all"
                                >
                                    Voltar
                                </button>
                                <button
                                    onClick={() => handleCancelarEncomenda(cancelConfirmId)}
                                    className="flex items-center gap-2 px-5 py-2 text-sm font-black text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-lg shadow-red-500/20 transition-all active:scale-95"
                                >
                                    <XCircle size={15} /> Confirmar Cancelamento
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

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

            {showDetailsModal && selectedEncomenda && (
                <DetalhesEncomendaModal
                    isOpen={showDetailsModal}
                    encomenda={selectedEncomenda}
                    onClose={() => {
                        setShowDetailsModal(false);
                        setSelectedEncomenda(null);
                    }}
                    onUpdateEstado={handleMudarEstado}
                    onReceber={(enc) => {
                        setShowDetailsModal(false);
                        handleOpenRececao(enc);
                    }}
                    onReordenar={handleReordenar}
                    onEncerrar={handleEncerrar}
                    isAdmin={isAdmin}
                />
            )}

            {/* Modal de Encerramento Direto da Lista */}
            {encerrarDirectEnc && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                                <ClipboardList size={20} className="text-slate-600 dark:text-slate-300" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Encerrar Encomenda?</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    {encerrarDirectEnc.codigoFormatado} — entrega parcial
                                </p>
                            </div>
                        </div>
                        <div className="mb-5 space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Motivo (obrigatório)</label>
                            <textarea
                                value={encerrarDirectMotivo}
                                onChange={(e) => setEncerrarDirectMotivo(e.target.value)}
                                placeholder="Ex: Fornecedor sem stock para o restante."
                                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500 min-h-[80px]"
                                autoFocus
                            />
                        </div>
                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={() => { setEncerrarDirectEnc(null); setEncerrarDirectMotivo(''); }}
                                className="px-4 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                            >
                                Voltar
                            </button>
                            <button
                                onClick={() => handleEncerrar(encerrarDirectEnc.id, encerrarDirectMotivo)}
                                disabled={!encerrarDirectMotivo.trim()}
                                className="flex items-center gap-2 px-5 py-2 text-sm font-black text-white bg-slate-800 dark:bg-slate-600 hover:bg-slate-900 dark:hover:bg-slate-500 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                            >
                                <ClipboardList size={15} /> Confirmar Fecho
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
