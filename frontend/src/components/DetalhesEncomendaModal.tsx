import { X, Package, Truck, CheckCircle2, Clock, Calendar, Building2, ClipboardList, AlertTriangle, ChevronRight, Euro, XCircle } from 'lucide-react';

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

export default function DetalhesEncomendaModal({ isOpen, onClose, encomenda, onUpdateEstado, onReceber }: DetalhesEncomendaModalProps) {
    if (!isOpen || !encomenda) return null;

    const cfg = ESTADO_CONFIG[encomenda.estado] || ESTADO_CONFIG.EMITIDA;
    const EstadoIcon = cfg.icon;

    const isEmitida = encomenda.estado === 'EMITIDA';
    const isEnviada = encomenda.estado === 'ENVIADA';
    const isParcial = encomenda.estado === 'ENTREGUE_PARCIAL';
    const isFinalizada = encomenda.estado === 'ENTREGUE' || encomenda.estado === 'CANCELADA';

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm">
                            <Package size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-black text-slate-900">{encomenda.codigoFormatado}</h2>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${cfg.color}`}>
                                    <EstadoIcon size={12} />
                                    {cfg.label}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 font-bold mt-0.5 flex items-center gap-1.5">
                                <ClipboardList size={12} />
                                Origem: {encomenda.pedidoCompra?.codigoFormatado || 'Manual'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-slate-200/50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                        {/* Info Fornecedor */}
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <Building2 size={12} /> Fornecedor
                            </h3>
                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                <p className="font-black text-slate-900 text-sm">{encomenda.fornecedor.nome}</p>
                                <p className="text-xs text-slate-500 mt-1">{encomenda.fornecedor.email || 'Sem email'}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{encomenda.fornecedor.contacto || 'Sem contacto'}</p>
                            </div>
                        </div>

                        {/* Info Prazos */}
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <Calendar size={12} /> Prazos e Datas
                            </h3>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="font-bold text-slate-500">Emissão:</span>
                                    <span className="font-black text-slate-900">{formatDate(encomenda.dataEmissao)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="font-bold text-slate-500">Previsão:</span>
                                    <span className="font-black text-amber-600">{formatDate(encomenda.dataEntregaPrevista)}</span>
                                </div>
                                {encomenda.dataEntregaReal && (
                                    <div className="flex justify-between text-xs">
                                        <span className="font-bold text-slate-500">Entrega Real:</span>
                                        <span className="font-black text-emerald-600">{formatDate(encomenda.dataEntregaReal)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Info Financeira */}
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <Euro size={12} /> Resumo Financeiro
                            </h3>
                            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Valor Total</p>
                                <p className="text-2xl font-black text-emerald-700">{formatCurrency(encomenda.valorTotal)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Tabela de Itens */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <Package size={12} /> Itens da Encomenda
                        </h3>
                        <div className="border border-slate-100 rounded-2xl overflow-hidden">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-4 py-3 font-black text-slate-500 uppercase tracking-wider">Produto</th>
                                        <th className="px-4 py-3 font-black text-slate-500 uppercase tracking-wider text-center">Pedido</th>
                                        <th className="px-4 py-3 font-black text-slate-500 uppercase tracking-wider text-center">Recebido</th>
                                        <th className="px-4 py-3 font-black text-slate-500 uppercase tracking-wider text-right">Preço</th>
                                        <th className="px-4 py-3 font-black text-slate-500 uppercase tracking-wider text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {encomenda.linhas.map((linha) => (
                                        <tr key={linha.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-4">
                                                <p className="font-black text-slate-900">{linha.produto.nome}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{linha.produto.categoria || 'Geral'}</p>
                                            </td>
                                            <td className="px-4 py-4 text-center font-bold text-slate-700">{linha.quantidade}</td>
                                            <td className="px-4 py-4 text-center font-bold">
                                                <span className={linha.quantidadeRecebida >= linha.quantidade ? 'text-emerald-600' : 'text-amber-600'}>
                                                    {linha.quantidadeRecebida}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-right font-bold text-slate-500">{formatCurrency(linha.precoUnitario)}</td>
                                            <td className="px-4 py-4 text-right font-black text-slate-900">{formatCurrency(linha.valorTotal)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {encomenda.observacoes && (
                        <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                            <h4 className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-1">Observações</h4>
                            <p className="text-xs text-blue-800 leading-relaxed font-medium">{encomenda.observacoes}</p>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <button onClick={onClose} className="px-6 py-2.5 text-xs font-black text-slate-500 hover:text-slate-700 transition-colors">
                        Fechar
                    </button>
                    
                    <div className="flex items-center gap-3">
                        {!isFinalizada && (
                            <button 
                                onClick={() => onUpdateEstado(encomenda.id, 'CANCELADA')}
                                className="px-6 py-2.5 text-xs font-black text-red-600 hover:bg-red-50 rounded-xl transition-all"
                            >
                                Cancelar Encomenda
                            </button>
                        )}

                        {isEmitida && (
                            <button 
                                onClick={() => onUpdateEstado(encomenda.id, 'ENVIADA')}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                            >
                                <Truck size={16} /> Marcar como Enviada
                            </button>
                        )}

                        {(isEnviada || isParcial) && (
                            <button 
                                onClick={() => onReceber(encomenda)}
                                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                            >
                                <Package size={16} /> {isParcial ? 'Receber Restante' : 'Registar Receção'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
