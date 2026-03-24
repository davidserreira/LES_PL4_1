import { X, Calendar, User, Tag, Hash, Package, FileText } from 'lucide-react';
import { createPortal } from 'react-dom';
import type { Utilizador } from '../services/utilizadorService';

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
        case 'URGENTE': return 'bg-red-50 text-red-700 border-red-100';
        case 'ALTA': return 'bg-amber-50 text-amber-700 border-amber-100';
        case 'NORMAL': return 'bg-blue-50 text-blue-700 border-blue-100';
        case 'BAIXA': return 'bg-slate-100 text-slate-700 border-slate-200';
        default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
};

const getStatusStyle = (status: string) => {
    switch (status?.toUpperCase()) {
        case 'PENDENTE': return 'text-amber-700 bg-amber-50 border-amber-100';
        case 'APROVADO': return 'text-emerald-700 bg-emerald-50 border-emerald-100';
        case 'CANCELADO':
        case 'RECUSADO': return 'text-red-700 bg-red-50 border-red-100';

        case 'ENTREGUE': return 'text-blue-700 bg-blue-50 border-blue-100';
        default: return 'text-slate-700 bg-slate-50 border-slate-200';

    }
};

export default function DetalhesPedidoCompraModal({ isOpen, onClose, pedido, userRole, onAprovar, onRecusar }: DetalhesPedidoModalProps) {
    if (!isOpen || !pedido) return null;

    const totalProdutos = pedido.linhas?.reduce((acc, l) => acc + l.quantidade, 0) || 0;

    const modalContent = (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                
                {/* Header Modal */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                            Detalhes do Pedido
                            <span className="text-sm font-black bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200">
                                {pedido.codigoFormatado}
                            </span>
                        </h2>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6">
                    {/* Resumo Geral */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row gap-6 justify-between">
                        <div className="space-y-4 flex-1">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                <Package size={16} /> Resumo
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-xs text-slate-500 mb-1 flex items-center gap-1.5"><Calendar size={12}/> Data</p>
                                    <p className="text-sm font-bold text-slate-900">{formatDate(pedido.criadoEm)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-1 flex items-center gap-1.5"><User size={12}/> Emitido por</p>
                                    <p className="text-sm font-bold text-slate-900">
                                        {pedido.criadoPor?.username || '—'}
                                        {pedido.criadoPor && <span className="block text-[10px] text-slate-400 font-normal">{getRoleLabel(pedido.criadoPor.role)}</span>}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-1 flex items-center gap-1.5"><Tag size={12}/> Tipo</p>
                                    <p className="text-sm font-bold text-slate-900">{pedido.tipo}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-1 flex items-center gap-1.5"><Hash size={12}/> Qtd Total Itens</p>
                                    <p className="text-sm font-bold text-slate-900">{totalProdutos} un</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-4 min-w-[140px] border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0 sm:pl-6">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest hidden sm:block mb-4">&nbsp;</h3>
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
                            </div>
                        </div>
                    </div>

                    {/* Produtos List */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-800">Linhas do Pedido ({pedido.linhas?.length || 0})</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50/50 text-slate-500 text-xs border-b border-slate-100 uppercase tracking-wider">
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
                                            <tr key={linha.id || index} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-5 py-3 font-medium text-slate-900">
                                                    {linha.produto?.nome || `Produto #${linha.id}`}
                                                </td>
                                                <td className="px-5 py-3">
                                                    <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 text-[10px] uppercase font-bold tracking-wider">
                                                        {linha.produto?.categoria || 'Sem categoria'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-center font-bold text-slate-700 w-24">{linha.quantidade}</td>
                                                <td className="px-5 py-3 text-right text-slate-500 w-32">{formatCurrency(linha.precoUnitario)}</td>
                                                <td className="px-5 py-3 text-right font-bold text-slate-900 w-32">{formatCurrency(linha.valorTotal)}</td>
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
                        <div className="bg-emerald-50/50 px-6 py-4 flex items-center justify-end gap-6 border-t border-slate-200/60">
                            <span className="text-sm font-bold text-slate-600 uppercase tracking-wider">Total:</span>
                            <span className="text-xl font-bold text-emerald-700">{formatCurrency(pedido.valorTotalEstimado)}</span>
                        </div>
                    </div>
                    
                    {/* Observações Display */}
                    {pedido.observacoes && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                                <FileText size={16} className="text-slate-400" />
                                <h3 className="text-sm font-bold text-slate-800">Observações</h3>
                            </div>
                            <div className="p-6 text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                                {pedido.observacoes}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between">
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
                    </div>
                    <button 
                        onClick={onClose}
                        className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors shadow-sm"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
