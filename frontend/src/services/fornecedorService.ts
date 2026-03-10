import api from './produtoService'; // Reusing the axios instance

export const fornecedorService = {
    getAll: async () => {
        const response = await api.get('/fornecedores');
        return response.data;
    },
    create: async (fornecedor: {
        nome: string;
        nif?: string;
        contacto?: string;
    }) => {
        const response = await api.post('/fornecedores', fornecedor);
        return response.data;
    }
    // Delete and Update can be added later if needed
};
