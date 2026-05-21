import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
});

export const produtoService = {
    getAll: async () => {
        const response = await api.get('/produtos');
        return response.data;
    },
    create: async (produto: {
        nome: string;
        stock: number;
        stockMinimo: number;
        preco?: number;
        categoria?: string;
        descricao?: string;
        fornecedoresData?: { id: number; preco: number }[];
        fornecedorPreferencialId?: number;
    }) => {
        const response = await api.post('/produtos', produto);
        return response.data;
    },
    update: async (id: number, produto: {
        nome: string;
        stock: number;
        stockMinimo: number;
        preco?: number;
        categoria?: string;
        descricao?: string;
        fornecedoresData?: { id: number; preco: number }[];
        fornecedorPreferencialId?: number;
    }) => {
        const response = await api.put(`/produtos/${id}`, produto);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await api.delete(`/produtos/${id}`);
        return response.data;
    },
    reativar: async (id: number) => {
        const response = await api.patch(`/produtos/${id}/reativar`);
        return response.data;
    }
};

export default api;
