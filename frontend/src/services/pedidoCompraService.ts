import api from './produtoService';

export const pedidoCompraService = {
    create: async (payload: { criadoPorId: number | null, prioridade: string, linhas: { produtoId: number, quantidade: number }[], estado?: string, observacoes?: string }) => {
        const response = await api.post('/pedidos', payload);
        return response.data;
    },
    getAll: async () => {
        const response = await api.get('/pedidos');
        return response.data;
    },
    getRascunhos: async () => {
        const response = await api.get('/pedidos/rascunhos');
        return response.data;
    },
    updateRascunho: async (id: number, payload: { userId: number, role: string, prioridade: string, linhas: { produtoId: number, quantidade: number }[], estado: string, observacoes?: string }) => {
        const response = await api.put(`/pedidos/${id}`, payload);
        return response.data;
    },
    deleteRascunho: async (id: number, payload: { userId: number, role: string }) => {
        const response = await api.delete(`/pedidos/${id}/rascunho`, { data: payload });
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
