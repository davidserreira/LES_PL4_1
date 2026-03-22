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
    cancelarPedido: async (id: number, payload: { userId: number, role: string }) => {
        const response = await api.patch(`/pedidos/${id}/cancelar`, payload);
        return response.data;
    },
    aprovarPedido: async (id: number, payload: { userId: number, role: string }) => {
        const response = await api.patch(`/pedidos/${id}/aprovar`, payload);
        return response.data;
    },
    recusarPedido: async (id: number, payload: { userId: number, role: string }) => {
        const response = await api.patch(`/pedidos/${id}/recusar`, payload);
        return response.data;
    }
};
