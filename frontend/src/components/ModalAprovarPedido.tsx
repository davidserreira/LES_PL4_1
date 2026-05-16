import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Trash2, ArrowLeft, Loader2, Package, Building2, ChevronDown, Star, AlertTriangle, Minus, Plus } from 'lucide-react';
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

    // Determina o fornecedor recomendado para um produto: melhor avaliação (se empate, menor prazo)
    const getRecommendedFornecedor = (fornecedores: any[]): number | null => {
        if (!fornecedores || fornecedores.length === 0) return null;
        let best = fornecedores[0];
        let bestMedia = parseFloat(getMediaAvaliacao(best.avaliacoes) || '0');
        for (const f of fornecedores) {
            const media = parseFloat(getMediaAvaliacao(f.avaliacoes) || '0');
            if (media > bestMedia || (media === bestMedia && (f.prazoMedioEntrega || 99) < (best.prazoMedioEntrega || 99))) {
                best = f;
                bestMedia = media;
            }
        }
        return best.id;
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
            setError(null);
            setLinhasAprovadas([...pedido.linhas]);
            
            const initialSelections: Record<number, number> = {};
            pedido.linhas.forEach((linha: any) => {
                if (linha.fornecedorId) {
                    initialSelections[linha.id] = linha.fornecedorId;
                } else if (linha.produto?.fornecedorPreferencialId) {
                    initialSelections[linha.id] = linha.produto.fornecedorPreferencialId;
                } else if (linha.produto?.fornecedores?.length === 1) {
                    initialSelections[linha.id] = linha.produto.fornecedores[0].id;
                } else if (linha.produto?.fornecedores?.length > 1) {
                    // Auto-select recommended
                    const recId = getRecommendedFornecedor(linha.produto.fornecedores);
                    if (recId) initialSelections[linha.id] = recId;
                }
            });
            setSelectedFornecedores(initialSelections);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, pedido]);

    if (!isOpen || !pedido) return null;

    const handleRemoveLinha = (linhaId: number) => {
        setLinhasAprovadas(prev => prev.filter(l => l.id !== linhaId));
    };

    const handleUpdateQuantidade = (linhaId: number, novaQuantidade: number) => {
        if (novaQuantidade <= 0) return;
        setLinhasAprovadas(prev => prev.map(l => 
            l.id === linhaId ? { ...l, quantidade: novaQuantidade } : l
        ));
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
                fornecedorId: selectedFornecedores[linha.id],
                quantidade: linha.quantidade
            }));

            const savedUser = localStorage.getItem('user');
            const user = savedUser ? JSON.parse(savedUser) : null;

            await pedidoCompraService.aprovarPedido(pedido.id, {
                userId: user?.id,
                role: user?.role,
                linhasAprovadas: payloadLinhas
            });
            
            onClose(true, 'Pedido Aprovado com Sucesso!');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao processar aprovação.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Total em tempo real do step 2 e 3 (utilizando o preço do fornecedor selecionado, se aplicável)
    const totalStep2 = linhasAprovadas.reduce((acc, linha) => {
        const selectedFId = selectedFornecedores[linha.id];
        let price = linha.produto?.preco || 0;
        if (selectedFId && (linha.produto as any)?.precosFornecedores) {
            const specificPrice = (linha.produto as any).precosFornecedores.find((p: any) => p.fornecedorId === selectedFId)?.preco;
            if (specificPrice !== undefined) {
                price = specificPrice;
            }
        }
        return acc + (linha.quantidade * price);
    }, 0);

    const totalResumo = step >= 2 ? totalStep2 : linhasAprovadas.reduce((acc, linha) => {
        return acc + (linha.quantidade * (linha.produto?.preco || 0));
    }, 0);
    const allSuppliersSelected = linhasAprovadas.every(l => {
        const hasFornecedores = (l.produto?.fornecedores?.length || 0) > 0;
        return !hasFornecedores || !!selectedFornecedores[l.id];
    });
    const hasAnyLinhas = linhasAprovadas.length > 0;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-4xl flex flex-col overflow-hidden max-h-[85vh]">
                
                {/* Header Modal */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/80">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm border border-emerald-100 dark:border-emerald-500/20">
                            <Check size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight flex items-center gap-3">
                                Aprovar Pedido de Compra
                                <span className="text-sm font-black bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                                    {pedido.codigoFormatado}
                                </span>
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Reveja e selecione os fornecedores para aprovar</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => onClose()}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Stepper Visual */}
                <div className="px-6 py-5 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-center gap-4 sm:gap-8">
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
                                            : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                                }`}>
                                    {step > s.num ? <Check size={16} strokeWidth={3} /> : s.num}
                                </div>
                                <span className={`text-xs font-bold uppercase tracking-wider hidden sm:block ${
                                    step >= s.num ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'
                                }`}>{s.title}</span>
                            </div>
                            {i < 2 && (
                                <div className={`w-8 sm:w-16 h-0.5 rounded ${step > s.num ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Body Content */}
                <div 
                    className="flex-1 overflow-y-auto p-6 bg-white dark:bg-slate-800 space-y-6"
                    style={{ scrollbarGutter: 'stable' }}
                >
                    {error && (
                        <div className="bg-red-50 dark:bg-red-500/10 text-red-700 p-3 rounded-lg border border-red-100 dark:border-red-500/20 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Revisão de Quantidades</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Analise os produtos solicitados. Se algum produto não tiver aprovação para ser encomendado, remova-o da lista.</p>
                            </div>
                            
                            <div className="space-y-3">
                                {linhasAprovadas.map((linha) => (
                                    <div key={linha.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between hover:border-slate-300 dark:border-slate-600 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-700/50 flex items-center justify-center text-slate-400 shrink-0">
                                                <Package size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 dark:text-slate-100">{linha.produto?.nome}</h4>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-2 py-0.5 rounded">
                                                        {linha.produto?.categoria || 'Sem categoria'}
                                                    </span>
                                                    <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5">
                                                        <button 
                                                            onClick={() => handleUpdateQuantidade(linha.id, linha.quantidade - 1)}
                                                            disabled={linha.quantidade <= 1}
                                                            className="w-6 h-6 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-700/50 hover:text-slate-700 dark:text-slate-300 rounded-md transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                                                        >
                                                            <Minus size={14} />
                                                        </button>
                                                        <span className="w-8 text-center text-xs font-bold text-slate-700 dark:text-slate-300">{linha.quantidade}</span>
                                                        <button 
                                                            onClick={() => handleUpdateQuantidade(linha.id, linha.quantidade + 1)}
                                                            className="w-6 h-6 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-700/50 hover:text-slate-700 dark:text-slate-300 rounded-md transition-colors"
                                                        >
                                                            <Plus size={14} />
                                                        </button>
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">un</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleRemoveLinha(linha.id)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:bg-red-500/10 rounded-lg transition-colors ml-4 shrink-0"
                                            title="Remover produto da encomenda"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}

                                {linhasAprovadas.length === 0 && (
                                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl border-dashed">
                                        <p className="text-slate-500 dark:text-slate-400 font-medium">Não restam produtos neste pedido.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Selecionar Fornecedores</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Escolha o fornecedor para cada produto. O <span className="font-semibold text-amber-600 dark:text-amber-400">preferencial</span> ou <span className="font-semibold text-emerald-600 dark:text-emerald-400">recomendado</span> é pré-selecionado.</p>
                                </div>
                                <div className="shrink-0 flex flex-col items-end gap-1">
                                    <span className="text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full">
                                        {linhasAprovadas.length} produto{linhasAprovadas.length !== 1 ? 's' : ''}
                                    </span>
                                    {step === 2 && hasAnyLinhas && (
                                        <span className="text-xs font-black text-slate-600 dark:text-slate-400">
                                            Total: <span className="text-emerald-700">{formatCurrency(totalStep2)}</span>
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                {linhasAprovadas.map((linha) => {
                                    const produtoFornecedores: any[] = linha.produto?.fornecedores || [];
                                    const selectedF = produtoFornecedores.find((f: any) => f.id === selectedFornecedores[linha.id]);
                                    const selectedMedia = selectedF ? getMediaAvaliacao(selectedF.avaliacoes) : null;
                                    const isOpen = openDropdownId === linha.id;
                                    const semFornecedores = produtoFornecedores.length === 0;
                                    const recommendedId = getRecommendedFornecedor(produtoFornecedores);
                                    const unitPrice = linha.produto?.preco || 0;
                                    const subtotalLinha = linha.quantidade * unitPrice;

                                    return (
                                    <div key={linha.id} className={`rounded-xl border transition-all duration-200 overflow-visible ${
                                        isOpen 
                                            ? 'border-emerald-400 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/10' 
                                            : selectedF 
                                                ? 'border-emerald-200 shadow-sm' 
                                                : semFornecedores 
                                                    ? 'border-amber-200' 
                                                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:border-slate-600 hover:shadow-sm'
                                    }`}>
                                        {/* Linha do produto */}
                                        <div className="flex items-center gap-4 px-4 pt-4 pb-3">
                                            <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${selectedF ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 text-emerald-600 dark:text-emerald-400' : 'bg-gradient-to-br from-slate-100 dark:from-slate-800 to-slate-50 dark:to-slate-900 border-slate-200 dark:border-slate-700 text-slate-400'}`}>
                                                <Package size={16} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">{linha.produto?.nome}</h4>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                                        {linha.produto?.categoria || 'Sem categoria'}
                                                    </span>
                                                    <span className="w-0.5 h-0.5 rounded-full bg-slate-300"></span>
                                                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                                        {linha.quantidade} un × {formatCurrency(unitPrice)}
                                                    </span>
                                                    <span className="w-0.5 h-0.5 rounded-full bg-slate-300"></span>
                                                    <span className="text-[10px] font-black text-slate-700 dark:text-slate-300">{formatCurrency(subtotalLinha)}</span>
                                                </div>
                                            </div>
                                            {/* Confirmation chip when selected */}
                                            {selectedF && !isOpen && (
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <div className="text-right">
                                                        <span className="text-xs font-bold text-emerald-700 block">{selectedF.nome}</span>
                                                        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 justify-end">
                                                            {selectedMedia && (
                                                                <span className="text-amber-500 font-bold flex items-center gap-0.5">
                                                                    <Star size={9} className="fill-amber-400" />{selectedMedia}
                                                                </span>
                                                            )}
                                                            {selectedMedia && <span className="text-slate-300">·</span>}
                                                            {Math.floor(selectedF.prazoMedioEntrega || 0)}d
                                                        </span>
                                                    </div>
                                                    <div className="w-7 h-7 bg-emerald-500 border border-emerald-600 rounded-full flex items-center justify-center shadow-sm">
                                                        <Check size={13} className="text-white" strokeWidth={3} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Aviso se produto sem fornecedores associados */}
                                        {semFornecedores && (
                                            <div className="mx-4 mb-4 px-3 py-2.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 rounded-lg flex items-center gap-2">
                                                <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
                                                <span className="text-xs text-amber-700 font-medium">Este produto não tem fornecedores associados. Associe um fornecedor primeiro.</span>
                                            </div>
                                        )}

                                        {/* Trigger do select */}
                                        {!semFornecedores && (
                                            <div className="px-4 pb-4">
                                                <div
                                                    ref={(el) => { triggerRefs.current[linha.id] = el; }}
                                                    className={`w-full px-3.5 py-2.5 rounded-lg cursor-pointer select-none transition-all text-sm font-medium flex items-center justify-between gap-3 ${
                                                        isOpen 
                                                            ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-400 text-emerald-800' 
                                                            : selectedF 
                                                                ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 text-emerald-800 hover:border-emerald-400' 
                                                                : 'bg-white dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-600 hover:border-emerald-400 text-slate-400'
                                                    }`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenDropdownId(isOpen ? null : linha.id);
                                                    }}
                                                >
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <Building2 size={14} className={selectedF ? 'text-emerald-600 dark:text-emerald-400 shrink-0' : 'text-slate-400 shrink-0'} />
                                                        <span className="truncate font-semibold">
                                                            {selectedF ? selectedF.nome : 'Clique para selecionar fornecedor...'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        {selectedF && !isOpen && (
                                                            <span className="text-[11px] font-black text-emerald-700">
                                                                {formatCurrency((() => {
                                                                    const specificPrice = (linha.produto as any)?.precosFornecedores?.find((p: any) => p.fornecedorId === selectedF.id)?.preco;
                                                                    return specificPrice !== undefined ? specificPrice : (linha.produto?.preco || 0);
                                                                })())}/un
                                                            </span>
                                                        )}
                                                        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {!semFornecedores && (
                                            <SmartDropdown 
                                                isOpen={isOpen} 
                                                triggerRef={{ current: triggerRefs.current[linha.id] }}
                                            >
                                                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700/50 mb-1 flex items-center justify-between">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fornecedores disponíveis</span>
                                                    <span className="text-[10px] text-slate-400">{produtoFornecedores.length} opção{produtoFornecedores.length !== 1 ? 'ões' : ''}</span>
                                                </div>
                                                {produtoFornecedores.map((f: any) => {
                                                    const media = getMediaAvaliacao(f.avaliacoes);
                                                    const mediaVal = media ? parseFloat(media) : 0;
                                                    const isPreferential = linha.produto?.fornecedorPreferencialId === f.id;
                                                    const isRecommended = f.id === recommendedId && !linha.produto?.fornecedorPreferencialId;
                                                    const isSelected = selectedFornecedores[linha.id] === f.id;
                                                    const precoAcordado = (linha.produto as any)?.precosFornecedores?.find((p: any) => p.fornecedorId === f.id)?.preco;
                                                    const fUnitPrice = precoAcordado !== undefined ? precoAcordado : (linha.produto?.preco || 0);
                                                    
                                                    return (
                                                        <div 
                                                            key={f.id}
                                                            onClick={() => {
                                                                setSelectedFornecedores(prev => ({ ...prev, [linha.id]: f.id }));
                                                                setOpenDropdownId(null);
                                                            }}
                                                            className={`mx-2 mb-1 px-3 py-3 rounded-lg cursor-pointer transition-all duration-150 ${
                                                                isSelected 
                                                                    ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200' 
                                                                    : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900 border border-transparent hover:border-slate-200 dark:border-slate-700'
                                                            }`}
                                                        >
                                                            {/* Row 1: name + badges */}
                                                            <div className="flex items-center justify-between mb-3">
                                                                <div className="flex items-center gap-2">
                                                                    {isSelected ? (
                                                                        <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shrink-0 shadow-sm">
                                                                            <Check size={11} className="text-white" strokeWidth={3} />
                                                                        </div>
                                                                    ) : (
                                                                        <div className="w-5 h-5 rounded-full border-2 border-slate-200 dark:border-slate-700 shrink-0" />
                                                                    )}
                                                                    <span className={`font-bold text-sm ${isSelected ? 'text-emerald-800' : 'text-slate-800 dark:text-slate-200'}`}>{f.nome}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5">
                                                                    {isPreferential && (
                                                                        <span className="bg-amber-100 text-amber-700 border border-amber-200 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                                                                            ★ Preferencial
                                                                        </span>
                                                                    )}
                                                                    {isRecommended && (
                                                                        <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                                                                            ★ Recomendado
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Row 2: metrics + price */}
                                                            <div className="grid grid-cols-4 gap-2">
                                                                <div className="bg-white dark:bg-slate-800 rounded-md px-2 py-2 border border-slate-100 dark:border-slate-700/50 text-center col-span-1">
                                                                    <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 block mb-0.5">Preço/un</span>
                                                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{formatCurrency(fUnitPrice)}</span>
                                                                </div>
                                                                <div className="bg-white dark:bg-slate-800 rounded-md px-2 py-2 border border-slate-100 dark:border-slate-700/50 text-center col-span-1">
                                                                    <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 block mb-0.5">Entrega</span>
                                                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{Math.floor(f.prazoMedioEntrega || 0)}d</span>
                                                                </div>
                                                                <div className="bg-white dark:bg-slate-800 rounded-md px-2 py-2 border border-slate-100 dark:border-slate-700/50 text-center col-span-1">
                                                                    <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 block mb-0.5">Mín.</span>
                                                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{formatCurrency(f.valorMinimoEncomenda || 0)}</span>
                                                                </div>
                                                                <div className="bg-white dark:bg-slate-800 rounded-md px-2 py-2 border border-slate-100 dark:border-slate-700/50 text-center col-span-1">
                                                                    <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 block mb-0.5">Aval.</span>
                                                                    <span className={`text-xs font-bold flex items-center justify-center gap-0.5 ${mediaVal >= 4 ? 'text-amber-500' : mediaVal >= 2.5 ? 'text-orange-400' : 'text-slate-400'}`}>
                                                                        <Star size={9} className={mediaVal > 0 ? 'fill-current' : 'fill-slate-300'} />
                                                                        {media || '—'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </SmartDropdown>
                                        )}
                                    </div>
                                    );

                                })}
                            </div>

                            {/* Total em tempo real */}
                            {hasAnyLinhas && (
                                <div className="flex items-center justify-between bg-gradient-to-r from-slate-50 dark:from-slate-900 to-emerald-50/40 dark:to-emerald-900/20 border border-slate-200 dark:border-slate-700 rounded-xl px-5 py-3.5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Total estimado</span>
                                        {!allSuppliersSelected && (
                                            <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                                                Selecione todos os fornecedores para continuar
                                            </span>
                                        )}
                                    </div>
                                    <span className={`text-xl font-black ${allSuppliersSelected ? 'text-emerald-700' : 'text-slate-400'}`}>
                                        {formatCurrency(totalStep2)}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Resumo da Aprovação</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Verifique as condições finais antes de emitir a aprovação que irá gerar as encomendas nos fornecedores.</p>
                            </div>
                            
                            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-xs border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider">
                                        <tr>
                                            <th className="px-5 py-3 font-semibold">Produto</th>
                                            <th className="px-5 py-3 font-semibold">Fornecedor Alocado</th>
                                            <th className="px-5 py-3 font-semibold text-center">Qtde.</th>
                                            <th className="px-5 py-3 font-semibold text-right">Preço Ref.</th>
                                            <th className="px-5 py-3 font-semibold text-right">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white dark:bg-slate-800">
                                        {linhasAprovadas.map((linha) => {
                                            const produtoFornecedores: any[] = linha.produto?.fornecedores || [];
                                            const fornecedorName = produtoFornecedores.find((f: any) => f.id === selectedFornecedores[linha.id])?.nome || '—';
                                            const unitPrice = linha.produto?.preco || 0;
                                            const subtotal = linha.quantidade * unitPrice;
                                            return (
                                                <tr key={linha.id}>
                                                    <td className="px-5 py-4 font-bold text-slate-900 dark:text-slate-100">{linha.produto?.nome}</td>
                                                    <td className="px-5 py-4 text-slate-600 dark:text-slate-400 font-medium">
                                                        <span className="flex items-center gap-1.5"><Building2 size={14} className="text-slate-400"/> {fornecedorName}</span>
                                                    </td>
                                                    <td className="px-5 py-4 text-center font-bold text-slate-700 dark:text-slate-300">{linha.quantidade}</td>
                                                    <td className="px-5 py-4 text-right text-slate-500 dark:text-slate-400">{formatCurrency(unitPrice)}</td>
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
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-800 flex items-center justify-between">
                    <div>
                        {step === 1 ? (
                            <button 
                                onClick={() => onClose()}
                                className="px-6 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 text-sm font-bold rounded-xl transition-colors shadow-sm"
                            >
                                Cancelar
                            </button>
                        ) : (
                            <button 
                                onClick={handleBack}
                                className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl transition-colors shadow-sm flex items-center gap-2"
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
                                disabled={step === 2 && !allSuppliersSelected}
                                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors shadow-sm flex items-center gap-2"
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
