import React, { useState, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface SmartDropdownProps {
    isOpen: boolean;
    triggerRef: React.RefObject<HTMLElement | null>;
    children: React.ReactNode;
}

export function SmartDropdown({ isOpen, triggerRef, children }: SmartDropdownProps) {
    const [coords, setCoords] = useState<{ top: number; left: number; width: number; isDropup: boolean; ready: boolean }>({
        top: 0, left: 0, width: 0, isDropup: false, ready: false
    });
    const dropdownRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (!isOpen || !triggerRef.current) return;

        const updatePosition = () => {
            if (!triggerRef.current) return;
            const rect = triggerRef.current.getBoundingClientRect();
            
            const dropdownHeight = 288 + 16;
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            const isDropup = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

            setCoords({
                left: rect.left,
                width: rect.width,
                top: isDropup ? rect.top - 8 : rect.bottom + 8,
                isDropup,
                ready: true
            });
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [isOpen, triggerRef]);

    // Resetar o ready quando fechar para evitar flash na próxima abertura
    useLayoutEffect(() => {
        if (!isOpen) {
            setCoords(prev => ({ ...prev, ready: false }));
        }
    }, [isOpen]);

    // Não renderizar enquanto as coordenadas não estiverem calculadas
    if (!isOpen || !coords.ready) return null;

    return createPortal(
        <div
            ref={dropdownRef}
            className="fixed z-[99999] bg-white dark:bg-slate-800 rounded-xl shadow-[0_12px_45px_rgb(0,0,0,0.2)] border border-slate-200 dark:border-slate-700 py-2 animate-in fade-in duration-150 max-h-72 overflow-y-auto"
            style={{
                left: coords.left,
                width: coords.width,
                ...(coords.isDropup 
                    ? { bottom: window.innerHeight - coords.top } 
                    : { top: coords.top }
                ),
                scrollbarGutter: 'stable'
            }}
            onClick={(e) => e.stopPropagation()}
        >
            {children}
        </div>,
        document.body
    );
}
