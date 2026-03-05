import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth, appId } from '../services/firebase';

const GlobalContentContext = createContext();

const defaultContent = {
    journalIntro: "Hey, I'm Manas. My friends also call me Sontakke. I write about architecture, learning, and the systems I've built.",
    profileBio: "A student at IIT Kanpur. \nPlaying around with systems, code, and digital spaces.",
    experienceLabel: "EXPERIENCE",
    projectsLabel: "PROJECTS",
    profileFooterNote: "For professional links and socials, scroll down to the footer ↓",
    footerText: "This digital space is built using React, structured with Tailwind, and synced via Firebase. Deployed gracefully on Vercel.",
    experience: [
        { id: '1', years: '2022 — 2026', title: 'IIT Kanpur', description: 'B.S in Mathematics and Scientific Computing.' },
        { id: '2', years: '2024', title: 'Startups & Ventures', description: 'Building products in the 0-1 phase.' }
    ],
    projects: [
        { id: '1', title: 'Merge Optimization', description: 'A side project experimenting with array logic and space efficiency.' },
        { id: '2', title: 'Personal Archive', description: 'A simple space for writing and keeping track of things.' }
    ],
    socials: [
        { id: '1', platform: 'GITHUB', url: 'https://github.com/manas-sontakke' },
        { id: '2', platform: 'LINKEDIN', url: 'https://linkedin.com/in/manassontakke' },
        { id: '3', platform: 'TWITTER', url: 'https://twitter.com/manassontakke' },
        { id: '4', platform: 'INSTAGRAM', url: 'https://instagram.com/manassontakke' }
    ]
};

export function GlobalContentProvider({ children }) {
    const [content, setContent] = useState(defaultContent);
    const [loading, setLoading] = useState(true);
    const [authReady, setAuthReady] = useState(false);

    // Wait for Firebase auth to resolve to a real user before Firestore reads
    useEffect(() => {
        if (!auth) { setAuthReady(true); setLoading(false); return; }
        const unsub = onAuthStateChanged(auth, (user) => {
            // Only ready when we have an actual user (anonymous or Google-signed)
            if (user) setAuthReady(true);
        });
        // Timeout: if auth never resolves (ad blocker, etc.), proceed with defaults
        const timer = setTimeout(() => {
            if (!authReady) {
                console.warn('[GlobalContent] Auth timeout — proceeding with defaults');
                setAuthReady(true);
                setLoading(false);
            }
        }, 4000);
        return () => { unsub(); clearTimeout(timer); };
    }, []);

    // Only connect to Firestore AFTER auth is ready
    useEffect(() => {
        if (!authReady || !db) {
            if (authReady) setLoading(false);
            return;
        }
        const settingsRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'main');

        const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
            if (docSnap.exists()) {
                setContent({ ...defaultContent, ...docSnap.data() });
            } else {
                setDoc(settingsRef, { ...defaultContent, createdAt: serverTimestamp() }).catch(console.error);
            }
            setLoading(false);
        }, (error) => {
            console.error("[GlobalContent] Firestore error:", error);
            // Fall back to defaults instead of hanging forever
            setLoading(false);
        });

        return () => unsubscribe();
    }, [authReady]);

    const loadingLines = [
        "brewing some thoughts...",
        "untangling digital knots...",
        "aligning the pixels...",
        "waking up the garden...",
        "connecting the constellations...",
    ];

    const [loadingLine] = useState(() => loadingLines[Math.floor(Math.random() * loadingLines.length)]);

    return (
        <GlobalContentContext.Provider value={{ content, loading, authReady }}>
            {loading ? (
                <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F1EA] dark:bg-[#151515] transition-opacity duration-500">
                    <div className="flex flex-col items-center gap-6 animate-in fade-in duration-700">
                        <div className="w-5 h-5 border-2 border-black/15 dark:border-white/15 border-t-black/60 dark:border-t-white/60 rounded-full animate-spin" />
                        <p className="font-serif text-sm text-black/40 dark:text-white/40 tracking-wide italic">
                            {loadingLine}
                        </p>
                    </div>
                </div>
            ) : children}
        </GlobalContentContext.Provider>
    );
}

export const useGlobalContent = () => useContext(GlobalContentContext);
