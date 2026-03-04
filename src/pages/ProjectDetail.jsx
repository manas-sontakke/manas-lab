import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db, appId } from '../services/firebase';
import { UI } from '../utils/constants';
import { ArrowLeft, Clock, ExternalLink, Github, ArrowUp } from 'lucide-react';
import { useGlobalContent } from '../contexts/GlobalContentContext';

export default function ProjectDetail({ isDarkMode, themeColors }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const { content } = useGlobalContent();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [readProgress, setReadProgress] = useState(0);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const contentRef = useRef(null);

    // Reading progress
    useEffect(() => {
        window.scrollTo(0, 0);
        const handleScroll = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            setReadProgress(docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0);
            setShowScrollTop(scrollTop > 400);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Find project from content or Firestore
    useEffect(() => {
        // Check in global content first (static projects)
        const staticMatch = (content?.projects || []).find(p =>
            p.id === id || p.id === String(id)
        );
        if (staticMatch) {
            setProject(staticMatch);
            setLoading(false);
            return;
        }

        // Try Firestore
        if (!db) { setLoading(false); return; }
        const projRef = doc(db, 'artifacts', appId, 'public', 'data', 'projects', id);
        const unsubscribe = onSnapshot(projRef, (snap) => {
            if (snap.exists()) {
                setProject({ id: snap.id, ...snap.data() });
            } else {
                setProject(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [id, content]);

    if (loading) {
        return (
            <div className="w-full flex flex-col gap-6 animate-pulse pt-8">
                <div className="h-8 bg-black/5 dark:bg-white/5 rounded-xl w-2/3" />
                <div className="h-4 bg-black/5 dark:bg-white/5 rounded-xl w-1/3" />
                <div className="h-4 bg-black/5 dark:bg-white/5 rounded-xl w-full mt-8" />
                <div className="h-4 bg-black/5 dark:bg-white/5 rounded-xl w-5/6" />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="w-full flex flex-col items-center gap-6 pt-24 text-center">
                <p className={`font-serif text-2xl text-zinc-500`}>Project not found.</p>
                <button onClick={() => navigate(-1)} className={`${UI.label} text-zinc-400 hover:text-black dark:hover:text-white transition-colors flex items-center gap-2`}>
                    <ArrowLeft className="w-4 h-4" /> Go back
                </button>
            </div>
        );
    }

    // Parse description for display
    const descriptionLines = project.longDescription
        ? project.longDescription.split('\n').filter(p => p.trim() !== '')
        : project.description
            ? [project.description]
            : ['No details yet.'];

    return (
        <>
            {/* Progress bar */}
            <div
                className="fixed top-0 left-0 right-0 z-[999] h-[2.5px] origin-left"
                style={{
                    background: isDarkMode
                        ? 'linear-gradient(to right, rgba(255,255,255,0.8), rgba(255,255,255,0.4))'
                        : 'linear-gradient(to right, rgba(0,0,0,0.7), rgba(0,0,0,0.3))',
                    width: `${readProgress}%`,
                    transition: 'width 0.1s linear',
                }}
            />

            <article ref={contentRef} className="w-full animate-in fade-in slide-in-from-bottom-3 duration-500 pb-24">
                {/* Back */}
                <button
                    onClick={() => navigate(-1)}
                    className={`flex items-center gap-2 ${UI.mono} text-zinc-400 hover:text-black dark:hover:text-white transition-colors mb-12 group`}
                >
                    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    PROJECTS
                </button>

                {/* Title */}
                <h1 className={`font-serif text-[2.25rem] md:text-[2.75rem] leading-[1.18] tracking-[-0.02em] ${isDarkMode ? 'text-[#EDEDED]' : 'text-[#111111]'} mb-4`}>
                    {project.title}
                </h1>

                {/* Subtitle / short description */}
                <p className={`font-serif text-[1.1rem] md:text-[1.2rem] leading-[1.7] ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'} mb-8 italic`}>
                    {project.description}
                </p>

                {/* Links */}
                {(project.githubUrl || project.liveUrl) && (
                    <div className={`flex items-center gap-6 mb-10 pb-8 border-b ${isDarkMode ? 'border-white/8' : 'border-black/8'}`}>
                        {project.githubUrl && (
                            <a href={project.githubUrl} target="_blank" rel="noreferrer"
                                className="flex items-center gap-2 font-sans text-sm text-zinc-500 hover:text-black dark:hover:text-white transition-colors">
                                <Github className="w-4 h-4" /> Source Code
                            </a>
                        )}
                        {project.liveUrl && (
                            <a href={project.liveUrl} target="_blank" rel="noreferrer"
                                className="flex items-center gap-2 font-sans text-sm text-zinc-500 hover:text-black dark:hover:text-white transition-colors">
                                <ExternalLink className="w-4 h-4" /> Live Demo
                            </a>
                        )}
                    </div>
                )}

                {/* Body */}
                <div className={`font-serif text-[1.15rem] md:text-[1.25rem] leading-[1.85] tracking-[-0.005em] ${isDarkMode ? 'text-[#DEDEDE]' : 'text-[#1A1A1A]'} space-y-7`}>
                    {descriptionLines.map((para, i) => {
                        if (para.startsWith('## ')) {
                            return <h2 key={i} className={`font-sans font-semibold text-[1.4rem] md:text-[1.6rem] leading-[1.3] tracking-tight mt-12 mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>{para.replace('## ', '')}</h2>;
                        }
                        if (para.startsWith('> ')) {
                            return <blockquote key={i} className={`border-l-[3px] ${isDarkMode ? 'border-white/20' : 'border-black/15'} pl-5 italic ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'} text-[1.1rem]`}>{para.replace('> ', '')}</blockquote>;
                        }
                        return <p key={i}>{para}</p>;
                    })}
                </div>

                {/* Bottom nav */}
                <div className={`mt-20 pt-8 border-t ${isDarkMode ? 'border-white/8' : 'border-black/8'} flex justify-start`}>
                    <button
                        onClick={() => navigate(-1)}
                        className={`${UI.label} text-zinc-400 hover:text-black dark:hover:text-white transition-colors flex items-center gap-2 group`}
                    >
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        Back to projects
                    </button>
                </div>
                {/* Back to top button */}
                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className={`fixed bottom-8 right-8 z-[900] p-3 rounded-full bg-black/5 dark:bg-white/10 backdrop-blur-md border border-black/10 dark:border-white/20 text-zinc-500 hover:text-black dark:text-zinc-300 dark:hover:text-white transition-all duration-300 ${showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'} group shadow-sm`}
                    aria-label="Scroll to top"
                >
                    <ArrowUp className="w-5 h-5 transition-transform group-hover:-translate-y-0.5" />
                </button>
            </article>
        </>
    );
}
