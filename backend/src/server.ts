import express from 'express';
import cors from 'cors';
import prisma from './lib/prisma';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('API REST da Clínica Veterinária a funcionar!');
});

app.get('/users', async (req, res) => {
    const users = await prisma.user.findMany();
    res.json(users);
});

app.listen(port, () => {
    console.log(`[server]: Servidor a correr em http://localhost:${port}`);
});
