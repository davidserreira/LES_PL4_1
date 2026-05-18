# StockVet - Gestão de Compras e Stocks 🐾

O **StockVet** é uma plataforma corporativa *fullstack* concebida para a gestão logística de compras, contratos de fornecedores, receção de encomendas e controlo físico de existências numa clínica veterinária. 

A aplicação está dividida numa arquitetura desacoplada:
*   **Frontend:** Interface SPA moderna, reativa e *glassmorphic* construída em **React (TypeScript + Vite)**.
*   **Backend:** API RESTful robusta desenvolvida em **Node.js (Express + TypeScript)**.
*   **Base de Dados:** Relacional **PostgreSQL** intermediada pelo **Prisma ORM**.
*   **Ambiente:** Totalmente contentorizado em **Docker** para execução reprodutível instantânea.

O site está disponível online e em produção no domínio permanente: **[vetstock.online](http://vetstock.online)**

---

## ⚡ Método Rápido: Execução Completa no Docker (Zero Setup)

Este é o método recomendado para professores e utilizadores que queiram rodar e testar o projeto completo sem ter de instalar dependências de programação (como Node.js) localmente.

### 1. Pré-Requisitos
*   Ter o **Docker Desktop** (https://www.docker.com/products/docker-desktop/) instalado e em execução no computador.

### 2. Iniciar a Aplicação
1.  Abra o terminal na **pasta raiz** do projeto.
2.  Execute o comando para compilar e arrancar todos os serviços em segundo plano:
    ```bash
    docker compose up --build -d
    ```
3.  *O Docker irá descarregar as imagens, injetar as variáveis de ambiente, executar as migrações estruturais do Prisma, popular os dados de demonstração (seed) e ligar os servidores.*

### 3. Aceder aos Serviços Locais
Após o arranque do Docker, pode aceder de imediato aos seguintes serviços no seu navegador:

*   🖥️ **Interface Cliente (React):** **[http://localhost:8080](http://localhost:8080)**
*   🔌 **API Backend (Express):** **[http://localhost:3000](http://localhost:3000)**
*   📊 **Gestor de Base de Dados (pgAdmin):** **[http://localhost:5050](http://localhost:5050)**
    *   *Credenciais:* Email: `admin@admin.com` | Palavra-passe: `adminpassword`

---

## 💻 Método de Desenvolvimento: Execução Local (Para Programadores)

Este método permite que os programadores façam alterações ao código com atualização em tempo real (*Hot-Reload*) no browser e no servidor.

### 1. Pré-Requisitos
*   **Node.js v20+** instalado localmente.
*   **Docker Desktop** em execução.

### 2. Passo 1: Iniciar apenas a Base de Dados (Docker)
Para evitar conflitos com os servidores locais que vai iniciar a seguir, ative apenas a base de dados PostgreSQL e o pgAdmin no Docker:
1.  No terminal da raiz do projeto, garanta que os restantes contentores estão desligados:
    ```bash
    docker compose stop frontend backend
    ```
2.  *(A base de dados continuará a correr isolada em segundo plano na porta local `5433`).*

### 3. Passo 2: Iniciar o Servidor Backend (Local)
1.  Abra um terminal na pasta `backend`:
    ```bash
    cd backend
    ```
2.  Instale as dependências de desenvolvimento:
    ```bash
    npm install
    ```
3.  Crie a estrutura de tabelas e carregue os dados de teste (Seed):
    ```bash
    npx prisma migrate dev
    ```
4.  Inicie o servidor em modo de desenvolvimento:
    ```bash
    npm run dev
    ```
    *API Backend a correr ativamente em:* `http://localhost:3000`

### 4. Passo 3: Iniciar o Frontend React (Local)
1.  Abra um novo terminal na pasta `frontend`:
    ```bash
    cd frontend
    ```
2.  Instale as dependências:
    ```bash
    npm install
    ```
3.  Inicie o servidor de desenvolvimento Vite:
    ```bash
    npm run dev
    ```
    *Interface Frontend a correr ativamente com hot-reload em:* **[http://localhost:5173](http://localhost:5173)**

---

## 🛠️ Guia Técnico de Base de Dados (Prisma ORM)

Para manter a integridade estrutural, a equipa não utiliza scripts SQL diretamente para criar tabelas.

### Modificar a Estrutura Física
1.  As tabelas são definidas de forma declarativa no ficheiro: **`backend/prisma/schema.prisma`**
2.  Após editar os seus modelos nesse ficheiro, abra o terminal do `backend` e sincronize as tabelas com o PostgreSQL correndo:
    ```bash
    npx prisma migrate dev --name nome_da_alteracao
    ```
3.  Isto irá gerar um ficheiro SQL histórico na pasta `prisma/migrations` e atualizará a base de dados de imediato.

### Visualizar Dados com o Prisma Studio
Se quiser uma visualização gráfica rápida e limpa de todas as tabelas sem abrir o pgAdmin:
1.  No terminal do backend, execute:
    ```bash
    npx prisma studio
    ```
2.  Aceda a **[http://localhost:5555](http://localhost:5555)** no browser.
