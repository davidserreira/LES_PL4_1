# LES_PL4_1 - Clínica Veterinária 🐾

Um projeto fullstack que inclui um Frontend em React (com TypeScript e Vite) e um Backend em Node.js (com Express + Prisma ORM). A Base de Dados é PostgreSQL, executada de forma isolada através do Docker.

Temos dois guias abaixo: um passo-a-passo simples para um **Utilizador Comum** colocar tudo a rodar e testar o projeto, e outro mais técnico para **Programadores** entenderem como trabalhar com o ambiente de dados e código.

---

## 🚀 Guia para Utilizadores (Como pôr a aplicação a funcionar)

Esta secção é para quem apenas quer descarregar o projeto, ligar todos os "motores" e testar a aplicação na sua máquina.

### 1. Pré-Requisitos
Antes de tudo, garanta que tem instalado no seu computador:
1. **Node.js** (https://nodejs.org/)
2. **Docker Desktop** (https://www.docker.com/products/docker-desktop/) - *Tem de estar aberto e a correr no background (ícone do motor verde nas notificações do Windows).*

### 2. Levantar a Base de Dados e o Gestor (pgAdmin)
1. Abra um terminal na pasta global (`raiz`) deste projeto.
2. Escreva o comando:
   ```bash
   docker compose up -d
   ```
   *Isto vai descarregar e iniciar um contentor com o PostgreSQL (Base de Dados) e o pgAdmin 4 (Programa para visualizar a Base de Dados), a rodar de forma invisível em segundo plano.*

### 3. Iniciar o Servidor (Backend)
1. Abra um terminal novo (deixe o outro livre) e navegue para a pasta `backend`:
   ```bash
   cd backend
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Garanta que a base de dados tem as tabelas estruturadas (sincronizar):
   ```bash
   npx prisma migrate dev
   ```
4. Ponha o servidor a correr:
   ```bash
   npm run dev
   ```
   *Pode aceder e confirmar que o Backend está vivo em: `http://localhost:3000`*

### 4. Iniciar a Interface Gráfica (Frontend)
1. Abra **outro** terminal e navegue para a pasta `frontend`:
   ```bash
   cd frontend
   ```
2. Instale dependências e inicie o site:
   ```bash
   npm install
   npm run dev
   ```
   *A página web da aplicação abre automaticamente ou fica disponível no endereço: `http://localhost:5173`*

---
---

## � Guia para Programadores (Desenvolvimento)

Como este projeto utiliza uma arquitetura híbrida para maximizar a velocidade de desenvolvimento ("Hot-reload" em milissegundos localmente, base de dados limpa no Docker), tudo o que é código vive no teu computador, e os dados residem no contentor.

### 1. Como gerir a Base de Dados (Onde e Como Fazer Alterações)

Nós **nunca** criamos tabelas diretamente com SQL. Usamos o **Prisma ORM**.

*   **Onde se planeia/modifica a Base de Dados?**
    Ficheiro: `backend/prisma/schema.prisma`
    Nele, é onde crias os teus Modelos. Se quiseres adicionar as tabelas de `Animais`, `Donos`, ou `Consultas`, é nesse ficheiro que as vais "desenhar".

*   **Como aplicar as tuas alterações à Base de Dados?**
    Depois de escrever/editar os teus modelos no `schema.prisma`, precisas de "sincronizar" o Prisma com o teu PostgreSQL no Docker.
    Abre o terminal do `backend` e corre o comando:
    ```bash
    npx prisma migrate dev --name <nome_curto_do_que_fizeste>
    # Exemplo: npx prisma migrate dev --name adicionar_tabela_animais
    ```
    Isso vai gerar um ficheiro em `prisma/migrations` de log e injetar a tabela na base de dados (que tu instalaste através do Docker lá atrás).

### 2. Onde visualizar os dados da Base de Dados

Tens duas opções fantásticas à tua escolha se quiseres espreitar o recheio das tabelas:

**Opção A: O pgAdmin 4 no teu Navegador (Gestão Profissional e Avançada)**
Acede a [http://localhost:5050](http://localhost:5050)
*   **Email:** `admin@admin.com` | **Pass:** `adminpassword`
*(Se for o teu 1º acesso e a base de dados ainda não estiver presente na barra esquerda, regista o servidor de forma simples)*:
1. Botão direito em **Servers** > **Register** > **Server**.
2. Separador **General:** Nomeia-o de `Postgres_Docker`.
3. Separador **Connection:**
   *   Host: `db`
   *   Maintenance DB: `app_database`
   *   Username/Password: `admin` / `adminpassword`
   *   Save! (Agora expande *Servers -> app_database -> Schemas -> public -> Tables*)

**Opção B: Prisma Studio (Mais rápido e limpo para programadores verem os dados)**
Abre o terminal do teu backend e corre:
```bash
npx prisma studio
```
Isto vai prender o teu terminal e abrir uma interface incrivelmente fácil e "Limpa" no teu browser em `http://localhost:5555`. Muito útil apenas para visualizar as tabelas do Prisma à velocidade da luz.

### 3. Onde escrever o resto do Backend (Scripts e Lógica)
*   Todo o código de Lógica da API está no caminho `backend/src/`.
*   O servidor Express.js está instanciado no `backend/src/server.ts`.
*   A ligação ao Prisma (O Cliente que te dá "Autocomplete" infinito quando queres ir ler a base de dados pelo código) existe debaixo desta exportação: `backend/src/lib/prisma.ts`.

### 4. Estrutura Padrão de Comandos (O que abrir logo pela Manhã)
Quando ligas o PC de manhã para ir criar código:
1. Confirma que o *Docker Desktop* está aberto e as "bolinhas verdes" dos teus contentores estão a correr (Ou escreve `docker compose up -d` na pasta principal).
2. Terminal no `frontend` -> `npm run dev`
3. Terminal no `backend` -> `npm run dev`
4. Programar!
