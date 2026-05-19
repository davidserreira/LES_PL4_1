import { useEffect, useState } from 'react';
import { relatorioService, RelatorioFinanceiro } from '../services/relatorioService';
import { fornecedorService } from '../services/fornecedorService';
import { Landmark, Clock, FileSpreadsheet, Calendar, Filter, FileText, Loader2 } from 'lucide-react';
import { generateNotaCreditoPDF } from '../utils/pdfGenerator';
import { encomendaService } from '../services/encomendaService';

export default function RelatoriosFinanceiros() {
    const [relatorio, setRelatorio] = useState<RelatorioFinanceiro | null>(null);
    const [fornecedores, setFornecedores] = useState<any[]>([]);
    
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');
    const [fornecedorId, setFornecedorId] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        carregarFornecedores();
        carregarRelatorio();
    }, []);

    const carregarFornecedores = async () => {
        try {
            const data = await fornecedorService.getAll();
            setFornecedores(data);
        } catch (error) {
            console.error('Erro ao carregar fornecedores', error);
        }
    };

    const carregarRelatorio = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (dataInicio) params.dataInicio = dataInicio;
            if (dataFim) params.dataFim = dataFim;
            if (fornecedorId) params.fornecedorId = fornecedorId;
            
            const data = await relatorioService.getFinanceiro(params);
            setRelatorio(data);
        } catch (error) {
            console.error('Erro ao carregar relatório', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFiltrar = (e: React.FormEvent) => {
        e.preventDefault();
        carregarRelatorio();
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
    };

    const handleDownloadPDF = async (id: number) => {
        try {
            const encFull = await encomendaService.getById(id);
            generateNotaCreditoPDF(encFull);
        } catch (error) {
            console.error('Erro ao gerar PDF', error);
            alert('Não foi possível obter os detalhes da encomenda para gerar o PDF.');
        }
    };

    const exportToCSV = () => {
        if (!relatorio) return;
        
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "ID Encomenda,Fornecedor,Valor Total,Estado,Data\n";
        
        relatorio.encomendas.forEach(enc => {
            const row = `${enc.id},${enc.fornecedor?.nome || 'N/A'},${enc.valorTotal},${enc.estado},${new Date(enc.dataEmissao).toLocaleDateString('pt-PT')}`;
            csvContent += row + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "relatorio_financeiro.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-50 dark:bg-teal-500/10 rounded-lg">
                        <Landmark className="text-teal-600 dark:text-teal-400" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-slate-200 tracking-tight">Financeiro</h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">Análise de despesas, estatísticas e exportação para contabilidade</p>
                    </div>
                </div>
                
                {relatorio && (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button 
                            onClick={exportToCSV}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all text-sm font-bold focus:ring-2 focus:ring-emerald-500/50 active:scale-95"
                        >
                            <FileSpreadsheet size={18} />
                            Exportar CSV
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-none">
                <form onSubmit={handleFiltrar} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data Início</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="date" 
                                value={dataInicio}
                                onChange={e => setDataInicio(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data Fim</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="date" 
                                value={dataFim}
                                onChange={e => setDataFim(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                            />
                        </div>
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Fornecedor</label>
                        <div className="relative group">
                            <select
                                value={fornecedorId}
                                onChange={e => setFornecedorId(e.target.value)}
                                className="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all appearance-none cursor-pointer shadow-sm hover:border-emerald-400 dark:hover:border-emerald-600"
                            >
                                <option value="">Todos os Fornecedores</option>
                                {fornecedores.map(f => (
                                    <option key={f.id} value={f.id}>{f.nome}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-emerald-500 transition-colors">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m6 9 6 6 6-6"/>
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div>
                        <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl transition-all shadow-sm text-sm font-medium focus:ring-2 focus:ring-slate-500/50">
                            <Filter size={16} />
                            {loading ? 'A carregar...' : 'Aplicar Filtros'}
                        </button>
                    </div>
                </form>
            </div>

            {relatorio && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* KPI Cards Premium */}
                        <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] group transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150" />
                            <div className="relative flex items-center gap-6">
                                <div className="p-5 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-500">
                                    <Landmark size={28} />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Fluxo de Caixa Efetivo</p>
                                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">
                                        {formatCurrency(relatorio.valorTotalEfetivo)}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">Total Liquidado no Período</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] group transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150" />
                            <div className="relative flex items-center gap-6">
                                <div className="p-5 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-500">
                                    <Clock size={28} />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Compromissos Pendentes</p>
                                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">
                                        {formatCurrency(relatorio.valorPendente)}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-tighter">Encomendas em trânsito</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Top Fornecedores */}
                        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-6 flex flex-col">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-6">Top 5 Fornecedores (Despesa)</h3>
                            
                            {relatorio.topFornecedores.length === 0 ? (
                                <div className="text-center py-12 text-slate-400 flex-1 flex items-center justify-center">
                                    Sem despesas no período selecionado.
                                </div>
                            ) : (
                                <div className="space-y-5 flex-1">
                                    {relatorio.topFornecedores.map((f, i) => {
                                        const percent = (f.total / (relatorio.valorTotalEfetivo || 1)) * 100 || 0;
                                        return (
                                            <div key={i} className="group">
                                                <div className="flex justify-between text-sm mb-2">
                                                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[150px] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" title={f.nome}>
                                                        {f.nome}
                                                    </span>
                                                    <span className="text-slate-900 dark:text-white font-bold">{formatCurrency(f.total)}</span>
                                                </div>
                                                <div className="w-full bg-slate-100 dark:bg-slate-800/80 rounded-full h-2 overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
                                                    <div 
                                                        className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out" 
                                                        style={{ width: `${percent}%` }}
                                                    />
                                                </div>
                                                <p className="text-right text-[10px] text-slate-400 mt-1 font-medium">{percent.toFixed(1)}% do total</p>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Listagem Resumo */}
                        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col">
                            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Últimas Encomendas no Período</h3>
                                <span className="text-xs font-medium text-slate-500 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm">
                                    {relatorio.encomendas.length} registos
                                </span>
                            </div>
                            <div className="overflow-x-auto flex-1">
                                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-medium">
                                        <tr>
                                            <th className="px-6 py-3 whitespace-nowrap">Código</th>
                                            <th className="px-6 py-3 whitespace-nowrap">Data</th>
                                            <th className="px-6 py-3 whitespace-nowrap">Fornecedor</th>
                                            <th className="px-6 py-3 whitespace-nowrap">Estado</th>
                                            <th className="px-6 py-3 text-right whitespace-nowrap">Valor</th>
                                            <th className="px-6 py-3 text-center whitespace-nowrap">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                        {relatorio.encomendas.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                                    Nenhuma encomenda faturada com os filtros aplicados.
                                                </td>
                                            </tr>
                                        ) : (
                                            relatorio.encomendas.slice(0, 8).map((enc) => (
                                                <tr key={enc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                                    <td className="px-6 py-3.5 font-medium text-slate-900 dark:text-white">#{enc.id}</td>
                                                    <td className="px-6 py-3.5">{new Date(enc.dataEmissao).toLocaleDateString('pt-PT')}</td>
                                                    <td className="px-6 py-3.5 truncate max-w-[200px]" title={enc.fornecedor?.nome}>{enc.fornecedor?.nome || 'N/A'}</td>
                                                    <td className="px-6 py-3.5">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                                                            enc.estado === 'ENTREGUE' || enc.estado === 'ENCERRADA' 
                                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/30' 
                                                                : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-800/30'
                                                        }`}>
                                                            {enc.estado}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3.5 text-right font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                                        {formatCurrency(enc.valorTotal)}
                                                    </td>
                                                    <td className="px-6 py-3.5 text-center">
                                                        {(enc.estado === 'ENTREGUE' || enc.estado === 'ENTREGUE_PARCIAL' || enc.estado === 'ENCERRADA') ? (
                                                            <button 
                                                                onClick={() => handleDownloadPDF(enc.id)}
                                                                className="p-2 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-semibold"
                                                                title="Download PDF (Nota de Crédito)"
                                                            >
                                                                <FileText size={14} />
                                                                PDF
                                                            </button>
                                                        ) : (
                                                            <span className="text-[10px] text-slate-400 italic">N/A</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
