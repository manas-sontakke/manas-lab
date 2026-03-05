import React, { createContext, useContext, useState, useCallback } from 'react';
import { UI } from '../utils/constants';

const ConfirmContext = createContext(null);

export function useConfirm() {
    return useContext(ConfirmContext);
}

export function ConfirmProvider({ children, isDarkMode }) {
    const [state, setState] = useState({ show: false, message: '', subtext: '', onConfirm: null, confirmLabel: 'Continue', cancelLabel: 'Cancel' });

    const confirm = useCallback(({ message, subtext = '', confirmLabel = 'Continue', cancelLabel = 'Go back' }) => {
        return new Promise((resolve) => {
            setState({
                show: true,
                message,
                subtext,
                confirmLabel,
                cancelLabel,
                onConfirm: () => { setState(s => ({ ...s, show: false })); resolve(true); },
                onCancel: () => { setState(s => ({ ...s, show: false })); resolve(false); },
            });
        });
    }, []);

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}
            {state.show && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/10 dark:bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={state.onCancel}>
                    <div
                        className={`w-full max-w-[380px] bg-white dark:bg-[#1A1A1A] border border-black/5 dark:border-white/10 rounded-2xl p-7 shadow-2xl animate-in zoom-in-[0.97] duration-200`}
                        onClick={e => e.stopPropagation()}
                    >
                        <p className={`font-serif text-[1.15rem] leading-[1.5] ${isDarkMode ? 'text-[#EDEDED]' : 'text-[#232323]'} mb-2`}>
                            {state.message}
                        </p>
                        {state.subtext && (
                            <p className={`font-sans text-sm ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'} mb-6 leading-relaxed`}>
                                {state.subtext}
                            </p>
                        )}
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={state.onCancel}
                                className={`${UI.label} px-5 py-2.5 rounded-full border border-black/10 dark:border-white/10 ${isDarkMode ? 'text-zinc-400 hover:text-white hover:border-white/20' : 'text-zinc-500 hover:text-black hover:border-black/20'} transition-colors`}
                            >
                                {state.cancelLabel}
                            </button>
                            <button
                                onClick={state.onConfirm}
                                className={`${UI.label} px-5 py-2.5 rounded-full bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] hover:opacity-80 transition-opacity`}
                            >
                                {state.confirmLabel}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
}
