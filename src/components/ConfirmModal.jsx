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
                <div
                    className={`fixed inset-0 z-[10000] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200 ${isDarkMode ? 'bg-black/50' : 'bg-black/10'}`}
                    onClick={state.onCancel}
                >
                    <div
                        className={`w-full max-w-[380px] rounded-2xl p-7 shadow-2xl animate-in zoom-in-[0.97] duration-200 ${isDarkMode ? 'bg-[#1A1A1A] border border-white/10' : 'bg-white border border-black/5'}`}
                        onClick={e => e.stopPropagation()}
                    >
                        <p className={`font-serif text-[1.15rem] leading-[1.5] mb-2 ${isDarkMode ? 'text-[#EDEDED]' : 'text-[#232323]'}`}>
                            {state.message}
                        </p>
                        {state.subtext && (
                            <p className={`font-sans text-sm mb-6 leading-relaxed ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                {state.subtext}
                            </p>
                        )}
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={state.onCancel}
                                className={`${UI.label} px-5 py-2.5 rounded-full border transition-colors ${isDarkMode ? 'border-white/10 text-zinc-400 hover:text-white hover:border-white/20' : 'border-black/10 text-zinc-500 hover:text-black hover:border-black/20'}`}
                            >
                                {state.cancelLabel}
                            </button>
                            <button
                                onClick={state.onConfirm}
                                className={`${UI.label} px-5 py-2.5 rounded-full hover:opacity-80 transition-opacity ${isDarkMode ? 'bg-white text-[#1A1A1A]' : 'bg-[#1A1A1A] text-white'}`}
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
