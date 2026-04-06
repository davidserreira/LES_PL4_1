import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000/api'
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
        fornecedorIds?: number[];
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
        fornecedorIds?: number[];
    }) => {
        const response = await api.put(`/produtos/${id}`, produto);
        return response.data;
    },
    delete: async (id: number, force: boolean = false) => {
        const response = await api.delete(`/produtos/${id}${force ? '?force=true' : ''}`);
        return response.data;
    }
};

export default api;
