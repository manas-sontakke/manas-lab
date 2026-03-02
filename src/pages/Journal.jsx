import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, serverTimestamp, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { db, appId } from '../services/firebase';
import { UI, STATIC_BLOGS } from '../utils/constants';
import { Plus, X, Clock, ArrowRight, Trash2, Edit2, Database, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function Journal({ isAdmin, isDarkMode }) {
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

  const themeColors = {
    card: 'bg-transparent',
    textMain: isDarkMode ? 'text-zinc-100' : 'text-zinc-900',
    textSub: isDarkMode ? 'text-zinc-400' : 'text-zinc-500',
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
    } catch (err) { setStatusMsg('error'); } finally { setIsSubmitting(false); }
  };

  const deleteDocItem = async (id) => {
    if (!db || !isAdmin) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'blogs', id));
      if (selectedBlog?.id === id) setSelectedBlog(null);
    } catch (err) { console.error(err); }
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

  // 1. READING MODAL
  if (selectedBlog) {
    return (
      <div className="fixed inset-0 z-[150] flex flex-col p-0 md:p-12 backdrop-blur-sm bg-white/95 dark:bg-[#111111]/95 animate-in fade-in duration-300">
        <div className={`w-full h-full md:max-w-[720px] mx-auto overflow-y-auto ${themeColors.card} relative outline-none z-20 custom-scrollbar`}>
          <button onClick={() => setSelectedBlog(null)} className={`fixed top-6 right-6 md:absolute md:top-8 md:-right-16 p-3 rounded-full hover:rotate-90 transition-all z-50 ${isDarkMode ? 'bg-white text-black' : 'bg-[#1A1A1A] text-white'}`}><X className="w-4 h-4" /></button>
          <div className="p-8 md:px-0 md:py-24 max-w-2xl mx-auto">
            <div className={`mb-16 pb-8 flex items-center justify-between`}>
              <div className="flex items-center gap-6 text-zinc-400"><span className={UI.mono}>{selectedBlog.date}</span><span className={UI.mono}>{selectedBlog.readTime}</span></div>
              {isAdmin && typeof selectedBlog.id === 'string' && !selectedBlog.id.startsWith('s') && (
                <div className="flex gap-6"><button onClick={() => { startEditing(selectedBlog); setSelectedBlog(null); }} className={`${UI.mono} text-zinc-400 hover:text-black dark:hover:text-white transition-colors`}>EDIT</button><button onClick={() => deleteDocItem(selectedBlog.id)} className={`${UI.mono} text-red-500 hover:text-red-700 transition-colors`}>DELETE</button></div>
              )}
            </div>
            <h1 className={`${UI.heading} text-4xl md:text-[3.5rem] mb-12 leading-[1.1] tracking-tight ${themeColors.textMain}`}>{selectedBlog.title}</h1>
            <div className={`${UI.serif} text-[1.15rem] space-y-8 ${themeColors.textMain} leading-[1.8]`}>
              {selectedBlog.content ? selectedBlog.content.split('\n').map((p, i) => <p key={i} className="mb-6">{p}</p>) : <p>No content.</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. WRITING VIEW
  if (subView === 'write' && isAdmin) {
    return (
      <div className="max-w-[720px] mx-auto animate-in slide-in-from-bottom-8 md:py-12">
        <div className="flex justify-between items-center mb-16">
          <span className={`${UI.mono} text-zinc-400`}>{editingId ? 'EDITING ENTRY' : 'NEW ENTRY'}</span>
          <button onClick={() => setSubView('archive')} className={`${UI.mono} ${UI.linkHover} text-zinc-400`}>CANCEL</button>
        </div>
        <form onSubmit={handleSaveBlog} className="space-y-12">
          <input type="text" placeholder="Title..." value={newBlog.title} onChange={e => setNewBlog({ ...newBlog, title: e.target.value })} className={`w-full text-4xl md:text-[3.5rem] ${UI.heading} tracking-tight bg-transparent border-none outline-none placeholder:opacity-20 ${themeColors.textMain}`} />
          <textarea placeholder="Excerpt..." value={newBlog.excerpt} onChange={e => setNewBlog({ ...newBlog, excerpt: e.target.value })} className={`w-full p-0 bg-transparent text-lg ${UI.sans} outline-none resize-none h-24 ${themeColors.textSub} transition-all`} />
          <textarea placeholder="Write..." value={newBlog.content} onChange={e => setNewBlog({ ...newBlog, content: e.target.value })} className={`w-full p-0 bg-transparent text-[1.15rem] font-serif leading-[1.8] outline-none h-[60vh] resize-none ${themeColors.textMain} custom-scrollbar`} />
          <div className="flex justify-end border-t border-black/10 dark:border-white/10 pt-8">
            <button disabled={isSubmitting} className={`px-8 py-3 bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] ${UI.label} hover:opacity-80 transition-opacity`}>
              {statusMsg === 'syncing' ? 'SYNCING...' : statusMsg === 'success' ? 'PUBLISHED' : 'PUBLISH'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // 3. ARCHIVE VIEW
  return (
    <div className="animate-in fade-in duration-700 w-full">
      <header className={`mb-16 flex justify-between items-end gap-8`}>
        <div className="max-w-xl">
          <h1 className={`${UI.serif} text-[1.35rem] md:text-[1.5rem] leading-[1.65] ${themeColors.textMain}`}>
            Hey, I'm Manas. My friends also call me Sontakke. I write about architecture, learning, and the systems I've built.
          </h1>
        </div>
        {isAdmin && (
          <div className="flex gap-4">
            <button onClick={() => { setNewBlog({ title: '', excerpt: '', content: '' }); setEditingId(null); setSubView('write'); }} className={`flex items-center gap-2 ${UI.label} px-4 py-2 bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] hover:opacity-80 transition-opacity rounded-full`}><Plus className="w-4 h-4" /> New</button>
          </div>
        )}
      </header>

      <div className="space-y-16">
        {/* LATEST POST */}
        {displayBlogs.length > 0 && (
          <section>
            <h3 className={`font-sans font-medium text-zinc-400 mb-4 uppercase tracking-[0.1em] text-[10px]`}>LATEST</h3>
            <div onClick={() => setSelectedBlog(displayBlogs[0])} className={`cursor-pointer group flex flex-col bg-white dark:bg-[#111111] border border-black/5 dark:border-white/5 rounded-xl p-8 shadow-sm transition-all hover:-translate-y-0.5`}>
              <h2 className={`font-sans font-medium text-xl md:text-[1.4rem] leading-[1.3] mb-3 ${themeColors.textMain}`}>{displayBlogs[0].title}</h2>
              <div className="flex items-center gap-2 text-zinc-500 text-xs md:text-sm mb-6 pb-2">
                <span>{displayBlogs[0].date}</span>
                <span className="opacity-50">·</span>
                <span>{displayBlogs[0].readTime || "4 min read"}</span>
              </div>
              <div className={`flex items-center gap-1 text-[#7852FF] dark:text-[#A898FF] text-sm font-medium`}>
                Keep reading <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </section>
        )}

        {/* LIST */}
        <section className="pb-16">
          <h3 className={`font-sans font-medium text-zinc-400 mb-4 uppercase tracking-[0.1em] text-[10px]`}>ESSAYS</h3>
          <div className={`flex flex-col bg-white dark:bg-[#111111] border border-black/5 dark:border-white/5 rounded-xl p-2 md:p-4 shadow-sm`}>
            {displayBlogs.map((blog, idx) => (
              <div key={blog.id} onClick={() => setSelectedBlog(blog)} className={`group py-4 px-4 flex flex-row items-baseline gap-6 md:gap-8 cursor-pointer transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02] rounded-lg ${idx !== displayBlogs.length - 1 ? 'border-b border-black/[0.04] dark:border-white/[0.04] pb-5 mb-1' : ''}`}>
                <span className={`font-sans text-zinc-400 text-sm md:text-[0.95rem] w-16 md:w-20 shrink-0`}>{blog.date}</span>
                <h4 className={`font-sans text-[0.95rem] md:text-[1rem] ${themeColors.textMain}`}>{blog.title}</h4>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}