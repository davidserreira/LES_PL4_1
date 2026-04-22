import api from './produtoService';

export const encomendaService = {
    gerarEncomendas: async (pedidoId: number) => {
        const res = await api.post(`/encomendas/gerar/${pedidoId}`);
        return res.data;
    },

    getAll: async () => {
        const res = await api.get('/encomendas');
        return res.data;
    },

    getById: async (id: number) => {
        const res = await api.get(`/encomendas/${id}`);
        return res.data;
    }
};
