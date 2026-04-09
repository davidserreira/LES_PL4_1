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
        valorMinimoEncomenda?: number;
        prazoMedioEntrega?: number;
        custoTransporte?: number;
        metodoPagamento?: string;
        diasEntrega?: string;
    }) => {
        const response = await api.put(`/fornecedores/${id}`, fornecedor);
        return response.data;
    },
    avaliar: async (id: number, avaliacao: {
        utilizadorId: number;
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
    getMinhaAvaliacao: async (id: number, utilizadorId: number) => {
        const response = await api.get(`/fornecedores/${id}/minha-avaliacao`, { params: { utilizadorId } });
        return response.data as (null | {
            id: number;
            fornecedorId: number;
            utilizadorId: number;
            qualidade: number;
            pontualidade: number;
            comunicacao: number;
            preco: number;
            conformidade: number;
            comentario: string | null;
            dataCriacao: string;
        });
    },
    getAvaliacaoMedia: async (id: number) => {
        const response = await api.get(`/fornecedores/${id}/avaliacao-media`);
        return response.data as { totalAvaliacoes: number; media: number | null };
    },
    getAvaliacoes: async (id: number) => {
        const response = await api.get(`/fornecedores/${id}/avaliacoes`);
        return response.data as {
            id: number;
            fornecedorId: number;
            utilizadorId: number;
            qualidade: number;
            pontualidade: number;
            comunicacao: number;
            preco: number;
            conformidade: number;
            comentario: string | null;
            dataCriacao: string;
            utilizador: { id: number; username: string };
        }[];
    }
};
