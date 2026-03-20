import api from './produtoService';

export const pedidoCompraService = {
    create: async (payload: { criadoPorId: number | null, prioridade: string, linhas: { produtoId: number, quantidade: number }[] }) => {
        const response = await api.post('/pedidos', payload);
        return response.data;
    },
    update: async (id: number, payload: { prioridade: string, linhas: { produtoId: number, quantidade: number }[] }) => {
        const response = await api.put(`/pedidos/${id}`, payload);
        return response.data;
    },
    cancelar: async (id: number) => {
        const response = await api.put(`/pedidos/${id}/cancelar`);
        return response.data;
    },
    getAll: async () => {
        const response = await api.get('/pedidos');
        return response.data;
    }
};
