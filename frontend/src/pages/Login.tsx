import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, User, AlertCircle } from 'lucide-react';
import { utilizadorService, Utilizador } from '../services/utilizadorService';
import logoImg from '../assets/logo.png';

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
        <div className="relative min-h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4 py-8 transition-colors duration-300">
            <div className="pointer-events-none absolute inset-0" aria-hidden>
                <div className="absolute -left-[20%] -top-[15%] h-[min(42rem,85vw)] w-[min(42rem,85vw)] rounded-full bg-emerald-500/[0.14] blur-[100px] animate-login-drift" />
                <div className="absolute -right-[18%] bottom-[-10%] h-[min(36rem,75vw)] w-[min(36rem,75vw)] rounded-full bg-teal-600/[0.1] blur-[90px] animate-login-drift-reverse" />
                <div className="absolute left-[40%] top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/[0.07] blur-[72px] animate-login-drift [animation-delay:-8s]" />
            </div>

            <div className="relative w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 slide-in-from-bottom-5 duration-700 motion-reduce:duration-0 transition-colors">
                {/* Left side - brand / intro */}
                <div className="hidden md:flex flex-col justify-between p-8 bg-gradient-to-b from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-950 border-r border-slate-200 dark:border-slate-800 transition-colors">
                    <div className="animate-in fade-in slide-in-from-left-3 duration-700 delay-150 motion-reduce:animate-none">
                        <div className="flex items-center gap-6 mb-10">
                            <div className="relative shrink-0">
                                <div className="absolute inset-0 bg-emerald-500 blur-[30px] opacity-30 rounded-full scale-150" />
                                <img src={logoImg} alt="VetStock Logo" className="w-[7rem] h-[7rem] relative object-contain drop-shadow-[0_0_20px_rgba(52,211,153,0.45)]" />
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-[3.25rem] font-black text-slate-900 dark:text-white leading-none tracking-tighter drop-shadow-sm transition-colors">Vet<span className="text-emerald-500 dark:text-emerald-400">Stock</span></h1>
                                <p className="text-[13px] font-black uppercase tracking-[0.3em] text-emerald-600/90 dark:text-emerald-500/90 mt-2.5 drop-shadow-sm ml-1 transition-colors">System</p>
                            </div>
                        </div>

                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed transition-colors">
                            Aceda ao painel de controlo da farmácia da clínica para gerir o catálogo de medicamentos,
                            níveis de stock e fornecedores com total segurança.
                        </p>
                    </div>

                    <div className="space-y-3 mt-10 animate-in fade-in slide-in-from-left-3 duration-700 delay-300 motion-reduce:animate-none">
                        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-xs transition-colors">
                            <div className="w-7 h-7 rounded-xl bg-slate-200/80 dark:bg-slate-800/80 flex items-center justify-center transition-colors">
                                <Lock size={14} className="text-emerald-500 dark:text-emerald-400" />
                            </div>
                            <p>Login restrito a utilizadores administradores autorizados.</p>
                        </div>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 transition-colors">
                            Utilize as suas credenciais de acesso corporativas.
                        </p>
                    </div>
                </div>

                {/* Right side - form */}
                <div className="p-8 md:p-10 bg-slate-50/60 dark:bg-slate-950/60 transition-colors animate-in fade-in slide-in-from-right-3 duration-700 delay-200 motion-reduce:animate-none">
                    <div className="mb-8 md:mb-10 md:hidden">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="relative shrink-0">
                                <div className="absolute inset-0 bg-emerald-500 blur-[20px] opacity-30 rounded-full scale-150" />
                                <img src={logoImg} alt="VetStock Logo" className="w-[4.5rem] h-[4.5rem] relative object-contain drop-shadow-[0_0_15px_rgba(52,211,153,0.4)]" />
                            </div>
                            <div className="flex flex-col mt-1">
                                <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-none tracking-tighter drop-shadow-sm transition-colors">Vet<span className="text-emerald-500 dark:text-emerald-400">Stock</span></h1>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600/90 dark:text-emerald-500/90 mt-1.5 drop-shadow-sm ml-0.5 transition-colors">System</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1 mb-6">
                        <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white transition-colors">Iniciar sessão</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 transition-colors">
                            Introduza as suas credenciais para aceder ao painel de administração.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 dark:bg-red-500/10 px-4 py-3 flex items-start gap-3 text-sm text-red-800 dark:text-red-200 animate-in fade-in slide-in-from-top-2 duration-300 transition-colors">
                            <AlertCircle size={18} className="mt-0.5 shrink-0 animate-pulse motion-reduce:animate-none text-red-600 dark:text-red-400" />
                            <p>{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors">Username</label>
                            <div className="relative">
                                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 transition-colors" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
                                    placeholder="admin"
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors">Password</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 transition-colors" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
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

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3">
                            Problemas no acesso? Contacte o administrador do sistema.
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;

