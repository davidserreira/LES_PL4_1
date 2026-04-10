import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, User, AlertCircle } from 'lucide-react';
import { utilizadorService, Utilizador } from '../services/utilizadorService';

interface LoginProps {
    onLoginSuccess: (user: Utilizador) => void;
}

const Login = ({ onLoginSuccess }: LoginProps) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const userData = await utilizadorService.login({ username, password });
            onLoginSuccess(userData);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao realizar login. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-950 flex items-center justify-center px-4 py-8">
            <div className="pointer-events-none absolute inset-0" aria-hidden>
                <div className="absolute -left-[20%] -top-[15%] h-[min(42rem,85vw)] w-[min(42rem,85vw)] rounded-full bg-emerald-500/[0.14] blur-[100px] animate-login-drift" />
                <div className="absolute -right-[18%] bottom-[-10%] h-[min(36rem,75vw)] w-[min(36rem,75vw)] rounded-full bg-teal-600/[0.1] blur-[90px] animate-login-drift-reverse" />
                <div className="absolute left-[40%] top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/[0.07] blur-[72px] animate-login-drift [animation-delay:-8s]" />
            </div>

            <div className="relative w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 bg-slate-900/60 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 slide-in-from-bottom-5 duration-700 motion-reduce:duration-0">
                {/* Left side - brand / intro */}
                <div className="hidden md:flex flex-col justify-between p-8 bg-gradient-to-b from-slate-900 to-slate-950 border-r border-slate-800">
                    <div className="animate-in fade-in slide-in-from-left-3 duration-700 delay-150 motion-reduce:animate-none">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center animate-login-shield-glow motion-reduce:animate-none">
                                <ShieldCheck className="text-emerald-400" size={26} />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Área Administrativa</p>
                                <h1 className="text-xl font-bold text-white mt-1">Clínica Veterinária</h1>
                            </div>
                        </div>

                        <p className="text-sm text-slate-300 leading-relaxed">
                            Aceda ao painel de controlo da farmácia da clínica para gerir o catálogo de medicamentos,
                            níveis de stock e fornecedores com total segurança.
                        </p>
                    </div>

                    <div className="space-y-3 mt-10 animate-in fade-in slide-in-from-left-3 duration-700 delay-300 motion-reduce:animate-none">
                        <div className="flex items-center gap-3 text-slate-400 text-xs">
                            <div className="w-7 h-7 rounded-xl bg-slate-800/80 flex items-center justify-center">
                                <Lock size={14} className="text-emerald-400" />
                            </div>
                            <p>Login restrito a utilizadores administradores autorizados.</p>
                        </div>
                        <p className="text-[11px] text-slate-500">
                            Utilize as suas credenciais de acesso corporativas.
                        </p>
                    </div>
                </div>

                {/* Right side - form */}
                <div className="p-8 md:p-10 bg-slate-950/60 animate-in fade-in slide-in-from-right-3 duration-700 delay-200 motion-reduce:animate-none">
                    <div className="mb-8 md:mb-10 md:hidden">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center animate-login-shield-glow motion-reduce:animate-none">
                                <ShieldCheck className="text-emerald-400" size={22} />
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400">Área Administrativa</p>
                                <h1 className="text-lg font-bold text-white mt-1">Clínica Veterinária</h1>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1 mb-6">
                        <h2 className="text-xl md:text-2xl font-bold text-white">Iniciar sessão</h2>
                        <p className="text-sm text-slate-400">
                            Introduza as suas credenciais para aceder ao painel de administração.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 flex items-start gap-3 text-sm text-red-200 animate-in fade-in slide-in-from-top-2 duration-300">
                            <AlertCircle size={18} className="mt-0.5 shrink-0 animate-pulse motion-reduce:animate-none" />
                            <p>{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-200">Username</label>
                            <div className="relative">
                                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-100 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 placeholder:text-slate-500"
                                    placeholder="admin"
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-200">Password</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-100 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 placeholder:text-slate-500"
                                    placeholder="••••"
                                    autoComplete="current-password"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold shadow-lg shadow-emerald-900/40 hover:bg-emerald-500 hover:shadow-emerald-600/25 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 motion-reduce:transition-none"
                        >
                            {loading ? (
                                <>
                                    <span className="h-4 w-4 border-2 border-emerald-200 border-t-transparent rounded-full animate-spin" />
                                    A validar...
                                </>
                            ) : (
                                <>
                                    <Lock size={16} />
                                    Entrar
                                </>
                            )}
                        </button>

                        <p className="text-[11px] text-slate-500 mt-3">
                            Problemas no acesso? Contacte o administrador do sistema.
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;

