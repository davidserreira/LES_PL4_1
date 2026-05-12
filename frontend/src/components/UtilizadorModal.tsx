import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Shield, Lock, AlertCircle, Loader2, CheckCircle2, ChevronDown } from 'lucide-react';
import { utilizadorService, Utilizador } from '../services/utilizadorService';

interface UtilizadorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    utilizador?: Utilizador | null;
}

const ROLES = [
    { value: 'ADMINISTRADOR', label: 'Administrador', icon: Shield, color: 'text-red-500' },
    { value: 'RESPONSAVEL_STOCK', label: 'Responsável pelo Stock', icon: User, color: 'text-emerald-500' },
    { value: 'RESPONSAVEL_FINANCEIRO', label: 'Responsável Financeiro', icon: User, color: 'text-blue-500' }
];

const UtilizadorModal: React.FC<UtilizadorModalProps> = ({ isOpen, onClose, onSuccess, utilizador }) => {
    const [formData, setFormData] = useState({
        username: '',
        role: 'RESPONSAVEL_STOCK' as Utilizador['role'],
        password: '',
        ativo: true
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isClosing, setIsClosing] = useState(false);
    const [isRoleOpen, setIsRoleOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<Utilizador | null>(null);
    const roleRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) setCurrentUser(JSON.parse(savedUser));
    }, []);

    useEffect(() => {
        if (isOpen) {
            setIsClosing(false);
            setError(null);
            setIsRoleOpen(false);
            if (utilizador) {
                setFormData({
                    username: utilizador.username,
                    role: utilizador.role,
                    password: '',
                    ativo: utilizador.ativo !== false
                });
            } else {
                setFormData({
                    username: '',
                    role: 'RESPONSAVEL_STOCK',
                    password: '',
                    ativo: true
                });
            }
        }
    }, [utilizador, isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (roleRef.current && !roleRef.current.contains(event.target as Node)) {
                setIsRoleOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setIsClosing(false);
        }, 300);
    };

    if (!isOpen && !isClosing) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (utilizador) {
                const updateData: any = { ...formData };
                if (!updateData.password) delete updateData.password;
                await utilizadorService.update(utilizador.id, updateData);
            } else {
                await utilizadorService.create(formData);
            }
            onSuccess();
            handleClose();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao guardar utilizador');
        } finally {
            setLoading(false);
        }
    };

    const selectedRole = ROLES.find(r => r.value === formData.role);

    return createPortal(
        <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
            <div className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`} onClick={handleClose} />
            
            <div className={`relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden transform transition-all duration-300 ${isClosing ? 'scale-95 translate-y-4' : 'scale-100 translate-y-0'}`}>
                <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        {utilizador ? <Shield size={20} className="text-blue-400" /> : <User size={20} className="text-blue-400" />}
                        {utilizador ? 'Editar Utilizador' : 'Novo Utilizador'}
                    </h2>
                    <button onClick={handleClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-white dark:bg-slate-800/10 rounded-lg transition-all">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
                    {error && (
                        <div className="animate-shake rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 p-3 flex gap-3 items-center">
                            <AlertCircle className="text-red-500 shrink-0" size={18} />
                            <p className="text-sm font-medium text-red-800">{error}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Dados de Acesso</h3>
                        
                        <div className="space-y-1.5 pt-1">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-0.5">Nome de utilizador *</label>
                            <div className="relative">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    required
                                    type="text"
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                    className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all placeholder:text-slate-400 text-sm"
                                    placeholder="Nome de utilizador"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5 pt-1 relative" ref={roleRef}>
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-0.5">Cargo / Role *</label>
                            <button
                                type="button"
                                onClick={() => setIsRoleOpen(!isRoleOpen)}
                                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all flex items-center justify-between text-sm group"
                            >
                                <div className="flex items-center gap-2">
                                    {selectedRole && <selectedRole.icon size={16} className={selectedRole.color} />}
                                    <span className="text-slate-900 dark:text-slate-100">{selectedRole?.label}</span>
                                </div>
                                <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isRoleOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isRoleOpen && (
                                <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 py-1.5 animate-in fade-in zoom-in-95 duration-200">
                                    {ROLES.map((role) => (
                                        <button
                                            key={role.value}
                                            type="button"
                                            onClick={() => {
                                                setFormData({ ...formData, role: role.value as Utilizador['role'] });
                                                setIsRoleOpen(false);
                                            }}
                                            className={`w-full px-4 py-2 flex items-center gap-3 hover:bg-blue-50 dark:bg-blue-500/10 transition-colors text-sm ${formData.role === role.value ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 font-medium' : 'text-slate-600 dark:text-slate-400'}`}
                                        >
                                            <role.icon size={16} className={role.color} />
                                            {role.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-1.5 pt-1">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-0.5">
                                Password {!utilizador && '*'} {utilizador && <span className="text-[10px] text-slate-400 font-normal ml-1">(deixe vazio para manter atual)</span>}
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    required={!utilizador}
                                    type="password"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all placeholder:text-slate-400 text-sm"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between py-3 px-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700/50 transition-colors">
                            <div className="space-y-0.5">
                                <label className="text-sm font-bold text-slate-800 dark:text-slate-200">Estado da Conta</label>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Define se o utilizador pode ou não aceder ao sistema</p>
                            </div>
                             <div className="flex items-center gap-3">
                                <span className={`text-[10px] uppercase font-black tracking-wider ${formData.ativo ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                                    {formData.ativo ? 'Ativo' : 'Inativo'}
                                </span>
                                <button
                                    type="button"
                                    disabled={utilizador && utilizador.role === 'ADMINISTRADOR' && utilizador.id !== currentUser?.id && utilizador.ativo !== false}
                                    onClick={() => setFormData({ ...formData, ativo: !formData.ativo })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ring-offset-2 focus:ring-2 focus:ring-blue-500 ${(utilizador && utilizador.role === 'ADMINISTRADOR' && utilizador.id !== currentUser?.id && utilizador.ativo !== false) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${formData.ativo ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                >
                                    <span
                                        className={`${
                                            formData.ativo ? 'translate-x-6' : 'translate-x-1'
                                        } inline-block h-4 w-4 transform rounded-full bg-white dark:bg-slate-800 transition-transform shadow-sm`}
                                    />
                                </button>
                            </div>
                            {(utilizador && utilizador.role === 'ADMINISTRADOR' && utilizador.id !== currentUser?.id && utilizador.ativo !== false) && (
                                <p className="absolute -bottom-5 right-0 text-[9px] font-bold text-amber-600 dark:text-amber-400 animate-pulse">
                                    Não é permitido inativar outros administradores
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900 transition-all text-sm"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50 text-sm flex items-center justify-center gap-2 shadow-sm"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    A processar...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={18} />
                                    {utilizador ? 'Atualizar Utilizador' : 'Criar Utilizador'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default UtilizadorModal;
