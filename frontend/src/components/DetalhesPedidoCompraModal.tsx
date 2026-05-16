import { X, Calendar, User, Tag, Hash, Package, FileText, Lock, Building2, PackagePlus, Undo2, ClipboardList, CheckCircle2, XCircle, AlertCircle, Truck } from 'lucide-react';
import { createPortal } from 'react-dom';
import type { Utilizador } from '../services/utilizadorService';

interface Fornecedor {
    id: number;
    nome: string;
    nif?: string;
    contacto?: string;
    email?: string;
}

interface Produto {
    id: number;
    nome: string;
    preco: number;
    stock: number;
    stockMinimo: number;
    categoria?: string;
}

interface LinhaPedido {
    id: number;
    quantidade: number;
    precoUnitario: number;
    valorTotal: number;
    produto?: Produto;
    fornecedor?: Fornecedor;
    fornecedorId?: number;
}

interface LinhaEncomenda {
    id: number;
    produtoId: number;
    quantidade: number;
    quantidadeRecebida: number;
}

interface Encomenda {
    id: number;
    codigoFormatado: string;
    estado: string;
    fornecedorId: number;
    fornecedor?: Fornecedor;
    linhas?: LinhaEncomenda[];
}

interface PedidoCompra {
    id: number;
    estado: string;
    prioridade: string;
    valorTotalEstimado: number;
    criadoEm: string | Date;
    criadoPor?: {
        id: number;
        username: string;
        role: Utilizador['role'];
    } | null;
    linhas?: LinhaPedido[];
    encomendas?: Encomenda[];
    tipo: string;
    codigoFormatado: string;
    observacoes?: string;
}

interface DetalhesPedidoModalProps {
    isOpen: boolean;
    onClose: () => void;
    pedido: PedidoCompra | null;
    userRole?: string;
    onAprovar?: (pedidoId: number) => void;
    onRecusar?: (pedidoId: number) => void;
    onEmitirEncomenda?: (pedidoId: number) => void;
    onReverter?: (pedidoId: number) => void;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value || 0);
};

