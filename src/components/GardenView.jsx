import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, serverTimestamp, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { db, appId } from '../firebase';
import { UI, STATIC_BLOGS } from '../constants';
import { Plus, X, Clock, ArrowRight, Trash2, Edit2, Database, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function GardenView({ isAdmin, isDarkMode }) {
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
    // Specific warm cream for light mode
    card: isDarkMode ? 'bg-zinc-900/40 border-white/5 shadow-2xl' : 'bg-[#FFFFFF] border-[#E6E4DC] shadow-sm',
    textMain: isDarkMode ? 'text-zinc-200' : 'text-[#1A1A1A]',
    textSub: isDarkMode ? 'text-zinc-500' : 'text-[#555555]',
    border: isDarkMode ? 'border-white/5' : 'border-[#E6E4DC]'
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
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-0 md:p-8 backdrop-blur-xl bg-white/60 dark:bg-black/80 animate-in fade-in duration-300">
         <div className="absolute inset-0" onClick={() => setSelectedBlog(null)} />
         <div className={`w-full h-full md:max-w-3xl md:h-[90vh] overflow-y-auto ${themeColors.card} md:rounded-[2.5rem] shadow-2xl relative outline-none border-2 ${themeColors.border} z-20 custom-scrollbar`}>
            <button onClick={() => setSelectedBlog(null)} className={`fixed top-6 right-6 md:absolute md:top-8 md:right-8 p-3 rounded-full hover:rotate-90 transition-all z-50 ${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'} shadow-lg`}><X className="w-5 h-5" /></button>
            <div className="p-8 md:p-20 max-w-2xl mx-auto">
              <div className={`mb-16 border-b ${themeColors.border} pb-8 flex items-center justify-between`}>
                 <div className="flex items-center gap-6"><span className={UI.mono}>{selectedBlog.date}</span><span className={UI.mono}>{selectedBlog.readTime}</span></div>
                 {isAdmin && typeof selectedBlog.id === 'string' && !selectedBlog.id.startsWith('s') && (
                   <div className="flex gap-4"><button onClick={() => { startEditing(selectedBlog); setSelectedBlog(null); }} className={`${UI.mono} hover:underline`}>EDIT</button><button onClick={() => deleteDocItem(selectedBlog.id)} className={`${UI.mono} text-red-500 hover:underline`}>DELETE</button></div>
                 )}
              </div>
              <h1 className={`${UI.heading} text-5xl md:text-7xl mb-16 leading-[0.9] ${themeColors.textMain}`}>{selectedBlog.title}</h1>
              <div className={`${UI.serif} text-lg md:text-xl space-y-8 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'} leading-relaxed`}>
                 {selectedBlog.content ? selectedBlog.content.split('\n').map((p, i) => <p key={i} className="mb-4">{p}</p>) : <p>No content.</p>}
              </div>
            </div>
         </div>
      </div>
    );
  }

  // 2. WRITING VIEW
  if (subView === 'write' && isAdmin) {
    return (
      <div className="max-w-3xl mx-auto animate-in slide-in-from-bottom-8">
         <div className="flex justify-between items-center mb-12">
           <span className={`${UI.mono} text-zinc-400`}>{editingId ? 'EDITING ENTRY' : 'NEW ENTRY'}</span>
           <button onClick={() => setSubView('archive')} className={`${UI.mono} hover:underline text-red-500`}>CANCEL</button>
         </div>
         <form onSubmit={handleSaveBlog} className="space-y-8">
            <input type="text" placeholder="Title..." value={newBlog.title} onChange={e => setNewBlog({...newBlog, title: e.target.value})} className={`w-full text-5xl md:text-7xl ${UI.heading} bg-transparent border-none outline-none placeholder:opacity-20 ${themeColors.textMain}`} />
            <textarea placeholder="Excerpt..." value={newBlog.excerpt} onChange={e => setNewBlog({...newBlog, excerpt: e.target.value})} className={`w-full p-0 bg-transparent text-xl font-medium outline-none resize-none h-24 border-b ${themeColors.border} transition-all`} />
            <textarea placeholder="Write..." value={newBlog.content} onChange={e => setNewBlog({...newBlog, content: e.target.value})} className={`w-full p-0 bg-transparent text-lg font-serif leading-relaxed outline-none h-[600px] resize-none ${themeColors.textMain}`} />
            <button disabled={isSubmitting} className={`px-8 py-4 bg-black dark:bg-white text-white dark:text-black ${UI.label} rounded-lg hover:opacity-90 w-full`}>
              {statusMsg === 'syncing' ? 'SYNCING...' : statusMsg === 'success' ? 'PUBLISHED' : 'PUBLISH'}
            </button>
         </form>
      </div>
    );
  }

  // 3. ARCHIVE VIEW
  return (
    <div className="animate-in fade-in duration-700">
      <header className={`mb-24 flex justify-between items-end border-b ${themeColors.border} pb-10`}>
        <div className="max-w-2xl">
           <h1 className={`${UI.heading} text-6xl md:text-8xl mb-6 ${themeColors.textMain}`}>The Garden.</h1>
           <p className={`${UI.serif} text-xl leading-relaxed opacity-60 font-medium`}>A collection of raw thoughts, logs, and artifacts from my time at IIT Kanpur.</p>
        </div>
        {isAdmin && (
          <div className="flex gap-4">
            <button onClick={seedSampleBlog} className={`flex items-center gap-2 ${UI.label} px-4 py-2 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-100 transition-all`}><Database className="w-3.5 h-3.5" /> Seed</button>
            <button onClick={() => { setNewBlog({ title: '', excerpt: '', content: '' }); setEditingId(null); setSubView('write'); }} className={`flex items-center gap-2 ${UI.label} px-4 py-2 rounded-lg bg-black text-white hover:opacity-80 transition-all`}><Plus className="w-4 h-4" /> New</button>
          </div>
        )}
      </header>

      <div className="space-y-24">
        {/* LATEST POST */}
        {displayBlogs.length > 0 && (
          <section>
             <h3 className={`${UI.mono} text-zinc-400 mb-6 uppercase`}>Latest</h3>
             <div onClick={() => setSelectedBlog(displayBlogs[0])} className={`${themeColors.card} p-10 md:p-12 rounded-[2.5rem] cursor-pointer group transition-all hover:shadow-md border`}>
                <h2 className={`${UI.heading} text-4xl md:text-6xl mb-6 ${themeColors.textMain} leading-[0.9]`}>{displayBlogs[0].title}</h2>
                <div className="flex items-center gap-4 text-zinc-400 mb-8">
                   <span className={UI.mono}>{displayBlogs[0].date}</span>
                   <span className="text-[8px]">•</span>
                   <span className={UI.mono}>{displayBlogs[0].readTime}</span>
                </div>
                <p className={`${themeColors.textSub} text-lg leading-relaxed mb-10 max-w-2xl`}>{displayBlogs[0].excerpt}</p>
                <div className={`flex items-center gap-2 text-emerald-600 ${UI.label} group-hover:gap-4 transition-all`}>
                   Read Entry <ArrowRight className="w-4 h-4" />
                </div>
             </div>
          </section>
        )}

        {/* LIST */}
        <section>
           <h3 className={`${UI.mono} text-zinc-400 mb-6 uppercase`}>Archive Index</h3>
           <div className={`grid grid-cols-1 gap-0 border-t ${themeColors.border}`}>
             {displayBlogs.slice(1).map(blog => (
               <div key={blog.id} onClick={() => setSelectedBlog(blog)} className={`group py-8 border-b ${themeColors.border} flex flex-col md:flex-row md:items-baseline justify-between cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors px-4 -mx-4 rounded-lg`}>
                  <div className="flex-1 flex gap-8 items-baseline">
                     <span className={`${UI.mono} opacity-50 w-24 shrink-0`}>{blog.date}</span>
                     <h4 className={`${UI.serif} text-2xl group-hover:underline decoration-1 underline-offset-4 tracking-tight ${themeColors.textMain}`}>{blog.title}</h4>
                  </div>
                  <ArrowRight className="hidden md:block w-4 h-4 opacity-0 group-hover:opacity-40 transition-opacity" />
               </div>
             ))}
           </div>
        </section>
      </div>
    </div>
  );
}