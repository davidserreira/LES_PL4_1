import { useState, useEffect } from 'react';
import { Plus, Factory, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { fornecedorService } from '../services/fornecedorService';
import CriarFornecedorModal from '../components/CriarFornecedorModal';

interface Fornecedor {
    id: number;
    nome: string;
    nif?: string;
    contacto?: string;
}

interface Toast {
    message: string;
    type: 'success' | 'error';
}

const Fornecedores = () => {
    const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<Toast | null>(null);

    const fetchFornecedores = async () => {
        try {
            setLoading(true);
            const data = await fornecedorService.getAll();
            setFornecedores(data);
        } catch (error) {
            console.error('Erro ao buscar fornecedores:', error);
            showToast('Erro ao carregar os fornecedores.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        fetchFornecedores();
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

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Fornecedores</h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Gerencie as entidades fornecedoras da clínica nesta secção.
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Plus size={18} />
                    Adicionar Fornecedor
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : fornecedores.length > 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-left">Fornecedor</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-left">NIF</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-left">Contacto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {fornecedores.map((fornecedor) => (
                                <tr key={fornecedor.id} className="hover:bg-slate-50/80 transition-all group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2.5 bg-white border border-slate-100 shadow-sm rounded-xl text-slate-600 group-hover:text-blue-600 transition-colors">
                                                <Factory size={20} />
                                            </div>
                                            <div>
                                                <span className="block font-bold text-slate-900">{fornecedor.nome}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-left">
                                        <span className="font-mono font-medium text-slate-600">
                                            {fornecedor.nif || <span className="text-slate-400 text-xs italic">Não definido</span>}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-left">
                                        <span className="font-medium text-slate-600">
                                            {fornecedor.contacto || <span className="text-slate-400 text-xs italic">Não definido</span>}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="bg-white p-20 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                        <Factory size={48} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Sem Fornecedores</h3>
                    <p className="text-slate-500 max-w-sm font-medium mb-8">
                        Ainda não existem fornecedores registados no sistema. Comece por adicionar o seu primeiro fornecedor.
                    </p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all hover:shadow-xl active:scale-95"
                    >
                        <Plus size={20} />
                        Criar Primeiro Fornecedor
                    </button>
                </div>
            )}

            <CriarFornecedorModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    fetchFornecedores();
                    showToast('Fornecedor registado com sucesso!', 'success');
                }}
            />
        </div>
    );
};

export default Fornecedores;
