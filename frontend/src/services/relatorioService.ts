import api from './produtoService';

export interface RelatorioFinanceiro {
    valorTotalEfetivo: number;
    valorPendente: number;
    topFornecedores: { nome: string; total: number }[];
    distribuicaoFornecedores: { nome: string; total: number }[];
    encomendas: any[];
}

export const relatorioService = {
    getFinanceiro: async (params?: { dataInicio?: string; dataFim?: string; fornecedorId?: string }) => {
        const response = await api.get<RelatorioFinanceiro>('/relatorios/financeiro', { params });
        return response.data;
    }
};
