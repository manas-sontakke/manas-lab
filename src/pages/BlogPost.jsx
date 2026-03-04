import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db, appId } from '../services/firebase';
import { UI, STATIC_BLOGS } from '../utils/constants';
import { ArrowLeft, Clock, Trash2, Edit2, ArrowUp } from 'lucide-react';

export default function BlogPost({ isAdmin, isDarkMode, themeColors }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [readProgress, setReadProgress] = useState(0);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const contentRef = useRef(null);

    // Reading progress & scroll to top toggle
    useEffect(() => {
        const handleScroll = () => {
            const el = contentRef.current;
            if (!el) return;
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;
            setReadProgress(progress);
            setShowScrollTop(scrollTop > 400);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Fetch blog data — check static first, then Firestore
    useEffect(() => {
        const staticMatch = STATIC_BLOGS.find(b => b.id === id);
        if (staticMatch) {
            setBlog(staticMatch);
            setLoading(false);
            return;
        }

        if (!db) { setLoading(false); return; }

        const blogRef = doc(db, 'artifacts', appId, 'public', 'data', 'blogs', id);
        const unsubscribe = onSnapshot(blogRef, (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                let dateStr = "Recent";
                if (data.date) dateStr = data.date;
                else if (data.createdAt?.toDate) dateStr = data.createdAt.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                setBlog({ id: snap.id, ...data, date: dateStr });
            } else {
                setBlog(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [id]);

    const handleDelete = async () => {
        if (!db || !isAdmin) return;
        if (!window.confirm('Delete this post?')) return;
        try {
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'blogs', id));
            navigate('/');
        } catch (err) {
            console.error('[BlogPost] Delete error:', err);
        }
    };

    const handleEdit = () => {
        // Store blog in sessionStorage so Journal can pick it up to edit
        sessionStorage.setItem('editBlog', JSON.stringify(blog));
        navigate('/?edit=' + id);
    };

    if (loading) {
        return (
            <div className="w-full flex flex-col gap-6 animate-pulse pt-8">
                <div className="h-10 bg-black/5 dark:bg-white/5 rounded-xl w-3/4" />
                <div className="h-4 bg-black/5 dark:bg-white/5 rounded-xl w-1/3" />
                <div className="h-4 bg-black/5 dark:bg-white/5 rounded-xl w-full mt-8" />
                <div className="h-4 bg-black/5 dark:bg-white/5 rounded-xl w-full" />
                <div className="h-4 bg-black/5 dark:bg-white/5 rounded-xl w-5/6" />
            </div>
        );
    }

    if (!blog) {
        return (
            <div className="w-full flex flex-col items-center gap-6 pt-24 text-center">
                <p className={`${UI.serif} text-2xl ${themeColors?.textSub || 'text-zinc-500'}`}>Post not found.</p>
                <button onClick={() => navigate('/')} className={`${UI.label} text-zinc-400 hover:text-black dark:hover:text-white transition-colors flex items-center gap-2`}>
                    <ArrowLeft className="w-4 h-4" /> Back to feed
                </button>
            </div>
        );
    }

    // Parse paragraphs for Medium-style rendering
    const paragraphs = blog.content
        ? blog.content.split('\n')
        : ['No content yet.'];

    return (
        <>
            {/* Reading Progress Bar — fixed top of screen */}
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
                {/* Back link */}
                <button
                    onClick={() => navigate(-1)}
                    className={`flex items-center gap-2 ${UI.mono} text-zinc-400 hover:text-black dark:hover:text-white transition-colors mb-12 group`}
                >
                    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    ALL POSTS
                </button>

                {/* Title */}
                <h1 className={`font-serif text-[2.25rem] md:text-[2.75rem] leading-[1.18] tracking-[-0.02em] ${isDarkMode ? 'text-[#EDEDED]' : 'text-[#111111]'} mb-6`}>
                    {blog.title}
                </h1>

                {/* Byline */}
                <div className={`flex items-center justify-between mb-10 pb-8 border-b ${isDarkMode ? 'border-white/8' : 'border-black/8'}`}>
                    <div className="flex items-center gap-3 font-sans text-sm text-zinc-500">
                        <span>{blog.date}</span>
                        {blog.readTime && (
                            <>
                                <span className="text-zinc-300 dark:text-zinc-700">·</span>
                                <span className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    {blog.readTime}
                                </span>
                            </>
                        )}
                    </div>
                    {/* Admin controls */}
                    {isAdmin && !blog.id?.startsWith('s') && (
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleEdit}
                                className="flex items-center gap-1.5 font-sans text-sm text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
                            >
                                <Edit2 className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex items-center gap-1.5 font-sans text-sm text-red-400 hover:text-red-600 transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                        </div>
                    )}
                </div>

                {/* Excerpt — Medium style standfirst */}
                {blog.excerpt && (
                    <p className={`font-serif text-[1.2rem] md:text-[1.3rem] leading-[1.75] ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'} mb-10 italic`}>
                        {blog.excerpt}
                    </p>
                )}

                {/* Body — Medium-style reading experience */}
                <div className={`font-serif text-[1.15rem] md:text-[1.25rem] leading-[1.85] tracking-[-0.005em] ${isDarkMode ? 'text-[#DEDEDE]' : 'text-[#1A1A1A]'} space-y-7`}>
                    {paragraphs.map((para, i) => {
                        if (para.trim() === '') return <div key={i} className="h-4" aria-hidden="true" />;

                        // H2-style headings: lines starting with ## 
                        if (para.startsWith('## ')) {
                            return (
                                <h2 key={i} className={`font-sans font-semibold text-[1.4rem] md:text-[1.6rem] leading-[1.3] tracking-tight mt-12 mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                    {para.replace('## ', '')}
                                </h2>
                            );
                        }
                        // Bold lines starting with **text**
                        if (para.startsWith('**') && para.endsWith('**')) {
                            return (
                                <p key={i} className="font-sans font-semibold">
                                    {para.slice(2, -2)}
                                </p>
                            );
                        }
                        // Blockquotes starting with >
                        if (para.startsWith('> ')) {
                            return (
                                <blockquote key={i} className={`border-l-[3px] ${isDarkMode ? 'border-white/20' : 'border-black/15'} pl-5 italic ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'} text-[1.1rem] md:text-[1.2rem]`}>
                                    {para.replace('> ', '')}
                                </blockquote>
                            );
                        }
                        // Regular paragraph
                        return <p key={i}>{para}</p>;
                    })}
                </div>

                {/* Bottom nav */}
                <div className={`mt-20 pt-8 border-t ${isDarkMode ? 'border-white/8' : 'border-black/8'} flex justify-start`}>
                    <button
                        onClick={() => navigate('/')}
                        className={`${UI.label} text-zinc-400 hover:text-black dark:hover:text-white transition-colors flex items-center gap-2 group`}
                    >
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        Back to feed
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