const formatDate = (value: string | Date) => {
    try {
        return new Date(value).toLocaleDateString('pt-PT', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return '';
    }
};

const getRoleLabel = (role?: Utilizador['role']) => {
    switch (role) {
        case 'ADMINISTRADOR': return 'Admin';
        case 'RESPONSAVEL_STOCK': return 'Gestor Stock';
        case 'RESPONSAVEL_FINANCEIRO': return 'Financeiro';
        default: return 'Utilizador';
    }
};

const getPriorityStyle = (priority: string) => {
    switch (priority?.toUpperCase()) {
        case 'URGENTE': return 'bg-red-50 dark:bg-red-500/10 text-red-700 border-red-100 dark:border-red-500/20';
        case 'ALTA': return 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 border-amber-100 dark:border-amber-500/20';
        case 'NORMAL': return 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 border-blue-100 dark:border-blue-500/20';
        default: return 'bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
};

const getStatusStyle = (status: string) => {
    switch (status?.toUpperCase()) {
        case 'PENDENTE': return 'text-amber-700 bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20';
        case 'APROVADO': return 'text-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20';
        case 'CANCELADO':
        case 'RECUSADO': return 'text-red-700 bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20';
        case 'ENTREGUE': return 'text-blue-700 bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20';
        case 'CONCLUÍDO': return 'text-emerald-800 bg-emerald-100 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20';
        case 'ENCERRADO': return 'text-slate-600 bg-slate-100 dark:bg-slate-500/10 border-slate-200 dark:border-slate-500/20';
        default: return 'text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700';
    }
};

const getEncEstadoConfig = (estado: string): { label: string; cls: string; Icon: any } => {
    switch (estado?.toUpperCase()) {
        case 'ENTREGUE': return { label: 'Entregue', cls: 'text-emerald-700 bg-emerald-50 border-emerald-200', Icon: CheckCircle2 };
        case 'CANCELADA': return { label: 'Cancelada', cls: 'text-red-600 bg-red-50 border-red-200', Icon: XCircle };
        case 'ENCERRADA': return { label: 'Encerrada', cls: 'text-amber-700 bg-amber-50 border-amber-200', Icon: AlertCircle };
        case 'ENTREGUE_PARCIAL': return { label: 'Parcial', cls: 'text-amber-700 bg-amber-50 border-amber-200', Icon: AlertCircle };
        case 'ENVIADA': return { label: 'Em trânsito', cls: 'text-blue-600 bg-blue-50 border-blue-200', Icon: Truck };
        case 'EMITIDA': return { label: 'Emitida', cls: 'text-slate-600 bg-slate-100 border-slate-200', Icon: Package };
        default: return { label: estado, cls: 'text-slate-600 bg-slate-100 border-slate-200', Icon: Package };
    }
};

export default function DetalhesPedidoCompraModal({ isOpen, onClose, pedido, userRole, onAprovar, onRecusar, onEmitirEncomenda, onReverter }: DetalhesPedidoModalProps) {
    if (!isOpen || !pedido) return null;

    const handleEmitir = () => { if (onEmitirEncomenda) onEmitirEncomenda(pedido.id); };
    const handleReverter = () => { if (onReverter) onReverter(pedido.id); };

    const totalProdutos = pedido.linhas?.reduce((acc, l) => acc + l.quantidade, 0) || 0;
    const isAprovado = pedido.estado === 'APROVADO';
    const isProcessado = pedido.estado === 'PROCESSADO';
    const isConcluido = pedido.estado === 'CONCLUÍDO';
    const isEncerrado = pedido.estado === 'ENCERRADO';
    const isLocked = isAprovado || isProcessado || isConcluido || isEncerrado;
    const isFinished = isConcluido || isEncerrado;

    const getEncomendaParaLinha = (linha: LinhaPedido): Encomenda | undefined => {
        if (!pedido.encomendas || !linha.fornecedorId || !linha.produto) return undefined;
        return pedido.encomendas.find(e =>
            e.fornecedorId === linha.fornecedorId &&
            e.linhas?.some(el => el.produtoId === linha.produto!.id)
        );
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
            onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden border border-slate-100 dark:border-slate-700/50">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-50 dark:bg-blue-500/10 rounded-lg flex items-center justify-center">
                            <ClipboardList size={16} className="text-blue-500" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                Detalhes do Pedido
                                <span className="text-xs font-mono font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                    {pedido.codigoFormatado}
                                </span>
                            </h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-900">

                    {/* Resumo strip */}
                    <div className="px-6 py-4 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700/50 flex flex-wrap items-center gap-6">
                        <div>
                            <p className="text-[9px] uppercase tracking-widest text-slate-400 mb-0.5 flex items-center gap-1"><Calendar size={9} /> Data</p>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{formatDate(pedido.criadoEm)}</p>
                        </div>
                        <div>
                            <p className="text-[9px] uppercase tracking-widest text-slate-400 mb-0.5 flex items-center gap-1"><User size={9} /> Emitido por</p>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                {pedido.criadoPor?.username || '—'}
                                {pedido.criadoPor && <span className="text-[10px] text-slate-400 font-normal ml-1">({getRoleLabel(pedido.criadoPor.role)})</span>}
                            </p>
                        </div>
                        <div>
                            <p className="text-[9px] uppercase tracking-widest text-slate-400 mb-0.5 flex items-center gap-1"><Tag size={9} /> Tipo</p>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{pedido.tipo}</p>
                        </div>
                        <div>
                            <p className="text-[9px] uppercase tracking-widest text-slate-400 mb-0.5 flex items-center gap-1"><Hash size={9} /> Itens</p>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{totalProdutos} un</p>
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-black border ${getPriorityStyle(pedido.prioridade)}`}>
                                {pedido.prioridade}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-black border ${getStatusStyle(pedido.estado)}`}>
                                <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70" />
                                {pedido.estado}
                            </span>
                        </div>
                    </div>

                    {/* Products table */}
                    <div className="p-5">
                        <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700/50">
                            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700/50 flex items-center gap-3">
                                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                    {isFinished ? 'Resultado da Entrega' : isLocked ? 'Linhas Aprovadas' : 'Linhas do Pedido'}
                                </h3>
                                <span className="text-xs text-slate-400">({pedido.linhas?.length || 0} produtos)</span>
                                {isFinished && (
                                    <span className={`ml-auto inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                        isConcluido ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-amber-700 bg-amber-50 border-amber-200'
                                    }`}>
                                        {isConcluido ? <CheckCircle2 size={9} /> : <AlertCircle size={9} />}
                                        {isConcluido ? 'Totalmente entregue' : 'Entrega incompleta'}
                                    </span>
                                )}
                                {isLocked && !isFinished && (
                                    <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border text-slate-500 bg-slate-50 border-slate-200">
                                        <Lock size={8} /> Fornecedores alocados
                                    </span>
                                )}
                            </div>

                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-[9px] uppercase tracking-widest text-slate-400 bg-slate-50/80 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-700/30">
                                        <th className="px-5 py-2 text-left font-semibold">Produto</th>
                                        <th className="px-4 py-2 text-center font-semibold">Qtd</th>
                                        {!isLocked && <th className="px-4 py-2 text-right font-semibold">Preço unit.</th>}
                                        {isLocked && <th className="px-4 py-2 text-left font-semibold"><Building2 size={8} className="inline mr-0.5" />Fornecedor</th>}
                                        {isFinished && <th className="px-4 py-2 text-left font-semibold">Estado</th>}
                                        <th className="px-5 py-2 text-right font-semibold">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pedido.linhas && pedido.linhas.length > 0 ? pedido.linhas.map((linha, index) => {
                                        const enc = isFinished ? getEncomendaParaLinha(linha) : undefined;
                                        const encCfg = enc ? getEncEstadoConfig(enc.estado) : null;
                                        const isCancelled = enc?.estado === 'CANCELADA';
                                        return (
                                            <tr key={linha.id || index} className={`border-b border-slate-50 dark:border-slate-700/20 last:border-0 transition-colors ${isCancelled ? 'opacity-40' : 'hover:bg-slate-50/60 dark:hover:bg-slate-700/10'}`}>
                                                <td className="px-5 py-3">
                                                    <p className={`font-semibold ${isCancelled ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>
                                                        {linha.produto?.nome || `Produto #${linha.id}`}
                                                    </p>
                                                    {linha.produto?.categoria && (
                                                        <p className="text-[9px] text-slate-400 mt-0.5 uppercase tracking-wide">{linha.produto.categoria}</p>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">
                                                    <span className="font-semibold">{linha.quantidade}</span>
                                                    <span className="text-[10px] text-slate-400 ml-0.5">un</span>
                                                </td>
                                                {!isLocked && (
                                                    <td className="px-4 py-3 text-right text-slate-400">{formatCurrency(linha.precoUnitario)}</td>
                                                )}
                                                {isLocked && (
                                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                                                        {linha.fornecedor?.nome || <span className="text-slate-300 italic text-xs">—</span>}
                                                    </td>
                                                )}
                                                {isFinished && (
                                                    <td className="px-4 py-3">
                                                        {encCfg ? (
                                                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${encCfg.cls}`}>
                                                                <encCfg.Icon size={9} /> {encCfg.label}
                                                            </span>
                                                        ) : <span className="text-slate-300 text-xs">—</span>}
                                                    </td>
                                                )}
                                                <td className="px-5 py-3 text-right">
                                                    <span className={`font-bold ${isCancelled ? 'line-through text-slate-300' : 'text-slate-800 dark:text-slate-100'}`}>
                                                        {formatCurrency(linha.valorTotal)}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-400 text-sm">Nenhuma linha encontrada.</td></tr>
                                    )}
                                </tbody>
                            </table>

                            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700/50 flex justify-end items-center gap-3 bg-slate-50/40 dark:bg-slate-900/20">
                                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Total estimado</span>
                                <span className="text-base font-bold text-slate-900 dark:text-slate-100">{formatCurrency(pedido.valorTotalEstimado)}</span>
                            </div>
                        </div>

                        {/* Observações */}
                        {pedido.observacoes && (
                            <div className="mt-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/50 overflow-hidden">
                                <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700/50 flex items-center gap-2">
                                    <FileText size={13} className="text-slate-400" />
                                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Observações</h3>
                                </div>
                                <p className="px-5 py-4 text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">
                                    {pedido.observacoes}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-800 flex items-center justify-between">
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                        >
                            Fechar
                        </button>
                        {isAprovado && onReverter && (
                            <button
                                onClick={handleReverter}
                                className="px-4 py-2 bg-white dark:bg-slate-800 border border-red-200 hover:bg-red-50 hover:border-red-300 text-red-600 text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                            >
                                <Undo2 size={14} /> Reverter
                            </button>
                        )}
                    </div>

                    <div className="flex gap-2">
                        {pedido.estado === 'PENDENTE' && userRole && (userRole === 'RESPONSAVEL_FINANCEIRO' || userRole === 'ADMINISTRADOR') && (
                            <>
                                <button
                                    onClick={() => onAprovar && onAprovar(pedido.id)}
                                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
                                >
                                    Aprovar
                                </button>
                                <button
                                    onClick={() => onRecusar && onRecusar(pedido.id)}
                                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
                                >
                                    Recusar
                                </button>
                            </>
                        )}
                        {isAprovado && onEmitirEncomenda && (
                            <button
                                onClick={handleEmitir}
                                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
                            >
                                <PackagePlus size={14} /> Emitir Encomenda
                            </button>
                        )}
                    </div>
                </div>

            </div>
        </div>,
        document.body
    );
}
