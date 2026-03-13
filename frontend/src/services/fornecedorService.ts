import api from './produtoService'; // Reusing the axios instance

export const fornecedorService = {
    getAll: async () => {
        const response = await api.get('/fornecedores');
        return response.data;
    },
    create: async (fornecedor: {
        nome: string;
        nif: string;
        contacto: string;
        email: string;
        categoria: string;
        observacoes?: string;
    }) => {
        const response = await api.post('/fornecedores', fornecedor);
        return response.data;
    },
    toggleEstado: async (id: number) => {
        const response = await api.patch(`/fornecedores/${id}/estado`);
        return response.data;
    },
    updateObservacoes: async (id: number, observacoes: string) => {
        const response = await api.patch(`/fornecedores/${id}/observacoes`, { observacoes });
        return response.data;
    },
    update: async (id: number, fornecedor: {
        nome: string;
        nif: string;
        contacto: string;
        email: string;
        categoria: string;
        observacoes?: string;
        estado?: boolean;
    }) => {
        const response = await api.put(`/fornecedores/${id}`, fornecedor);
        return response.data;
    },
    avaliar: async (id: number, avaliacao: {
        qualidade: number;
        pontualidade: number;
        comunicacao: number;
        preco: number;
        conformidade: number;
        comentario?: string;
    }) => {
        const response = await api.post(`/fornecedores/${id}/avaliacoes`, avaliacao);
        return response.data;
    },
    getAvaliacaoMedia: async (id: number) => {
        const response = await api.get(`/fornecedores/${id}/avaliacao-media`);
        return response.data as { totalAvaliacoes: number; media: number | null };
    }
};
