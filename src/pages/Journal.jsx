import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, addDoc, onSnapshot, query, serverTimestamp, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { db, appId } from '../services/firebase';
import { UI, STATIC_BLOGS } from '../utils/constants';
import { Plus, X, Clock, ArrowRight, Trash2, Edit2, Database, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useGlobalContent } from '../contexts/GlobalContentContext';

export default function Journal({ isAdmin, isDarkMode }) {
  const { content } = useGlobalContent();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we arrived here with edit data from BlogPost
  const incomingEdit = location.state?.editBlog;

  const [subView, setSubView] = useState(() => (incomingEdit && isAdmin) ? 'write' : 'archive');
  const [blogs, setBlogs] = useState([]);

  // Writing State — initialize from incoming edit if present
  const [newBlog, setNewBlog] = useState(() =>
    (incomingEdit && isAdmin)
      ? { title: incomingEdit.title || '', excerpt: incomingEdit.excerpt || '', content: incomingEdit.content || '' }
      : { title: '', excerpt: '', content: '' }
  );
  const [editingId, setEditingId] = useState(() => (incomingEdit && isAdmin) ? incomingEdit.id : null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  // Clear navigation state after consuming it (prevents re-editing on refresh)
  useEffect(() => {
    if (incomingEdit && isAdmin) {
      window.history.replaceState({}, '');
    }
  }, []);

  // Sync Data
  const [blogsLoaded, setBlogsLoaded] = useState(false);
  useEffect(() => {
    if (!db) { setBlogsLoaded(true); return; }
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
      setBlogsLoaded(true);
    });
    return () => unsubscribe();
  }, []);

  const themeColors = {
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
      };

      if (editingId && !editingId.startsWith('s')) {
        // Existing Firestore blog — update in place
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'blogs', editingId), { ...blogData, updatedAt: serverTimestamp() });
      } else {
        // New blog OR editing a static blog (which doesn't exist in Firestore) — create new
        blogData.date = new Date().toLocaleDateString('en-GB', { month: '2-digit', year: 'numeric' }).replace('/', ' · ');
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

  const startEditing = (blog) => {
    setNewBlog({ title: blog.title, excerpt: blog.excerpt, content: blog.content });
    setEditingId(blog.id);
    setSubView('write');
  };

  // --- RENDERING ---

  return (
    <div className="relative w-full">
      {/* WRITING VIEW (admin only) */}
      {subView === 'write' && isAdmin ? (
        <div className="max-w-[720px] mx-auto animate-in slide-in-from-bottom-8 md:py-12">
          <div className="flex justify-between items-center mb-16">
            <span className={`${UI.mono} text-zinc-400`}>{editingId ? 'EDITING ENTRY' : 'NEW ENTRY'}</span>
            <button onClick={() => setSubView('archive')} className={`${UI.mono} ${UI.linkHover} text-zinc-400`}>CANCEL</button>
          </div>
          <form onSubmit={handleSaveBlog} className="space-y-12">
            <input type="text" placeholder="Title..." value={newBlog.title} onChange={e => setNewBlog({ ...newBlog, title: e.target.value })} className={`w-full text-4xl md:text-[3.2rem] ${UI.serif} leading-[1.15] tracking-tight bg-transparent focus:bg-transparent border-none outline-none placeholder:opacity-20 ${themeColors.textMain}`} />
            <textarea placeholder="Excerpt..." value={newBlog.excerpt} onChange={e => setNewBlog({ ...newBlog, excerpt: e.target.value })} className={`w-full p-0 bg-transparent focus:bg-transparent text-[1.1rem] ${UI.sans} outline-none resize-none h-24 ${themeColors.textSub} transition-all`} />
            <div className="relative">
              <div className={`absolute -top-6 right-0 font-mono text-[10px] text-zinc-400 p-1.5 opacity-60 pointer-events-none`}>
                TIP: Start lines with "## " for headings or "&gt; " for quotes
              </div>
              <textarea placeholder="Write your thoughts..." value={newBlog.content} onChange={e => setNewBlog({ ...newBlog, content: e.target.value })} className={`w-full p-0 bg-transparent focus:bg-transparent text-[1.25rem] md:text-[1.35rem] font-serif leading-[1.8] tracking-[-0.01em] outline-none h-[60vh] resize-none overflow-y-auto ${themeColors.textMain} custom-scrollbar`} />
            </div>
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

          {/* BLOG LIST — clicking navigates to /post/:id */}
          <section className="pb-8 mt-8 md:mt-12">
            {!blogsLoaded ? (
              <div className="flex flex-col gap-4 animate-pulse">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-black/[0.03] dark:bg-white/[0.03] rounded-xl" />)}
              </div>
            ) : (
              <div className={`flex flex-col glass-texture border border-black/5 dark:border-white/10 rounded-2xl p-4 md:p-6 shadow-sm`}>
                {displayBlogs.map((blog, idx) => (
                  <div
                    key={blog.id}
                    onClick={() => navigate(`/post/${blog.id}`)}
                    className={`group flex flex-col items-start gap-1.5 cursor-pointer py-4 px-2 md:px-4 rounded-xl transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02] ${idx !== displayBlogs.length - 1 ? 'border-b border-black/[0.04] dark:border-white/[0.04] pb-8 mb-4' : ''}`}
                  >
                    <h4 className={`font-serif md:text-[1.5rem] text-[1.3rem] leading-tight ${themeColors.textMain} group-hover:opacity-60 transition-opacity`}>{blog.title}</h4>
                    {blog.excerpt && <p className={`font-sans text-[1rem] ${themeColors.textSub} line-clamp-2 mt-1 mb-2 leading-relaxed`}>{blog.excerpt}</p>}
                    <div className="flex items-center gap-3 font-sans text-sm text-zinc-500 mt-1">
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
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}