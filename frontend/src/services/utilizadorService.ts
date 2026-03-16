import api from './produtoService'; // Reusing the axios instance

export interface Utilizador {
    id: number;
    username: string;
    role: 'ADMINISTRADOR' | 'RESPONSAVEL_STOCK' | 'RESPONSAVEL_FINANCEIRO';
    password?: string;
}

export const utilizadorService = {
    getAll: async () => {
        const response = await api.get('/utilizadores');
        return response.data;
    },
    getById: async (id: number) => {
        const response = await api.get(`/utilizadores/${id}`);
        return response.data;
    },
    create: async (utilizador: Omit<Utilizador, 'id'>) => {
        const response = await api.post('/utilizadores', utilizador);
        return response.data;
    },
    update: async (id: number, utilizador: Partial<Utilizador>) => {
        const response = await api.put(`/utilizadores/${id}`, utilizador);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await api.delete(`/utilizadores/${id}`);
        return response.data;
    },
    login: async (credentials: Pick<Utilizador, 'username' | 'password'>) => {
        const response = await api.post('/utilizadores/login', credentials);
        return response.data;
    }
};
