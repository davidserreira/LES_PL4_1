import { X, Calendar, User, Tag, Hash, Package, FileText, Lock, Building2, ShieldCheck, PackagePlus, Undo2 } from 'lucide-react';
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
        case 'BAIXA': return 'bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
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
        default: return 'text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700';
    }
};

export default function DetalhesPedidoCompraModal({ isOpen, onClose, pedido, userRole, onAprovar, onRecusar, onEmitirEncomenda, onReverter }: DetalhesPedidoModalProps) {
    if (!isOpen || !pedido) return null;

    const handleEmitir = () => {
        if (!pedido || !onEmitirEncomenda) return;
        onEmitirEncomenda(pedido.id);
    };

    const handleReverter = () => {
        if (!pedido || !onReverter) return;
        onReverter(pedido.id);
    };

    const totalProdutos = pedido.linhas?.reduce((acc, l) => acc + l.quantidade, 0) || 0;
    const isAprovado = pedido.estado === 'APROVADO';
    const isProcessado = pedido.estado === 'PROCESSADO';
    const isLocked = isAprovado || isProcessado;

    return createPortal(
        <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                
                {/* Header Modal */}
                <div className={`flex items-center justify-between px-6 py-4 border-b ${isLocked ? 'border-emerald-100 dark:border-emerald-500/20 bg-gradient-to-r from-emerald-50 dark:from-emerald-900/20 to-teal-50 dark:to-teal-900/20' : 'border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-800'}`}>
                    <div className="flex items-center gap-3">
                        {isLocked && (
                            <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 rounded-xl flex items-center justify-center">
                                <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400" />
                            </div>
                        )}
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                                Detalhes do Pedido
                                <span className="text-sm font-black bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                                    {pedido.codigoFormatado}
                                </span>
                            </h2>
                            {isAprovado && (
                                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5 flex items-center gap-1">
                                    <Lock size={10} />
                                    Pedido aprovado e bloqueado — fornecedores alocados definitivamente
                                </p>
                            )}
                            {isProcessado && (
                                <p className="text-xs text-purple-600 font-medium mt-0.5 flex items-center gap-1">
                                    <Lock size={10} />
                                    Pedido processado — encomendas emitidas com sucesso
                                </p>
                            )}
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-700/50 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900 space-y-6">
                    {/* Resumo Geral */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm flex flex-col sm:flex-row gap-6 justify-between">
                        <div className="space-y-4 flex-1">
                            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
                                <Package size={16} /> Resumo
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5"><Calendar size={12}/> Data</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatDate(pedido.criadoEm)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5"><User size={12}/> Emitido por</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                        {pedido.criadoPor?.username || '—'}
                                        {pedido.criadoPor && <span className="block text-[10px] text-slate-400 font-normal">{getRoleLabel(pedido.criadoPor.role)}</span>}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5"><Tag size={12}/> Tipo</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{pedido.tipo}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5"><Hash size={12}/> Qtd Total Itens</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{totalProdutos} un</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-4 min-w-[140px] border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-slate-700/50 pt-4 sm:pt-0 sm:pl-6">
                            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest hidden sm:block mb-4">&nbsp;</h3>
                            <div className="space-y-3">
                                <div>
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-black border ${getPriorityStyle(pedido.prioridade)}`}>
                                        Prioridade {pedido.prioridade}
                                    </span>
                                </div>
                                <div>
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-black border ${getStatusStyle(pedido.estado)}`}>
                                        <span className="w-1.5 h-1.5 rounded-full mr-1.5 currentColor bg-current opacity-70"></span>
                                        {pedido.estado}
                                    </span>
                                </div>
                                {isLocked && (
                                    <div>
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-black border bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700">
                                            <Lock size={9} /> {isProcessado ? 'Efetuado' : 'Bloqueado'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Produtos List — LOCKED: vista locked premium */}
                    {isLocked ? (
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-emerald-200 overflow-hidden shadow-sm">
                            <div className="p-5 border-b border-emerald-100 dark:border-emerald-500/20 flex items-center justify-between bg-gradient-to-r from-emerald-50/60 dark:from-emerald-900/20 to-teal-50/40 dark:to-teal-900/20">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Linhas Aprovadas ({pedido.linhas?.length || 0})</h3>
                                    <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
                                        <Lock size={8} /> Fornecedores Alocados
                                    </span>
                                </div>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {pedido.linhas && pedido.linhas.length > 0 ? (
                                    pedido.linhas.map((linha, index) => (
                                        <div key={linha.id || index} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900/50 transition-colors">
                                            {/* Left: Product info */}
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                <div className="w-9 h-9 bg-gradient-to-br from-slate-100 dark:from-slate-800 to-slate-50 dark:to-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                                                    <Package size={15} />
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">{linha.produto?.nome || `Produto #${linha.id}`}</h4>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="inline-flex px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-[9px] uppercase font-bold tracking-wider">
                                                            {linha.produto?.categoria || 'Sem categoria'}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-medium">{linha.quantidade} un × {formatCurrency(linha.precoUnitario)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right: Supplier locked + subtotal */}
                                            <div className="flex items-center gap-6 shrink-0">
                                                {/* Supplier locked badge */}
                                                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-right min-w-[160px]">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1 justify-end">
                                                        <Building2 size={9} /> Fornecedor Alocado
                                                    </p>
                                                    {linha.fornecedor ? (
                                                        <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{linha.fornecedor.nome}</p>
                                                    ) : (
                                                        <p className="text-sm font-medium text-slate-400 italic">Não definido</p>
                                                    )}
                                                </div>
                                                {/* Subtotal */}
                                                <div className="text-right min-w-[90px]">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Subtotal</p>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatCurrency(linha.valorTotal)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-6 py-10 text-center text-slate-400">
                                        Nenhuma linha encontrada.
                                    </div>
                                )}
                            </div>
                            <div className="bg-emerald-50 dark:bg-emerald-500/10 px-6 py-4 flex items-center justify-end gap-6 border-t border-emerald-100 dark:border-emerald-500/20">
                                <span className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Total:</span>
                                <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(pedido.valorTotalEstimado)}</span>
                            </div>
                        </div>
                    ) : (
                        /* PENDENTE / RECUSADO / CANCELADO: tabela standard */
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                            <div className="p-5 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Linhas do Pedido ({pedido.linhas?.length || 0})</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs border-b border-slate-100 dark:border-slate-700/50 uppercase tracking-wider">
                                        <tr>
                                            <th className="px-5 py-3 font-semibold">Produto</th>
                                            <th className="px-5 py-3 font-semibold">Categoria</th>
                                            <th className="px-5 py-3 font-semibold text-center">Quantidade</th>
                                            <th className="px-5 py-3 font-semibold text-right">Preço Unit.</th>
                                            <th className="px-5 py-3 font-semibold text-right">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {pedido.linhas && pedido.linhas.length > 0 ? (
                                            pedido.linhas.map((linha, index) => (
                                                <tr key={linha.id || index} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900/50 transition-colors">
                                                    <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100">
                                                        {linha.produto?.nome || `Produto #${linha.id}`}
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-[10px] uppercase font-bold tracking-wider">
                                                            {linha.produto?.categoria || 'Sem categoria'}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3 text-center font-bold text-slate-700 dark:text-slate-300 w-24">{linha.quantidade}</td>
                                                    <td className="px-5 py-3 text-right text-slate-500 dark:text-slate-400 w-32">{formatCurrency(linha.precoUnitario)}</td>
                                                    <td className="px-5 py-3 text-right font-bold text-slate-900 dark:text-slate-100 w-32">{formatCurrency(linha.valorTotal)}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                                                    Nenhuma linha encontrada.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="bg-emerald-50 dark:bg-emerald-500/10 px-6 py-4 flex items-center justify-end gap-6 border-t border-slate-200 dark:border-slate-700/60">
                                <span className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Total:</span>
                                <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(pedido.valorTotalEstimado)}</span>
                            </div>
                        </div>
                    )}
                    
                    {/* Observações Display */}
                    {pedido.observacoes && (
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-2">
                                <FileText size={16} className="text-slate-400" />
                                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Observações</h3>
                            </div>
                            <div className="p-6 text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">
                                {pedido.observacoes}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-800 flex items-center justify-between">
                    {/* Left side */}
                    <div className="flex gap-3">
                        <button 
                            onClick={onClose}
                            className="px-6 py-2.5 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl transition-colors shadow-sm"
                        >
                            Fechar
                        </button>
                        {isAprovado && onReverter && (
                            <button 
                                onClick={handleReverter}
                                className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-red-200 hover:bg-red-50 dark:bg-red-500/10 hover:border-red-300 text-red-600 dark:text-red-400 text-sm font-bold rounded-xl transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
                            >
                                <Undo2 size={15} />
                                Reverter
                            </button>
                        )}
                    </div>

                    {/* Right side */}
                    <div className="flex gap-3">
                        {pedido.estado === 'PENDENTE' && userRole && (userRole === 'RESPONSAVEL_FINANCEIRO' || userRole === 'ADMINISTRADOR') && (
                            <>
                                <button
                                    onClick={() => onAprovar && onAprovar(pedido.id)}
                                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm flex items-center gap-2"
                                >
                                    Aprovar
                                </button>
                                <button
                                    onClick={() => onRecusar && onRecusar(pedido.id)}
                                    className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm flex items-center gap-2"
                                >
                                    Recusar
                                </button>
                            </>
                        )}
                        {isAprovado && onEmitirEncomenda && (
                            <button
                                onClick={handleEmitir}
                                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors shadow-lg flex items-center gap-2"
                            >
                                <PackagePlus size={15} />
                                Emitir Encomenda
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
