import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Catalogo from './pages/Catalogo';
import Fornecedores from './pages/Fornecedores';
import Utilizadores from './pages/Utilizadores';
import Login from './pages/Login';
import CriarPedidoCompra from './pages/CriarPedidoCompra';
import PedidosCompra from './pages/PedidosCompra';
import { Utilizador } from './services/utilizadorService';

function Dashboard() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
            <p className="mt-2 text-sm text-slate-500">
                Bem-vindo ao painel de administração da clínica.
            </p>
        </div>
    );
}

function App() {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [user, setUser] = useState<Utilizador | null>(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const handleLoginSuccess = (userData: Utilizador) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    return (
        <BrowserRouter>
            {user ? (
                <div className="flex min-h-screen bg-slate-50 font-sans">
                    <Sidebar
                        user={user}
                        isCollapsed={isSidebarCollapsed}
                        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        onLogout={handleLogout}
                    />
                    <main className="flex-1 p-8">
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            
                            {/* Role-based Route Protection */}
                            {(user.role === 'ADMINISTRADOR' || user.role === 'RESPONSAVEL_STOCK') && (
                                <>
                                    <Route path="/catalogo" element={<Catalogo />} />
                                    <Route path="/pedidos/novo" element={<CriarPedidoCompra />} />
                                    <Route path="/pedidos" element={<PedidosCompra />} />
                                </>
                            )}
                            
                            {user.role === 'ADMINISTRADOR' && (
                                <>
                                    <Route path="/fornecedores" element={<Fornecedores />} />
                                    <Route path="/utilizadores" element={<Utilizadores />} />
                                </>
                            )}

                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </main>
                </div>
            ) : (
                <Routes>
                    <Route path="*" element={<Login onLoginSuccess={handleLoginSuccess} />} />
                </Routes>
            )}
        </BrowserRouter>
    );
}


export default App;
