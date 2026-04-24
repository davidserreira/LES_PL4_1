import api from './produtoService';

export interface EntradaHistorico {
    id: number;
    quantidadeRecebida: number;
    precoUnitario: number;
    valorTotal: number;
    produto: {
        id: number;
        nome: string;
        categoria?: string;
        preco?: number;
    };
    encomenda: {
        id: number;
        codigoFormatado: string;
        estado: string;
        dataEmissao: string;
        dataEntregaPrevista?: string;
        dataEntregaReal?: string;
        fornecedor: {
            id: number;
            nome: string;
        };
    };
}

export const historicoStockService = {
    getAll: async (): Promise<EntradaHistorico[]> => {
        const res = await api.get('/encomendas/historico');
        return res.data;
    }
};
