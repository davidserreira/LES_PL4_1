# LES_PL4_1

Um projeto fullstack que inclui um Frontend em React (com TypeScript e Vite) e um Backend em Node.js (com Express). Este projeto simula a gestão de uma Clínica Veterinária.

## Como Executar o Projeto

Ambas as partes (Frontend e Backend) já possuem as ferramentas e dependências configuradas. Certifique-se de que tem o Node.js instalado na sua máquina.

### 1. Iniciar o Backend (Node.js + Express)

Abra um terminal e dirija-se à pasta do backend:
```bash
cd backend

# Instale as dependências (caso não tenham sido instaladas automaticamente)
npm install

# Inicie o servidor em modo de desenvolvimento
npm run dev
```
O servidor estará disponível em: `http://localhost:3000`

### 2. Iniciar o Frontend (React + Vite)

Abra um novo terminal (separado do backend) e dirija-se à pasta do frontend:
```bash
cd frontend

# Instale as dependências (caso não tenham sido instaladas automaticamente)
npm install

# Inicie o servidor em modo de desenvolvimento
npm run dev
```
O frontend estará acessível através do endereço indicado no terminal (por norma, `http://localhost:5173`).

## Estrutura de Pastas

* `/frontend`: Projeto React + TypeScript alimentado pelo Vite.
* `/backend`: API REST em Node.js e Express + TypeScript.
* `/database`: Contém as migrações e sementes (seeds) para a base de dados PostgreSQL.
* `/docs`: Ficheiros de documentação e prints de configuração (Jira, Enunciado).
