
import { useState, useEffect } from 'react';
import { Plus, Package, AlertTriangle, CheckCircle2, Trash2, X, AlertCircle } from 'lucide-react';
import { produtoService } from '../services/produtoService';
import CriarProdutoModal from '../components/CriarProdutoModal';

interface Produto {
    id: number;
    nome: string;
    stock: number;
    stockMinimo: number;
    preco?: number;
    categoria?: string;
    descricao?: string;
    criadoEm: string;
}

interface Toast {
    message: string;
    type: 'success' | 'error';
}

const Catalogo = () => {
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    // Toast state
    const [toast, setToast] = useState<Toast | null>(null);

    // Delete Confirmation state
    const [productToDelete, setProductToDelete] = useState<Produto | null>(null);

    const fetchProdutos = async () => {
        try {
            setLoading(true);
            const data = await produtoService.getAll();
            setProdutos(data);
        } catch (error) {
            console.error('Erro ao buscar produtos:', error);
            showToast('Erro ao carregar os produtos.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const handleDelete = async () => {
        if (!productToDelete) return;

        try {
            await produtoService.delete(productToDelete.id);
            showToast(`Produto "${productToDelete.nome}" eliminado com sucesso.`, 'success');
            setProductToDelete(null);
            fetchProdutos();
        } catch (error) {
            console.error('Erro ao eliminar produto:', error);
            showToast('Erro ao eliminar o produto. Tente novamente.', 'error');
        }
    };

    useEffect(() => {
        fetchProdutos();
    }, []);

    return (
        <div className="space-y-6 relative">
            {/* Toast Notification */}
            {toast && (
                <div className="fixed top-6 right-6 z-[60] animate-in slide-in-from-right-full duration-300">
                    <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border ${toast.type === 'success'
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                            : 'bg-red-50 border-red-100 text-red-800'
                        }`}>
                        {toast.type === 'success' ? <CheckCircle2 size={20} className="text-emerald-500" /> : <AlertCircle size={20} className="text-red-500" />}
                        <span className="text-sm font-bold">{toast.message}</span>
                        <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70 transition-opacity">
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Custom Delete Confirmation Modal */}
            {productToDelete && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setProductToDelete(null)} />
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                            <Trash2 size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Eliminar Produto?</h3>
                        <p className="text-slate-500 text-center mb-8 font-medium">
                            Tem a certeza que deseja eliminar <span className="text-slate-900 font-bold">"{productToDelete.nome}"</span>? Esta ação não pode ser revertida.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setProductToDelete(null)}
                                className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 px-4 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all text-sm shadow-lg shadow-red-200"
                            >
                                Sim, Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Catálogo</h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Gerencie os produtos do catálogo nesta secção.
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                >
                    <Plus size={18} />
                    Adicionar Produto
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                </div>
            ) : produtos.length > 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-left">Produto</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-left">Categoria</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Stock</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Stock Mín.</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Preço</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Estado</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {produtos.map((produto) => (
                                <tr key={produto.id} className="hover:bg-slate-50/80 transition-all group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2.5 bg-white border border-slate-100 shadow-sm rounded-xl text-slate-600 group-hover:text-emerald-600 transition-colors">
                                                <Package size={20} />
                                            </div>
                                            <div>
                                                <span className="block font-bold text-slate-900">{produto.nome}</span>
                                                {produto.descricao && (
                                                    <span className="text-xs text-slate-400 font-medium truncate max-w-[200px] block">{produto.descricao}</span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-left">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                            {produto.categoria || 'Sem categoria'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <span className="font-mono font-bold text-slate-700">{produto.stock}</span>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <span className="font-mono font-medium text-slate-400">{produto.stockMinimo}</span>
                                    </td>
                                    <td className="px-6 py-5 text-right font-bold text-slate-900">
                                        {produto.preco ? `${produto.preco.toFixed(2)} €` : '0.00 €'}
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex justify-center">
                                            {produto.stock <= produto.stockMinimo ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-100">
                                                    <AlertTriangle size={14} className="animate-pulse" />
                                                    CRÍTICO
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                    <CheckCircle2 size={14} />
                                                    ESTÁVEL
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex justify-center">
                                            <button
                                                onClick={() => setProductToDelete(produto)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Eliminar produto"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="bg-white p-20 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                        <Package size={48} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Catálogo Vazio</h3>
                    <p className="text-slate-500 max-w-sm font-medium mb-8">
                        O catálogo está atualmente sem produtos. Comece por adicionar os itens essenciais para a sua clínica.
                    </p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all hover:shadow-xl active:scale-95"
                    >
                        <Plus size={20} />
                        Criar Primeiro Produto
                    </button>
                </div>
            )}

            <CriarProdutoModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    fetchProdutos();
                    showToast('Produto registado com sucesso!', 'success');
                }}
            />
        </div>
    );
};

export default Catalogo;
