# 🐾 VetStock - Gestão de Compras e Stocks

O **VetStock** é uma plataforma corporativa *fullstack* concebida para a gestão logística de compras, contratos de fornecedores, receção de encomendas e controlo físico de existências numa clínica veterinária. 

## 🌐 Acesso em Produção (Online)
A aplicação foi projetada utilizando uma **Arquitetura Cloud Distribuída (Micro-PaaS/Jamstack)**, de forma a separar responsabilidades, maximizar a escalabilidade e minimizar custos operacionais:
* **Frontend:** Alojado no servidor web associado ao domínio oficial (Amen.pt). Acesso via: **[https://vetstock.online](https://vetstock.online)**
* **Backend API:** Desacoplado para a plataforma Cloud **Render.com**, otimizada para Node.js.
  > ⚠️ **Nota:** Sendo uma instância gratuita no Render, o servidor adormece (*spin down*) após algum tempo de inatividade. O primeiro acesso poderá demorar 50 segundos ou mais a carregar. Após esse "despertar", as respostas voltam a ser instantâneas!
* **Base de Dados:** Persistência de dados assegurada de forma segura e remota pelo serviço DBaaS **Supabase** (motor PostgreSQL 15).

---

## 🚀 Principais Funcionalidades
- **Dashboard Analítico Avançado:** Gráficos interativos renderizados em D3.js para análise de níveis de stock, mapeamento financeiro de capital bloqueado e monitorização temporal de gastos em aprovisionamento.
- **Gestão de Stock Inteligente:** Controlo de níveis mínimos (alertas pró-ativos), avaliação de valor total armazenado e inventário categorizado.
- **Fluxos de Pedidos de Compra:** Workflow rigoroso de aprovação com múltiplos estados de ciclo de vida (Rascunho ➔ Pendente ➔ Aprovado / Recusado ➔ Entregue).
- **Rede de Fornecedores:** Catálogos de cotações variadas para o mesmo artigo, favorecendo a otimização de compras através de "Fornecedores Preferenciais" automáticos.
- **Controlo de Acessos (RBAC):** Segurança baseada em perfis profissionais (Administrador, Responsável de Stock, Responsável Financeiro), onde cada um apenas interage com os módulos da sua competência.

---

## 🛠️ Stack Tecnológico
*   **Frontend:** Interface SPA moderna, *responsive* e com design *glassmorphic* construída em **React (TypeScript + Vite)** com **Tailwind CSS**.
*   **Backend:** API RESTful robusta desenvolvida em **Node.js (Express + TypeScript)**.
*   **Base de Dados:** Banco de dados relacional **PostgreSQL**, intermediado rigorosamente pelo **Prisma ORM**.
*   **Infraestrutura Local:** Ambiente completamente contentorizado através de **Docker / Docker Compose** para execução reprodutível em qualquer máquina, sem conflitos de versões.

---

## ⚡ Método Rápido: Execução Completa no Docker Local (Zero Setup)

Este é o método recomendado para professores e utilizadores que queiram rodar e testar o projeto completo sem ter de instalar ferramentas de programação (como Node.js). A aplicação correrá num ambiente isolado e seguro.

### 1. Pré-Requisitos
*   Ter o **Docker Desktop** (https://www.docker.com/products/docker-desktop/) instalado e em execução no computador.

### 2. Iniciar a Aplicação
1.  Abra o terminal na **pasta raiz** do projeto.
2.  Execute o comando para compilar e arrancar todos os serviços em segundo plano:
    ```bash
    docker-compose up --build -d
    ```
3.  *O Docker irá descarregar as imagens, injetar as variáveis de ambiente, executar as migrações estruturais do Prisma, popular os dados de demonstração (seed) e ligar os servidores.*

### 3. Aceder aos Serviços Locais
Após o arranque completo do Docker, os serviços locais estarão disponíveis:
*   🖥️ **Interface Cliente (React SPA):** **[http://localhost:8080](http://localhost:8080)**
*   🔌 **API Backend (Express):** **[http://localhost:3000](http://localhost:3000)**
*   📊 **Gestor de Base de Dados (pgAdmin):** **[http://localhost:5050](http://localhost:5050)**
    *   *Credenciais:* Email: `admin@admin.com` | Palavra-passe: `adminpassword`

---

## 💻 Método de Desenvolvimento: Execução Local (Para Programadores)

Este método permite que os programadores façam alterações ao código com atualização em tempo real (*Hot-Reload*) no browser e no servidor.

### 1. Passo Inicial: Ligar apenas a Base de Dados (Docker)
Para evitar conflitos de portas com os servidores locais que vai iniciar a seguir, ative apenas a base de dados PostgreSQL e o pgAdmin no Docker:
1.  No terminal da raiz do projeto, garanta que os restantes contentores estão desligados:
    ```bash
    docker-compose stop frontend backend
    ```
2.  *(A base de dados continuará a correr isolada em segundo plano na porta local `5433`).*

### 2. Iniciar o Servidor Backend (Local)
1.  Abra um terminal na pasta `backend`: `cd backend`
2.  Instale as dependências: `npm install`
3.  Crie a estrutura de tabelas e carregue os dados de teste (Seed): `npx prisma migrate dev`
4.  Inicie o servidor de desenvolvimento: `npm run dev`
    *(A API Backend ficará a correr ativamente em http://localhost:3000)*

### 3. Iniciar o Frontend React (Local)
1.  Abra um novo terminal na pasta `frontend`: `cd frontend`
2.  Instale as dependências: `npm install`
3.  Inicie o servidor de desenvolvimento Vite: `npm run dev`
    *(A Interface Frontend ficará a correr com hot-reload em http://localhost:5173)*

---

## 🛠️ Guia Técnico de Base de Dados (Prisma ORM)

> [!IMPORTANT]
> Todos os comandos do Prisma (`npx prisma ...`) **devem ser executados obrigatoriamente dentro da pasta `backend`**, pois é lá que residem o `.env` e as configurações do `schema.prisma`.

Para manter a integridade estrutural, a equipa adotou a filosofia *Code-First*. Não utilizamos scripts SQL soltos para criar tabelas; o motor Prisma gere todo o esquema através de *migrations*.

### Modificar a Estrutura Física das Tabelas
1.  As tabelas são definidas de forma declarativa e segura no ficheiro: **`backend/prisma/schema.prisma`**
2.  Após editar a sua arquitetura de dados nesse ficheiro, abra o terminal na pasta `backend` e sincronize com o PostgreSQL:
    ```bash
    npx prisma migrate dev --name nome_da_alteracao
    ```

### Popular a Base de Dados de Emergência (Seed)
Caso as tabelas percam os dados de demonstração:
1. Abra o terminal na pasta `backend` e execute:
   ```bash
   npx prisma db seed
   ```

### Visualização Rápida de Tabelas
Se precisar de visualizar ou editar rapidamente os registos do PostgreSQL sem ter de abrir o pesado *pgAdmin*:
1.  No terminal do backend, execute: `npx prisma studio`
2.  Aceda a **[http://localhost:5555](http://localhost:5555)** no browser.
