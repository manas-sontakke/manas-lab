import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, serverTimestamp, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { db, appId } from '../services/firebase';
import { UI, STATIC_BLOGS } from '../utils/constants';
import { Plus, X, Clock, ArrowRight, Trash2, Edit2, Database, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useGlobalContent } from '../contexts/GlobalContentContext';

export default function Journal({ isAdmin, isDarkMode }) {
  const { content } = useGlobalContent();
  const [subView, setSubView] = useState('archive');
  const [blogs, setBlogs] = useState([]);
  const [selectedBlog, setSelectedBlog] = useState(null);

  // Writing State
  const [newBlog, setNewBlog] = useState({ title: '', excerpt: '', content: '' });
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  // Sync Data
  useEffect(() => {
    if (!db) return;
    const blogsRef = collection(db, 'artifacts', appId, 'public', 'data', 'blogs');
    const unsubscribe = onSnapshot(query(blogsRef), (snap) => {
      const docs = snap.docs.map(d => {
        const data = d.data();
        let dateStr = "Recent";
        if (data.date) dateStr = data.date;
        else if (data.createdAt?.toDate) dateStr = data.createdAt.toDate().toLocaleDateString('en-GB');
        return { id: d.id, ...data, date: dateStr };
      });
      setBlogs(docs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    });
    return () => unsubscribe();
  }, []);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (selectedBlog) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [selectedBlog]);

  const themeColors = {
    modalBg: isDarkMode ? 'bg-[#1E1E1E]' : 'bg-[#F4F1EA]',
    textMain: isDarkMode ? 'text-[#EDEDED]' : 'text-[#232323]',
    textSub: isDarkMode ? 'text-zinc-500' : 'text-[#5A5A5A]',
    border: isDarkMode ? 'border-white/10' : 'border-black/10'
  };

  const displayBlogs = [...blogs, ...STATIC_BLOGS];

  // Actions
  const handleSaveBlog = async (e) => {
    e.preventDefault();
    if (!db) { setStatusMsg('no-db'); return; }
    if (!newBlog.title.trim()) { setStatusMsg('missing-fields'); return; }

    setIsSubmitting(true);
    setStatusMsg('syncing');

    try {
      const blogData = {
        ...newBlog,
        readTime: `${Math.max(1, Math.ceil(newBlog.content.split(' ').length / 200))} MIN`,
        date: new Date().toLocaleDateString('en-GB', { month: '2-digit', year: 'numeric' }).replace('/', ' · '),
      };

      if (editingId) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'blogs', editingId), { ...blogData, updatedAt: serverTimestamp() });
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'blogs'), { ...blogData, createdAt: serverTimestamp() });
      }
      setNewBlog({ title: '', excerpt: '', content: '' });
      setEditingId(null);
      setStatusMsg('success');
      setTimeout(() => { setStatusMsg(null); setSubView('archive'); }, 1500);
    } catch (err) {
      console.error("[Journal] Error saving blog entry:", err);
      setStatusMsg('error');
    } finally { setIsSubmitting(false); }
  };

  const deleteDocItem = async (id) => {
    if (!db || !isAdmin) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'blogs', id));
      if (selectedBlog?.id === id) setSelectedBlog(null);
    } catch (err) {
      console.error("[Journal] Error deleting blog entry:", err);
    }
  };

  const startEditing = (blog) => {
    setNewBlog({ title: blog.title, excerpt: blog.excerpt, content: blog.content });
    setEditingId(blog.id);
    setSubView('write');
  };

  const seedSampleBlog = async () => {
    if (!db) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'blogs'), {
        title: "The Architecture of a Digital Garden",
        excerpt: "Exploring the boundary where high-performance engineering meets curated thought design.",
        content: "At IIT Kanpur, the pace is relentless...",
        createdAt: serverTimestamp(),
        date: "04 · 2026",
        readTime: "3 MIN"
      });
    } catch (e) { console.error(e); }
  };

  // --- RENDERING ---

  return (
    <div className="relative w-full">
      {/* 1. READING MODAL (Floating Overlay) */}
      {selectedBlog && (
        <div className="fixed inset-0 z-[200] bg-[#F4F1EA] dark:bg-[#151515] overflow-y-auto animate-in fade-in slide-in-from-bottom-8 duration-500 custom-scrollbar">
          <div className="w-full max-w-[760px] mx-auto px-6 md:px-12 py-24 md:py-32 relative min-h-screen flex flex-col">
            <button onClick={() => setSelectedBlog(null)} className={`fixed top-6 right-6 md:top-12 md:right-12 p-3 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors z-[60] text-zinc-400 hover:text-black dark:hover:text-white`}>
              <X className="w-6 h-6 md:w-8 md:h-8" />
            </button>

            <h1 className={`${UI.serif} text-4xl md:text-[3.2rem] mb-6 mt-4 leading-[1.15] tracking-tight ${themeColors.textMain}`}>
              {selectedBlog.title}
            </h1>

            <div className={`mb-12 pb-8 flex items-center justify-between border-b border-black/5 dark:border-white/5`}>
              <div className="flex items-center gap-4 text-zinc-500 text-[0.9rem] font-sans">
                <span>{selectedBlog.date}</span>
                <span>·</span>
                <span>{selectedBlog.readTime}</span>
              </div>
              {isAdmin && typeof selectedBlog.id === 'string' && !selectedBlog.id.startsWith('s') && (
                <div className="flex gap-4">
                  <button onClick={() => { startEditing(selectedBlog); setSelectedBlog(null); }} className={`font-sans text-[0.85rem] text-zinc-400 hover:text-black dark:hover:text-white transition-colors`}>Edit</button>
                  <button onClick={() => deleteDocItem(selectedBlog.id)} className={`font-sans text-[0.85rem] text-red-500 hover:text-red-700 transition-colors`}>Delete</button>
                </div>
              )}
            </div>

            <div className={`${UI.serif} text-[1.2rem] md:text-[1.35rem] space-y-8 ${themeColors.textMain} leading-[1.75] tracking-[-0.01em] pb-32 flex-grow`}>
              {selectedBlog.content ? selectedBlog.content.split('\n').map((p, i) => p.trim() !== '' ? <p key={i}>{p}</p> : null) : <p>No content.</p>}
            </div>
          </div>
        </div>
      )}

      {/* 2. WRITING VIEW */}
      {subView === 'write' && isAdmin ? (
        <div className="max-w-[720px] mx-auto animate-in slide-in-from-bottom-8 md:py-12">
          <div className="flex justify-between items-center mb-16">
            <span className={`${UI.mono} text-zinc-400`}>{editingId ? 'EDITING ENTRY' : 'NEW ENTRY'}</span>
            <button onClick={() => setSubView('archive')} className={`${UI.mono} ${UI.linkHover} text-zinc-400`}>CANCEL</button>
          </div>
          <form onSubmit={handleSaveBlog} className="space-y-12">
            <input type="text" placeholder="Title..." value={newBlog.title} onChange={e => setNewBlog({ ...newBlog, title: e.target.value })} className={`w-full text-4xl md:text-[3.2rem] ${UI.serif} leading-[1.15] tracking-tight bg-transparent focus:bg-transparent border-none outline-none placeholder:opacity-20 ${themeColors.textMain}`} />
            <textarea placeholder="Excerpt..." value={newBlog.excerpt} onChange={e => setNewBlog({ ...newBlog, excerpt: e.target.value })} className={`w-full p-0 bg-transparent focus:bg-transparent text-[1.1rem] ${UI.sans} outline-none resize-none h-24 ${themeColors.textSub} transition-all`} />
            <textarea placeholder="Write your thoughts..." value={newBlog.content} onChange={e => setNewBlog({ ...newBlog, content: e.target.value })} className={`w-full p-0 bg-transparent focus:bg-transparent text-[1.25rem] md:text-[1.35rem] font-serif leading-[1.8] tracking-[-0.01em] outline-none h-[60vh] resize-none ${themeColors.textMain} custom-scrollbar`} />
            <div className={`flex justify-end border-t ${themeColors.border} pt-8`}>
              <button disabled={isSubmitting} className={`px-8 py-3 bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] ${UI.label} hover:opacity-80 transition-opacity rounded-full`}>
                {statusMsg === 'syncing' ? 'Publishing...' : statusMsg === 'success' ? 'Published' : 'Publish Entry'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="animate-in fade-in duration-700 w-full mb-12">
          <header className={`mb-8 flex justify-between items-end gap-8`}>
            <div className="max-w-xl">
              <h1 className={`${UI.serif} text-[1.35rem] md:text-[1.5rem] leading-[1.65] ${themeColors.textMain} whitespace-pre-wrap`}>
                {content?.journalIntro || "Welcome to my digital garden."}
              </h1>
            </div>
            {isAdmin && (
              <div className="flex gap-4">
                <button onClick={() => { setNewBlog({ title: '', excerpt: '', content: '' }); setEditingId(null); setSubView('write'); }} className={`flex items-center gap-2 ${UI.label} px-4 py-2 bg-[#1A1A1A] dark:bg-white/10 text-white dark:text-zinc-200 hover:opacity-80 transition-opacity rounded-full`}><Plus className="w-4 h-4" /> New</button>
              </div>
            )}
          </header>

          {/* LIST */}
          <section className="pb-8 mt-8 md:mt-12">
            <div className={`flex flex-col glass-texture border border-black/5 dark:border-white/10 rounded-2xl p-4 md:p-6 shadow-sm`}>
              {displayBlogs.map((blog, idx) => (
                <div key={blog.id} onClick={() => setSelectedBlog(blog)} className={`group py-5 px-4 md:px-6 flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-8 cursor-pointer transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02] rounded-xl ${idx !== displayBlogs.length - 1 ? 'border-b border-black/[0.04] dark:border-white/[0.04] pb-6 mb-2' : ''}`}>
                  <span className={`font-sans text-zinc-400 text-sm md:text-[0.95rem] w-24 shrink-0`}>{blog.date}</span>
                  <h4 className={`font-sans font-medium text-[1rem] md:text-[1.1rem] leading-[1.4] ${themeColors.textMain}`}>{blog.title}</h4>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}