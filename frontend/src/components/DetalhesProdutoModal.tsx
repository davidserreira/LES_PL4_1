import {
    X, Package, Calendar, Tag, AlertTriangle, CheckCircle2, Factory, DollarSign, Database, FileText
} from 'lucide-react';

interface Produto {
    id: number;
    nome: string;
    stock: number;
    stockMinimo: number;
    preco?: number;
    categoria?: string;
    descricao?: string;
    fornecedores?: { id: number; nome: string }[];
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

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header Modal */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/80">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-sm border border-blue-100">
                            <Package size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 leading-tight">
                                {produto.nome}
                            </h2>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200/70 text-slate-600 uppercase tracking-wider">
                                    ID: {produto.id}
                                </span>
                                {produto.categoria && (
                                    <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium">
                                        <Tag size={12} className="text-slate-400" />
                                        {produto.categoria}
                                    </span>
                                )}
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
                        {/* Status Card */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <Database size={14} /> Níveis de Inventário
                            </h3>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500 mb-0.5">Stock Atual</p>
                                    <p className={`text-2xl font-black ${isCritico ? 'text-red-500' : 'text-slate-900'}`}>{produto.stock}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-slate-500 mb-0.5">Mínimo</p>
                                    <p className="text-lg font-bold text-slate-400">{produto.stockMinimo}</p>
                                </div>
                            </div>
                            <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                                <span className="text-xs text-slate-500 font-medium">Estado:</span>
                                {isCritico ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black bg-amber-50 text-amber-600 border border-amber-100">
                                        <AlertTriangle size={12} />
                                        CRÍTICO
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100">
                                        <CheckCircle2 size={12} />
                                        ESTÁVEL
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Values Card */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <DollarSign size={14} /> Financeiro
                            </h3>
                            <div>
                                <p className="text-sm text-slate-500 mb-0.5">Preço Unitário</p>
                                <p className="text-2xl font-black text-slate-900">{formatCurrency(produto.preco || 0)}</p>
                            </div>
                            <div className="pt-2 border-t border-slate-100">
                                <p className="text-sm text-slate-500 mb-0.5">Valor Total em Stock</p>
                                <p className="text-lg font-bold text-slate-700">{formatCurrency((produto.preco || 0) * produto.stock)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Descricao & Fornecedores */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <FileText size={14} /> Descrição
                            </h3>
                            <p className="text-sm text-slate-600">
                                {produto.descricao || <span className="italic text-slate-400">Sem descrição fornecida.</span>}
                            </p>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <Factory size={14} /> Fornecedores Vinculados
                            </h3>
                            {produto.fornecedores && produto.fornecedores.length > 0 ? (
                                <ul className="space-y-1.5">
                                    {produto.fornecedores.map(f => (
                                        <li key={f.id} className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div> {f.nome}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm italic text-slate-400">Nenhum fornecedor vinculado.</p>
                            )}
                        </div>
                    </div>

                    {/* History / Orders */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
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
                                        <div key={linha.pedidoCompra.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-colors">
                                            <div>
                                                <div className="text-sm font-bold text-slate-900">
                                                    Pedido PM-{ano}-{pId}
                                                </div>
                                                <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                                    <Calendar size={12} className="text-slate-400" />
                                                    {new Date(linha.pedidoCompra.criadoEm).toLocaleDateString('pt-PT')}
                                                </div>
                                            </div>
                                            <div>
                                                <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md tracking-wider ${
                                                    estado === 'PENDENTE' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                                    estado === 'RASCUNHO' ? 'bg-slate-200 text-slate-700 border border-slate-300' :
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
        </div>
    );
}
