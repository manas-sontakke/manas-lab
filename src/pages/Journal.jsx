import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, getDocs, onSnapshot, query, orderBy, serverTimestamp, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { db, appId } from '../services/firebase';
import { UI } from '../utils/constants';
import { Plus, Clock, Archive, Eye, RefreshCcw } from 'lucide-react';
import { useGlobalContent } from '../contexts/GlobalContentContext';
import { useConfirm } from '../components/ConfirmModal';

export default function Journal({ isAdmin, isDarkMode, editBlogData, clearEditBlog, isDirtyRef }) {
  const { content, authReady } = useGlobalContent();
  const navigate = useNavigate();
  const confirm = useConfirm();

  // --- EDIT STATE (consumed from InnerApp prop) ---
  const consumed = useRef(false);

  const getInitialSubView = () => {
    if (editBlogData && isAdmin && !consumed.current) return 'write';
    return 'archive';
  };
  const getInitialBlog = () => {
    if (editBlogData && isAdmin && !consumed.current) {
      return { title: editBlogData.title || '', excerpt: editBlogData.excerpt || '', content: editBlogData.content || '' };
    }
    return { title: '', excerpt: '', content: '' };
  };
  const getInitialEditId = () => {
    if (editBlogData && isAdmin && !consumed.current) {
      consumed.current = true;
      return editBlogData.id;
    }
    return null;
  };

  const [subView, setSubView] = useState(getInitialSubView);
  const [newBlog, setNewBlog] = useState(getInitialBlog);
  const [editingId, setEditingId] = useState(getInitialEditId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  // Filter mode: 'public' (default), 'all', 'archived'
  const [filterMode, setFilterMode] = useState('public');

  // Clear parent edit state after consuming
  useEffect(() => {
    if (consumed.current && clearEditBlog) clearEditBlog();
  }, []);

  // Track unsaved changes — sync to both local ref (beforeunload) and global ref (tab switching)
  const isDirty = useRef(false);
  useEffect(() => {
    const dirty = subView === 'write' && (newBlog.title.trim() !== '' || newBlog.content.trim() !== '');
    isDirty.current = dirty;
    if (isDirtyRef) isDirtyRef.current = dirty;
  }, [newBlog, subView, isDirtyRef]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty.current) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const confirmDiscard = async () => {
    if (isDirty.current) {
      return await confirm({
        message: 'Discard your draft?',
        subtext: 'Your unsaved changes will be lost.',
        confirmLabel: 'Discard',
        cancelLabel: 'Keep editing',
      });
    }
    return true;
  };



  // Sync blogs from Firestore — dual strategy for network resilience
  const [blogs, setBlogs] = useState([]);
  const [blogsLoaded, setBlogsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const parseDocs = (docs) => {
    return docs.map(d => {
      const data = typeof d.data === 'function' ? d.data() : d;
      const id = d.id || data.id;
      let dateStr = "Recent";
      if (data.date) dateStr = data.date;
      else if (data.createdAt?.toDate) dateStr = data.createdAt.toDate().toLocaleDateString('en-GB');
      return { id, ...data, date: dateStr };
    }).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  };

  const loadBlogs = () => {
    if (!db) {
      setBlogsLoaded(true);
      setLoadError(true);
      return () => { };
    }

    setBlogsLoaded(false);
    setLoadError(false);

    const blogsRef = collection(db, 'artifacts', appId, 'public', 'data', 'blogs');
    let resolved = false;

    // Strategy 1: Real-time listener (WebSocket)
    const unsubscribe = onSnapshot(query(blogsRef), (snap) => {
      resolved = true;
      setLoadError(false);
      setBlogs(parseDocs(snap.docs));
      setBlogsLoaded(true);
    }, (err) => {
      console.error('[Journal] onSnapshot error:', err);
      // Don't set error yet — getDocs fallback may save us
    });

    // Strategy 2: One-shot HTTP fallback after 5s if WS hasn't connected
    const fallbackTimer = setTimeout(async () => {
      if (!resolved) {
        try {
          console.log('[Journal] onSnapshot slow, trying getDocs fallback...');
          const snap = await getDocs(query(blogsRef));
          if (!resolved) {
            setBlogs(parseDocs(snap.docs));
            setBlogsLoaded(true);
            setLoadError(false);
            resolved = true;
          }
        } catch (err) {
          console.error('[Journal] getDocs fallback error:', err);
          if (!resolved) {
            setBlogsLoaded(true);
            setLoadError(true);
          }
        }
      }
    }, 5000);

    return () => { unsubscribe(); clearTimeout(fallbackTimer); };
  };

  useEffect(() => {
    if (!authReady) return;
    const cleanup = loadBlogs();
    return cleanup;
  }, [authReady]);

  const themeColors = {
    textMain: isDarkMode ? 'text-[#EDEDED]' : 'text-[#232323]',
    textSub: isDarkMode ? 'text-zinc-500' : 'text-[#5A5A5A]',
    border: isDarkMode ? 'border-white/10' : 'border-black/10'
  };

  // Build display list based on filter
  const publicBlogs = blogs.filter(b => !b.archived);
  const archivedBlogs = blogs.filter(b => b.archived);

  let displayBlogs;
  if (!isAdmin || filterMode === 'public') {
    displayBlogs = publicBlogs;
  } else if (filterMode === 'archived') {
    displayBlogs = archivedBlogs;
  } else {
    displayBlogs = blogs;
  }

  // Save handler
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

      if (editingId) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'blogs', editingId), { ...blogData, updatedAt: serverTimestamp() });
      } else {
        blogData.date = new Date().toLocaleDateString('en-GB', { month: '2-digit', year: 'numeric' }).replace('/', ' · ');
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'blogs'), { ...blogData, createdAt: serverTimestamp() });
      }
      setNewBlog({ title: '', excerpt: '', content: '' });
      setEditingId(null);
      isDirty.current = false;
      setStatusMsg('success');
      setTimeout(() => { setStatusMsg(null); setSubView('archive'); }, 1500);
    } catch (err) {
      console.error("[Journal] Error saving blog entry:", err);
      setStatusMsg('error');
    } finally { setIsSubmitting(false); }
  };

  const toggleArchive = async (blog) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'blogs', blog.id), { archived: !blog.archived });
    } catch (err) {
      console.error("[Journal] Archive error:", err);
    }
  };

  // --- RENDERING ---
  return (
    <div className="relative w-full">
      {subView === 'write' && isAdmin ? (
        <div className="max-w-[720px] mx-auto animate-in slide-in-from-bottom-8 md:py-12">
          <div className="flex justify-between items-center mb-16">
            <span className={`${UI.mono} text-zinc-400`}>{editingId ? 'EDITING ENTRY' : 'NEW ENTRY'}</span>
            <button onClick={async () => { if (await confirmDiscard()) { setSubView('archive'); setEditingId(null); setNewBlog({ title: '', excerpt: '', content: '' }); isDirty.current = false; } }} className={`${UI.mono} ${UI.linkHover} text-zinc-400`}>CANCEL</button>
          </div>
          <form onSubmit={handleSaveBlog} className="space-y-12">
            <input type="text" placeholder="Title..." value={newBlog.title} onChange={e => setNewBlog({ ...newBlog, title: e.target.value })} className={`w-full text-4xl md:text-[3.2rem] ${UI.serif} leading-[1.15] tracking-tight bg-transparent focus:bg-transparent border-none outline-none placeholder:opacity-20 ${themeColors.textMain}`} />
            <textarea placeholder="Excerpt..." value={newBlog.excerpt} onChange={e => setNewBlog({ ...newBlog, excerpt: e.target.value })} className={`w-full p-0 bg-transparent focus:bg-transparent text-[1.1rem] ${UI.sans} outline-none resize-none h-24 ${themeColors.textSub} transition-all`} />
            <div className="relative">
              <div className="absolute -top-6 right-0 font-mono text-[10px] text-zinc-400 p-1.5 opacity-60 pointer-events-none">
                TIP: "## " for headings · "&gt; " for quotes
              </div>
              <textarea placeholder="Write your thoughts..." value={newBlog.content} onChange={e => setNewBlog({ ...newBlog, content: e.target.value })} className={`w-full p-0 bg-transparent focus:bg-transparent text-[1.25rem] md:text-[1.35rem] font-serif leading-[1.8] tracking-[-0.01em] outline-none h-[60vh] resize-none overflow-y-auto ${themeColors.textMain} custom-scrollbar`} />
            </div>
            <div className={`flex justify-end border-t ${themeColors.border} pt-8`}>
              <button disabled={isSubmitting} className={`px-8 py-3 bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] ${UI.label} hover:opacity-80 transition-opacity rounded-full`}>
                {statusMsg === 'syncing' ? 'Saving...' : statusMsg === 'success' ? '✓ Saved' : editingId ? 'Update Entry' : 'Publish Entry'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="animate-in fade-in duration-700 w-full mb-12">
          <header className="mb-8 flex justify-between items-end gap-8 px-3">
            <div className="max-w-xl">
              <h1 className={`${UI.serif} text-[1.35rem] md:text-[1.5rem] leading-[1.65] ${themeColors.textMain} whitespace-pre-wrap`}>
                {content?.journalIntro || "Welcome to my digital garden."}
              </h1>
            </div>
            {isAdmin && (
              <div className="flex gap-2 items-center">
                <div className={`flex rounded-full border border-black/10 dark:border-white/10 overflow-hidden ${UI.mono} text-[10px]`}>
                  {[
                    { key: 'public', label: 'LIVE' },
                    { key: 'all', label: 'ALL' },
                    { key: 'archived', label: 'ARCHIVED' },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setFilterMode(key)}
                      className={`px-3 py-1.5 transition-colors ${filterMode === key
                        ? (key === 'archived' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-black/10 dark:bg-white/10 text-black dark:text-white')
                        : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <button onClick={() => { setNewBlog({ title: '', excerpt: '', content: '' }); setEditingId(null); setSubView('write'); }} className={`flex items-center gap-2 ${UI.label} px-4 py-2 bg-[#1A1A1A] dark:bg-white/10 text-white dark:text-zinc-200 hover:opacity-80 transition-opacity rounded-full`}><Plus className="w-4 h-4" /> New</button>
              </div>
            )}
          </header>

          <section className="pb-8 mt-8 md:mt-12">
            {!blogsLoaded ? (
              <div className="flex flex-col gap-4 animate-pulse">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-black/[0.03] dark:bg-white/[0.03] rounded-xl" />)}
              </div>
            ) : loadError ? (
              <div className={`text-center py-16 glass-texture border border-black/5 dark:border-white/10 rounded-2xl p-8`}>
                <p className={`font-serif text-[1.1rem] ${themeColors.textSub} leading-relaxed`}>
                  The garden is resting for a moment.
                </p>
                <p className={`font-sans text-sm text-zinc-400 mt-2`}>
                  Posts should be back shortly.
                </p>
                <button onClick={loadBlogs} className={`mt-4 inline-flex items-center gap-2 font-sans text-sm text-zinc-500 hover:text-black dark:hover:text-white transition-colors`}>
                  <RefreshCcw className="w-3.5 h-3.5" /> Try again
                </button>
              </div>
            ) : displayBlogs.length === 0 ? (
              <p className={`text-center py-16 ${themeColors.textSub} ${UI.sans}`}>
                {filterMode === 'archived' ? 'No archived posts.' : 'No posts yet.'}
              </p>
            ) : (
              <div className="flex flex-col glass-texture border border-black/5 dark:border-white/10 rounded-2xl p-4 md:p-6 shadow-sm">
                {displayBlogs.map((blog, idx) => (
                  <div
                    key={blog.id}
                    onClick={() => navigate(`/post/${blog.id}`)}
                    className={`group flex flex-col items-start gap-1.5 cursor-pointer py-4 px-2 md:px-4 rounded-xl transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02] ${idx !== displayBlogs.length - 1 ? 'border-b border-black/[0.04] dark:border-white/[0.04] pb-8 mb-4' : ''} ${blog.archived ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <h4 className={`font-serif md:text-[1.5rem] text-[1.3rem] leading-tight ${themeColors.textMain} group-hover:opacity-60 transition-opacity flex-1`}>{blog.title}</h4>
                      {isAdmin && (
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleArchive(blog); }}
                          title={blog.archived ? "Make live" : "Archive"}
                          className={`shrink-0 p-1.5 rounded-lg transition-colors ${blog.archived ? 'text-amber-500 hover:bg-amber-500/10' : 'text-zinc-300 dark:text-zinc-700 hover:text-zinc-500 dark:hover:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5'}`}
                        >
                          {blog.archived ? <Eye className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                    {blog.archived && isAdmin && (
                      <span className="font-mono text-[10px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">ARCHIVED</span>
                    )}
                    {blog.excerpt && <p className={`font-sans text-[1rem] ${themeColors.textSub} line-clamp-2 mt-1 mb-2 leading-relaxed`}>{blog.excerpt}</p>}
                    <div className="flex items-center gap-3 font-sans text-sm text-zinc-500 mt-1">
                      <span>{blog.date}</span>
                      {blog.readTime && (
                        <>
                          <span className="text-zinc-300 dark:text-zinc-700">·</span>
                          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{blog.readTime}</span>
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