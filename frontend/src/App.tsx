
import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Catalogo from './pages/Catalogo';
import Fornecedores from './pages/Fornecedores';

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

    return (
        <BrowserRouter>
            <div className="flex min-h-screen bg-slate-50 font-sans">
                <Sidebar isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
                <main className={`flex-1 p-8 transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/catalogo" element={<Catalogo />} />
                        <Route path="/fornecedores" element={<Fornecedores />} />
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    );
}

export default App;
