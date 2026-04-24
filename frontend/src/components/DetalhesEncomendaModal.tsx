import { 
    X, Package, Truck, CheckCircle2, Clock, Calendar, Building2, 
    ClipboardList, AlertTriangle, ChevronRight, Euro, XCircle, Tag, Eye
} from 'lucide-react';
import { createPortal } from 'react-dom';

interface LinhaEncomenda {
    id: number;
    produto: {
        nome: string;
        categoria?: string;
    };
    quantidade: number;
    quantidadeRecebida: number;
    precoUnitario: number;
    valorTotal: number;
}

interface Encomenda {
    id: number;
    codigoFormatado: string;
    estado: string;
    dataEmissao: string;
    dataEntregaPrevista?: string;
    dataEntregaReal?: string;
    valorTotal: number;
    fornecedor: {
        nome: string;
        email?: string;
        contacto?: string;
    };
    pedidoCompra?: {
        codigoFormatado: string;
    };
    linhas: LinhaEncomenda[];
    observacoes?: string;
}

interface DetalhesEncomendaModalProps {
    isOpen: boolean;
    onClose: () => void;
    encomenda: Encomenda | null;
    onUpdateEstado: (id: number, novoEstado: string) => void;
    onReceber: (enc: Encomenda) => void;
    isAdmin?: boolean;
}

const formatCurrency = (v: number) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v || 0);
const formatDate = (d: string | Date | null) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('pt-PT'); } catch { return '—'; }
};

const ESTADO_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    EMITIDA:          { label: 'Emitida',          color: 'text-blue-700 bg-blue-50 border-blue-200',      icon: Clock },
    ENVIADA:          { label: 'Enviada',          color: 'text-amber-700 bg-amber-50 border-amber-200',   icon: Truck },
    ENTREGUE_PARCIAL: { label: 'Parcial',          color: 'text-orange-700 bg-orange-50 border-orange-200', icon: Package },
    ENTREGUE:         { label: 'Entregue',         color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
    CANCELADA:        { label: 'Cancelada',        color: 'text-red-700 bg-red-50 border-red-200',         icon: XCircle },
};

export default function DetalhesEncomendaModal({ isOpen, onClose, encomenda, onUpdateEstado, onReceber, isAdmin }: DetalhesEncomendaModalProps) {
    if (!isOpen || !encomenda) return null;

    const cfg = ESTADO_CONFIG[encomenda.estado] || ESTADO_CONFIG.EMITIDA;
    const EstadoIcon = cfg.icon;

    const isEmitida = encomenda.estado === 'EMITIDA';
    const isEnviada = encomenda.estado === 'ENVIADA';
    const isParcial = encomenda.estado === 'ENTREGUE_PARCIAL';
    const isFinalizada = encomenda.estado === 'ENTREGUE' || encomenda.estado === 'CANCELADA';

    return createPortal(
        <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                
                {/* Header Modal */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/80">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-sm border border-emerald-100">
                            <Package size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 leading-tight">
                                Encomenda {encomenda.codigoFormatado}
                            </h2>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${cfg.color}`}>
                                    <EstadoIcon size={12} />
                                    {cfg.label}
                                </span>
                                <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium">
                                    <ClipboardList size={12} className="text-slate-400" />
                                    Pedido: {encomenda.pedidoCompra?.codigoFormatado || 'Manual'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50 relative custom-scrollbar space-y-6">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Vendor Card */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <Building2 size={14} /> Fornecedor
                            </h3>
                            <div>
                                <p className="text-sm font-bold text-slate-900">{encomenda.fornecedor.nome}</p>
                                <p className="text-xs text-slate-500 mt-1">{encomenda.fornecedor.email || 'Sem email'}</p>
                                <p className="text-xs text-slate-500">{encomenda.fornecedor.contacto || 'Sem contacto'}</p>
                            </div>
                        </div>

                        {/* Summary Card */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <Euro size={14} /> Resumo Financeiro
                            </h3>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500 mb-0.5">Total Encomenda</p>
                                    <p className="text-2xl font-black text-emerald-600">{formatCurrency(encomenda.valorTotal)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-slate-500 mb-0.5">Itens</p>
                                    <p className="text-lg font-bold text-slate-400">{encomenda.linhas.length}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Timeline / Dates */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <Calendar size={14} /> Datas Importantes
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Emissão</p>
                                <p className="text-sm font-bold text-slate-700">{formatDate(encomenda.dataEmissao)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entrega Prevista</p>
                                <p className="text-sm font-bold text-amber-600">{formatDate(encomenda.dataEntregaPrevista)}</p>
                            </div>
                            {encomenda.dataEntregaReal && (
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entrega Real</p>
                                    <p className="text-sm font-bold text-emerald-600">{formatDate(encomenda.dataEntregaReal)}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <Package size={14} /> Produtos Encomendados
                        </h3>
                        <div className="border border-slate-100 rounded-xl overflow-hidden">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50/80 border-b border-slate-100">
                                    <tr>
                                        <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Produto</th>
                                        <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-center">Pedido</th>
                                        <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-center">Recebido</th>
                                        <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {encomenda.linhas.map((linha) => (
                                        <tr key={linha.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <p className="font-bold text-slate-900">{linha.produto.nome}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{linha.produto.categoria || 'Geral'}</p>
                                            </td>
                                            <td className="px-4 py-3 text-center font-bold text-slate-700">{linha.quantidade}</td>
                                            <td className="px-4 py-3 text-center font-bold">
                                                <span className={linha.quantidadeRecebida >= linha.quantidade ? 'text-emerald-600' : 'text-amber-600'}>
                                                    {linha.quantidadeRecebida}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-slate-900">{formatCurrency(linha.valorTotal)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {encomenda.observacoes && (
                        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 shadow-sm">
                            <h4 className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-1 flex items-center gap-2">
                                <FileText size={12} /> Observações
                            </h4>
                            <p className="text-xs text-blue-800 leading-relaxed font-medium">{encomenda.observacoes}</p>
                        </div>
                    )}
                </div>

                {/* Footer Modal */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-all"
                    >
                        Voltar
                    </button>
                    
                    <div className="flex items-center gap-3">
                        {isAdmin && !isFinalizada && (
                            <button 
                                onClick={() => onUpdateEstado(encomenda.id, 'CANCELADA')}
                                className="px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            >
                                Cancelar
                            </button>
                        )}

                        {isAdmin && isEmitida && (
                            <button 
                                onClick={() => onUpdateEstado(encomenda.id, 'ENVIADA')}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                            >
                                <Truck size={16} /> Marcar como Enviada
                            </button>
                        )}

                        <button 
                            onClick={() => !isFinalizada && onReceber(encomenda)}
                            disabled={isFinalizada}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                isFinalizada
                                    ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 active:scale-95'
                            }`}
                        >
                            <Package size={16} /> 
                            {isParcial ? 'Receber Restante' : isFinalizada ? 'Receção Concluída' : 'Registar Receção'}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
