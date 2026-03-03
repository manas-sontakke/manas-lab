import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '../services/firebase';

const GlobalContentContext = createContext();

const defaultContent = {
    journalIntro: "Hey, I'm Manas. My friends also call me Sontakke. I write about architecture, learning, and the systems I've built.",
    profileBio: "A student at IIT Kanpur. \nPlaying around with systems, code, and digital spaces.",
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

    useEffect(() => {
        if (!db) return;
        const settingsRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'main');

        const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
            if (docSnap.exists()) {
                setContent({ ...defaultContent, ...docSnap.data() });
            } else {
                // Initialize doc if it doesn't exist
                setDoc(settingsRef, { ...defaultContent, createdAt: serverTimestamp() }).catch(console.error);
            }
            setLoading(false);
        }, (error) => {
            console.error("[GlobalContent] Error fetching settings:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <GlobalContentContext.Provider value={{ content, loading }}>
            {children}
        </GlobalContentContext.Provider>
    );
}

export const useGlobalContent = () => useContext(GlobalContentContext);
