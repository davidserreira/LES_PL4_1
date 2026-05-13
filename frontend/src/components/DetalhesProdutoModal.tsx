import {
    X, Package, Calendar, Tag, AlertTriangle, CheckCircle2, Factory, DollarSign, Database, FileText, Star
} from 'lucide-react';
import { createPortal } from 'react-dom';

interface Produto {
    id: number;
    nome: string;
    stock: number;
    stockMinimo: number;
    preco?: number;
    categoria?: string;
    descricao?: string;
    fornecedores?: { id: number; nome: string }[];
    fornecedorPreferencial?: { id: number; nome: string } | null;
    precosFornecedores?: { fornecedorId: number; preco: number }[];
    linhasPedido?: {
        pedidoCompra: {
            id: number;
            estado: string;
            criadoEm: string;
            prioridade: string;
        }
    }[];
}

interface DetalhesProdutoModalProps {
    isOpen: boolean;
    onClose: () => void;
    produto: Produto;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
};

export default function DetalhesProdutoModal({ isOpen, onClose, produto }: DetalhesProdutoModalProps) {
    if (!isOpen || !produto) return null;

    const isCritico = produto.stock <= produto.stockMinimo;

    return createPortal(
        <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header Modal */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/80">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm border border-emerald-100 dark:border-emerald-500/20">
                            <Package size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
                                {produto.nome}
                            </h2>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 dark:bg-slate-700/70 text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                    ID: {produto.id}
                                </span>
                                {produto.categoria && (
                                    <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                                        <Tag size={12} className="text-slate-400" />
                                        {produto.categoria}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:bg-slate-700 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900 relative custom-scrollbar space-y-6">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Status Card */}
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <Database size={14} /> Níveis de Inventário
                            </h3>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-0.5">Stock Atual</p>
                                    <p className={`text-2xl font-black ${isCritico ? 'text-red-500' : 'text-slate-900 dark:text-slate-100'}`}>{produto.stock}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-0.5">Mínimo</p>
                                    <p className="text-lg font-bold text-slate-400">{produto.stockMinimo}</p>
                                </div>
                            </div>
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-700/50 flex justify-between items-center">
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Estado:</span>
                                {isCritico ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20">
                                        <AlertTriangle size={12} />
                                        CRÍTICO
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
                                        <CheckCircle2 size={12} />
                                        ESTÁVEL
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Values Card */}
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <DollarSign size={14} /> Financeiro
                            </h3>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-0.5">Preço Unitário</p>
                                <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{formatCurrency(produto.preco || 0)}</p>
                            </div>
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-700/50">
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-0.5">Valor Total em Stock</p>
                                <p className="text-lg font-bold text-slate-700 dark:text-slate-300">{formatCurrency((produto.preco || 0) * produto.stock)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Descricao & Fornecedores */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <FileText size={14} /> Descrição
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                {produto.descricao || <span className="italic text-slate-400">Sem descrição fornecida.</span>}
                            </p>
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <Factory size={14} /> Fornecedores Vinculados
                            </h3>
                            {produto.fornecedores && produto.fornecedores.length > 0 ? (
                                <ul className="space-y-2">
                                    {produto.fornecedores.map(f => {
                                        const isPreferencial = produto.fornecedorPreferencial?.id === f.id;
                                        const precoAcordado = produto.precosFornecedores?.find(p => p.fornecedorId === f.id)?.preco;
                                        return (
                                            <li key={f.id} className={`text-sm font-medium flex items-center justify-between gap-2 p-2.5 bg-white dark:bg-slate-800 border rounded-xl transition-all ${isPreferencial ? 'border-amber-200 shadow-sm shadow-amber-500/5' : 'border-slate-100 dark:border-slate-700/50 hover:border-slate-200 dark:border-slate-700'}`}>
                                                <div className="flex items-center gap-2.5 flex-1">
                                                    <div className={`w-2 h-2 rounded-full shadow-inner shrink-0 ${isPreferencial ? 'bg-amber-400' : 'bg-emerald-400'}`}></div>
                                                    <div className="flex flex-col">
                                                        <span className={isPreferencial ? 'text-amber-900 font-bold leading-tight' : 'text-slate-700 dark:text-slate-300 leading-tight'}>{f.nome}</span>
                                                        {precoAcordado !== undefined && (
                                                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Preço: {formatCurrency(precoAcordado)}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                {isPreferencial && (
                                                    <span className="bg-amber-100 text-amber-700 border border-amber-200 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                                                        <Star size={10} className="fill-current" /> Preferencial
                                                    </span>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <p className="text-sm italic text-slate-400">Nenhum fornecedor vinculado.</p>
                            )}
                        </div>
                    </div>

                    {/* History / Orders */}
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <Package size={14} /> Pedidos Associados
                        </h3>
                        {produto.linhasPedido && produto.linhasPedido.length > 0 ? (
                            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                                {produto.linhasPedido.map(linha => {
                                    const ano = new Date(linha.pedidoCompra.criadoEm).getFullYear();
                                    const pId = String(linha.pedidoCompra.id).padStart(3, '0');
                                    const estado = linha.pedidoCompra.estado;
                                    return (
                                        <div key={linha.pedidoCompra.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-700/50 transition-colors">
                                            <div>
                                                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                                    Pedido PM-{ano}-{pId}
                                                </div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                                                    <Calendar size={12} className="text-slate-400" />
                                                    {new Date(linha.pedidoCompra.criadoEm).toLocaleDateString('pt-PT')}
                                                </div>
                                            </div>
                                            <div>
                                                <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md tracking-wider ${
                                                    estado === 'PENDENTE' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                                    estado === 'RASCUNHO' ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600' :
                                                    'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                                }`}>
                                                    {estado}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                                <Package size={32} strokeWidth={1} className="mb-2 text-slate-300" />
                                <p className="text-sm">Este produto não está presente em nenhum pedido.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
