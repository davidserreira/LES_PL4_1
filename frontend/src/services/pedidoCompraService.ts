import api from './produtoService';

export const pedidoCompraService = {
    create: async (payload: { criadoPorId: number | null, prioridade: string, linhas: { produtoId: number, quantidade: number }[] }) => {
        const response = await api.post('/pedidos', payload);
        return response.data;
    },
    getAll: async () => {
        const response = await api.get('/pedidos');
        return response.data;
    },
    confirm: async (id: number) => {
        const response = await api.put(`/pedidos/${id}/confirmar`);
        return response.data;
    }
};
