import dotenv from 'dotenv';
// Reloading server to pick up Prisma 7 changes...
dotenv.config();

import express from 'express';
import cors from 'cors';
import prisma from './lib/prisma';
import produtoRoutes from './routes/produtoRoutes';
import fornecedorRoutes from './routes/fornecedorRoutes';
import utilizadorRoutes from './routes/utilizadorRoutes';
import pedidoCompraRoutes from './routes/pedidoCompraRoutes';
import encomendaRoutes from './routes/encomendaRoutes';
import relatorioRoutes from './routes/relatorioRoutes';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/produtos', produtoRoutes);
app.use('/api/fornecedores', fornecedorRoutes);
app.use('/api/utilizadores', utilizadorRoutes);
app.use('/api/pedidos', pedidoCompraRoutes);
app.use('/api/encomendas', encomendaRoutes);
app.use('/api/relatorios', relatorioRoutes);

app.get('/', (req, res) => {
    res.send('API REST da Clínica Veterinária a funcionar!');
});

app.listen(port, () => {
    console.log(`[server]: Servidor a correr em http://localhost:${port}`);
});
