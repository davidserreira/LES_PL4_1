import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
    const [isDark, setIsDark] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    });

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    return (
        <button
            onClick={() => setIsDark(!isDark)}
            className="fixed bottom-6 right-6 z-50 p-3 bg-slate-800 text-slate-50 dark:bg-slate-200 dark:text-slate-900 rounded-full shadow-xl hover:scale-110 transition-all duration-200 focus:outline-none"
            title={isDark ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
        >
            {isDark ? <Sun size={24} /> : <Moon size={24} />}
        </button>
    );
}
