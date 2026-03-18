import api from './produtoService';

export const pedidoCompraService = {
    create: async (payload: { criadoPorId: number | null, linhas: { produtoId: number, quantidade: number }[] }) => {
        const response = await api.post('/pedidos', payload);
        return response.data;
    }
};
