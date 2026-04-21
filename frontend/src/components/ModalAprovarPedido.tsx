import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Trash2, ArrowLeft, Loader2, Package, Building2, ChevronDown, Star } from 'lucide-react';
import { fornecedorService } from '../services/fornecedorService';
import { pedidoCompraService } from '../services/pedidoCompraService';
import { SmartDropdown } from './SmartDropdown';

interface ModalAprovarPedidoProps {
    isOpen: boolean;
    onClose: (refresh?: boolean, msg?: string) => void;
    pedido: any | null;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value || 0);
};

export default function ModalAprovarPedido({ isOpen, onClose, pedido }: ModalAprovarPedidoProps) {
    const [step, setStep] = useState(1);
    const [linhasAprovadas, setLinhasAprovadas] = useState<any[]>([]);
    const [fornecedores, setFornecedores] = useState<any[]>([]);
    const [selectedFornecedores, setSelectedFornecedores] = useState<Record<number, number>>({});
    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
    const triggerRefs = useRef<Record<number, HTMLElement | null>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getMediaAvaliacao = (avaliacoes: any[]) => {
        if (!avaliacoes || avaliacoes.length === 0) return null;
        const soma = avaliacoes.reduce((acc, av) => acc + ((av.qualidade + av.pontualidade + av.comunicacao + av.preco + av.conformidade) / 5), 0);
        return (soma / avaliacoes.length).toFixed(1);
    };

    // Fechar dropdown clicando fora
    useEffect(() => {
        const handleClickOutside = () => setOpenDropdownId(null);
        if (openDropdownId !== null) {
            document.addEventListener('click', handleClickOutside);
        }
        return () => document.removeEventListener('click', handleClickOutside);
    }, [openDropdownId]);

    // Initialize local state when modal opens
    useEffect(() => {
        if (isOpen && pedido?.linhas) {
            setStep(1);
            setLinhasAprovadas([...pedido.linhas]);
            setError(null);
            
            // Fetch fornecedores
            fornecedorService.getAll().then(data => {
                const activeFornecedores = data.filter((f: any) => f.estado === true);
                setFornecedores(activeFornecedores);
                
                // Pre-select mockup for Phase 2
                const initialSelections: Record<number, number> = {};
                if (activeFornecedores.length > 0) {
                    pedido.linhas.forEach((linha: any) => {
                        initialSelections[linha.id] = activeFornecedores[0].id; // Mock pre-selection
                    });
                }
                setSelectedFornecedores(initialSelections);
            }).catch(e => console.error(e));
        }
    }, [isOpen, pedido]);

    if (!isOpen || !pedido) return null;

    const handleRemoveLinha = (linhaId: number) => {
        setLinhasAprovadas(prev => prev.filter(l => l.id !== linhaId));
    };

    const handleNext = () => {
        if (step === 1 && linhasAprovadas.length === 0) {
            setError('Deve manter pelo menos um produto ou cancelar o pedido.');
            return;
        }
        if (step === 2) {
            // Validate all lines have a selected supplier
            const allSelected = linhasAprovadas.every(l => selectedFornecedores[l.id]);
            if (!allSelected) {
                setError('Preencha o fornecedor para todos os produtos.');
                return;
            }
        }
        setError(null);
        setStep(prev => prev + 1);
    };

    const handleBack = () => {
        setError(null);
        setStep(prev => prev - 1);
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError(null);
        try {
            const payloadLinhas = linhasAprovadas.map(linha => ({
                id: linha.id,
                fornecedorId: selectedFornecedores[linha.id]
            }));

            const savedUser = localStorage.getItem('user');
            const user = savedUser ? JSON.parse(savedUser) : null;

            await pedidoCompraService.aprovarPedido(pedido.id, {
                userId: user?.id,
                role: user?.role,
                linhasAprovadas: payloadLinhas
            });
            
            onClose(true, 'Pedido faturado e estruturado com sucesso nos Fornecedores selecionados!');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao processar aprovação.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalResumo = linhasAprovadas.reduce((acc, linha) => {
        return acc + (linha.quantidade * (linha.produto?.preco || 0));
    }, 0);

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl flex flex-col overflow-hidden max-h-[85vh]">
                
                {/* Header Modal */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                            Aprovar Pedido de Compra
                            <span className="text-sm font-black bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200">
                                {pedido.codigoFormatado}
                            </span>
                        </h2>
                    </div>
                    <button 
                        onClick={() => onClose()}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Stepper Visual */}
                <div className="px-6 py-5 bg-slate-50 border-b border-slate-100 flex items-center justify-center gap-4 sm:gap-8">
                    {[
                        { num: 1, title: 'Revisar Pedido' },
                        { num: 2, title: 'Selecionar Fornecedores' },
                        { num: 3, title: 'Confirmar' }
                    ].map((s, i) => (
                        <div key={s.num} className="flex items-center gap-3 sm:gap-4">
                            <div className="flex items-center gap-2 flex-col sm:flex-row">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                                    step > s.num 
                                        ? 'bg-emerald-500 text-white' 
                                        : step === s.num 
                                            ? 'bg-emerald-600 text-white shadow-md' 
                                            : 'bg-slate-200 text-slate-400'
                                }`}>
                                    {step > s.num ? <Check size={16} strokeWidth={3} /> : s.num}
                                </div>
                                <span className={`text-xs font-bold uppercase tracking-wider hidden sm:block ${
                                    step >= s.num ? 'text-slate-800' : 'text-slate-400'
                                }`}>{s.title}</span>
                            </div>
                            {i < 2 && (
                                <div className={`w-8 sm:w-16 h-0.5 rounded ${step > s.num ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Body Content */}
                <div 
                    className="flex-1 overflow-y-auto p-6 bg-white space-y-6"
                    style={{ scrollbarGutter: 'stable' }}
                >
                    {error && (
                        <div className="bg-red-50 text-red-700 p-3 rounded-lg border border-red-100 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Revisão de Quantidades</h3>
                                <p className="text-sm text-slate-500">Analise os produtos solicitados. Se algum produto não tiver aprovação para ser encomendado, remova-o da lista.</p>
                            </div>
                            
                            <div className="space-y-3">
                                {linhasAprovadas.map((linha) => (
                                    <div key={linha.id} className="p-4 rounded-xl border border-slate-200 flex items-center justify-between hover:border-slate-300 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                                <Package size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900">{linha.produto?.nome}</h4>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                                        {linha.produto?.categoria || 'Sem categoria'}
                                                    </span>
                                                    <span className="text-sm text-slate-600 font-medium whitespace-nowrap">
                                                        Quantidade solicitada: <b className="text-slate-800">{linha.quantidade} un</b>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleRemoveLinha(linha.id)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-4 shrink-0"
                                            title="Remover produto da encomenda"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}

                                {linhasAprovadas.length === 0 && (
                                    <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl border-dashed">
                                        <p className="text-slate-500 font-medium">Não restam produtos neste pedido.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Selecionar Fornecedores para os Produtos</h3>
                                <p className="text-sm text-slate-500">Escolha o fornecedor preferencial para encaminhar a compra de cada produto da lista.</p>
                            </div>
                            
                            <div className="space-y-3">
                                {linhasAprovadas.map((linha) => {
                                    return (
                                    <div key={linha.id} className={`p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 relative transition-all ${openDropdownId === linha.id ? 'z-[60] ring-1 ring-emerald-500/20' : 'z-10 hover:border-slate-300'}`}>
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-10 h-10 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                                <Package size={18} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900">{linha.produto?.nome}</h4>
                                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mt-1 block">
                                                    Quantidade: <b className="text-slate-800">{linha.quantidade} un</b>
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex-1 max-w-sm w-full">
                                            <div 
                                                ref={(el) => { triggerRefs.current[linha.id] = el; }}
                                                className={`w-full pl-4 pr-10 py-2.5 bg-white border rounded-xl cursor-pointer select-none transition-all text-sm font-medium flex items-center justify-between ${openDropdownId === linha.id ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md' : 'border-emerald-300 hover:border-emerald-400'} shadow-sm`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenDropdownId(openDropdownId === linha.id ? null : linha.id);
                                                }}
                                            >
                                                <span className={`truncate ${!selectedFornecedores[linha.id] ? 'text-slate-400' : 'text-slate-700'}`}>
                                                    {selectedFornecedores[linha.id] 
                                                        ? fornecedores.find(f => f.id === selectedFornecedores[linha.id])?.nome 
                                                        : 'Selecione um fornecedor'}
                                                </span>
                                                <ChevronDown size={16} className={`text-slate-400 transition-transform absolute right-4 top-1/2 -translate-y-1/2 ${openDropdownId === linha.id ? 'rotate-180' : ''}`} />
                                            </div>

                                            <SmartDropdown 
                                                isOpen={openDropdownId === linha.id} 
                                                triggerRef={{ current: triggerRefs.current[linha.id] }}
                                            >
                                                {fornecedores.map((f: any, i: number) => {
                                                    const media = getMediaAvaliacao(f.avaliacoes);
                                                    const isRecommended = i === 0; // Mock de motor de recomendação
                                                    const isSelected = selectedFornecedores[linha.id] === f.id;
                                                    
                                                    return (
                                                        <div 
                                                            key={f.id}
                                                            onClick={() => {
                                                                setSelectedFornecedores(prev => ({ ...prev, [linha.id]: f.id }));
                                                                setOpenDropdownId(null);
                                                            }}
                                                            className={`px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-100 last:border-0 ${isSelected ? 'bg-emerald-50/50' : ''}`}
                                                        >
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="font-bold text-slate-900 text-sm">{f.nome}</span>
                                                                {isRecommended && (
                                                                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                                                                        Recommended
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center justify-between mt-1">
                                                                <div>
                                                                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 block mb-0.5">Entrega</span>
                                                                    <span className="text-xs font-bold text-slate-700">{Math.floor(f.prazoMedioEntrega || 0)} dias</span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 block mb-0.5">Val. Mínimo</span>
                                                                    <span className="text-xs font-bold text-slate-700">{formatCurrency(f.valorMinimoEncomenda || 0)}</span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 block mb-0.5">Avaliação</span>
                                                                    <span className={`text-xs font-bold flex items-center gap-1 ${media ? 'text-amber-500' : 'text-slate-400'}`}>
                                                                        <Star size={10} className={media ? 'fill-amber-500' : 'fill-slate-400'} />
                                                                        {media || '-'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </SmartDropdown>
                                        </div>
                                    </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Resumo da Aprovação</h3>
                                <p className="text-sm text-slate-500">Verifique as condições finais antes de emitir a aprovação que irá gerar as encomendas nos fornecedores.</p>
                            </div>
                            
                            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-100/50 text-slate-500 text-xs border-b border-slate-200 uppercase tracking-wider">
                                        <tr>
                                            <th className="px-5 py-3 font-semibold">Produto</th>
                                            <th className="px-5 py-3 font-semibold">Fornecedor Alocado</th>
                                            <th className="px-5 py-3 font-semibold text-center">Qtde.</th>
                                            <th className="px-5 py-3 font-semibold text-right">Preço Ref.</th>
                                            <th className="px-5 py-3 font-semibold text-right">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {linhasAprovadas.map((linha) => {
                                            const fornecedorName = fornecedores.find(f => f.id === selectedFornecedores[linha.id])?.nome || '—';
                                            const unitPrice = linha.produto?.preco || 0;
                                            const subtotal = linha.quantidade * unitPrice;
                                            return (
                                                <tr key={linha.id}>
                                                    <td className="px-5 py-4 font-bold text-slate-900">{linha.produto?.nome}</td>
                                                    <td className="px-5 py-4 text-slate-600 font-medium">
                                                        <span className="flex items-center gap-1.5"><Building2 size={14} className="text-slate-400"/> {fornecedorName}</span>
                                                    </td>
                                                    <td className="px-5 py-4 text-center font-bold text-slate-700">{linha.quantidade}</td>
                                                    <td className="px-5 py-4 text-right text-slate-500">{formatCurrency(unitPrice)}</td>
                                                    <td className="px-5 py-4 text-right font-bold text-emerald-700">{formatCurrency(subtotal)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="bg-slate-900 text-white rounded-xl py-4 px-6 flex items-center justify-between shadow-lg">
                                <span className="font-bold text-slate-300 uppercase tracking-wider text-sm">Total Estimado Final:</span>
                                <span className="text-2xl font-black text-emerald-400">{formatCurrency(totalResumo)}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Navegação */}
                <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between">
                    <div>
                        {step === 1 ? (
                            <button 
                                onClick={() => onClose()}
                                className="px-6 py-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 text-sm font-bold rounded-xl transition-colors shadow-sm"
                            >
                                Cancelar
                            </button>
                        ) : (
                            <button 
                                onClick={handleBack}
                                className="px-6 py-2.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-xl transition-colors shadow-sm flex items-center gap-2"
                            >
                                <ArrowLeft size={16} />
                                Voltar
                            </button>
                        )}
                    </div>
                    <div>
                        {step < 3 ? (
                            <button 
                                onClick={handleNext}
                                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm flex items-center gap-2"
                            >
                                Salvar e Avançar
                            </button>
                        ) : (
                            <button 
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors shadow-lg flex items-center gap-2"
                            >
                                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} strokeWidth={3} />}
                                Confirmar Aprovação
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
