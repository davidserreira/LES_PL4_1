import React from 'react';

<<<<<<< Updated upstream
function App() {
=======
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Catalogo from './pages/Catalogo';
import Login from './pages/Login';

function Dashboard() {
>>>>>>> Stashed changes
    return (
        <div style={{ textAlign: 'center', padding: '50px' }}>
            <h1>Clínica Veterinária</h1>
            <p>O Frontend React está a funcionar!</p>
        </div>
    );
}

<<<<<<< Updated upstream
=======
function App() {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

    const handleLoginSuccess = () => {
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
    };

    return (
        <BrowserRouter>
            {isAuthenticated ? (
                <div className="flex min-h-screen bg-slate-50 font-sans">
                    <Sidebar
                        isCollapsed={isSidebarCollapsed}
                        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        onLogout={handleLogout}
                    />
                    <main className="flex-1 p-8 transition-all duration-300">
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/catalogo" element={<Catalogo />} />
                            <Route path="*" element={<Dashboard />} />
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

>>>>>>> Stashed changes
export default App;
