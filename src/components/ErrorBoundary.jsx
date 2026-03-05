import React from 'react';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('[ErrorBoundary] Caught:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F1EA] dark:bg-[#151515] px-6">
                    <div className="flex flex-col items-center gap-4 text-center max-w-md">
                        <p className="font-serif text-[1.3rem] text-[#232323] dark:text-[#EDEDED] leading-relaxed">
                            Something went sideways.
                        </p>
                        <p className="font-sans text-sm text-[#666] dark:text-[#888] leading-relaxed">
                            The page ran into an unexpected issue. A quick refresh usually sorts things out.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 font-sans text-sm font-medium tracking-wide uppercase px-6 py-2.5 rounded-full bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] hover:opacity-80 transition-opacity"
                        >
                            Refresh page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
