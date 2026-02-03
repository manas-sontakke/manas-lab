import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  serverTimestamp, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { 
  X, Sun, Moon, Plus, ArrowLeft, PenTool, Lock, Key, Database, Share2, 
  Github, Linkedin, Mail, Twitter, ShieldCheck, Clock, ArrowRight, Trash2,
  ChevronRight, Cpu, Code2, Terminal, ExternalLink, Globe, MessageSquare, User, 
  AlertCircle, CheckCircle2, Zap, Phone, Instagram, BookOpen, Briefcase, Layout
} from 'lucide-react';

// --- FIREBASE INITIALIZATION ---
const getFirebaseConfig = () => {
  if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    try { return JSON.parse(__firebase_config); } catch (e) { console.error(e); }
  }
  try {
    return {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID
    };
  } catch (e) { return { apiKey: "" }; }
};

const firebaseConfig = getFirebaseConfig();
const isConfigValid = !!firebaseConfig.apiKey && firebaseConfig.apiKey.length > 20;

let app, auth, db;
if (isConfigValid) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (e) { console.error("Firebase Init Error:", e); }
}

const appId = String(typeof __app_id !== 'undefined' ? __app_id : 'manas-dual-site').replace(/\//g, '_');

// --- TYPOGRAPHY CONSTANTS ---
const UI = {
  heading: 'font-black tracking-tighter leading-none uppercase italic',
  serif: 'font-serif tracking-tight',
  mono: 'font-mono uppercase tracking-[0.2em] text-[10px] font-bold',
  sans: 'font-sans font-black uppercase tracking-widest text-[11px]'
};

// --- STATIC DATA ---
const STATIC_BLOGS = [
  { 
    id: 'static-1', 
    title: "The Discipline of Efficiency", 
    date: "03 · 2026", 
    readTime: "4 MIN", 
    content: "Why manual memory management teaches you more about software architecture than any framework.\n\nAt IIT Kanpur, the pace is relentless. A digital garden is not just a blog; it is an environment for learning in public. Unlike traditional portfolios that focus on finality, a garden focuses on evolution.",
    excerpt: "Why manual memory management teaches you more about software architecture than any framework.",
    tags: ["Engineering", "C++"]
  },
  { 
    id: 'static-2', 
    title: "Designing Digital Gardens", 
    date: "02 · 2026", 
    readTime: "6 MIN", 
    content: "Moving away from static portfolios to living, breathing repositories of thought. The web was meant to be a garden, not a brochure.",
    excerpt: "Moving away from static portfolios to living, breathing repositories of thought.",
    tags: ["Design", "Philosophy"]
  }
];

export default function App() {
  const [view, setView] = useState('garden'); 
  const [subView, setSubView] = useState('archive'); 
  const [isDarkMode, setIsDarkMode] = useState(false); 
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [adminKeyInput, setAdminKeyInput] = useState('');

  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [selectedBlog, setSelectedBlog] = useState(null);
  
  const [newPost, setNewPost] = useState('');
  const [newBlog, setNewBlog] = useState({ title: '', excerpt: '', content: '' });
  const [category, setCategory] = useState('Build');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [error, setError] = useState(null);
  const [showDiagnostic, setShowDiagnostic] = useState(false);

  const [contactData, setContactData] = useState({ name: '', email: '', message: '' });
  const [contactStatus, setContactStatus] = useState(null);

  useEffect(() => {
    if (!isConfigValid || !auth) {
      setError("Configuration missing. Check .env file.");
      return;
    }
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else { await signInAnonymously(auth); }
      } catch (err) { setError(`Auth Error: ${err.message}`); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if(u) setError(null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    try {
      const logsRef = collection(db, 'artifacts', appId, 'public', 'data', 'logs');
      const unsubLogs = onSnapshot(query(logsRef), (snap) => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data(), timestamp: d.data().timestamp?.toString() || "Just now" }));
        setLogs(docs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
      });

      const blogsRef = collection(db, 'artifacts', appId, 'public', 'data', 'blogs');
      const unsubBlogs = onSnapshot(query(blogsRef), (snap) => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data(), date: d.data().date?.toString() || "Recent" }));
        setBlogs(docs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
      });

      return () => { unsubLogs(); unsubBlogs(); };
    } catch (e) { console.error("Sync Error:", e); }
  }, [user]);

  const handleAdminAuth = (e) => {
    e.preventDefault();
    if (adminKeyInput === 'iitk2026') {
      setIsAdmin(true);
      setShowAuthModal(false);
      setAdminKeyInput('');
      // If we opened auth from the "New Entry" button, switch to write mode automatically
      if (subView === 'archive') setSubView('write');
    } else {
      setStatusMsg('auth-fail');
      setTimeout(() => setStatusMsg(null), 2000);
    }
  };

  const handleNewEntryClick = () => {
    if (isAdmin) {
      setSubView('write');
    } else {
      setShowAuthModal(true);
    }
  };

  const postLog = async (e) => {
    e.preventDefault();
    if (!newPost.trim() || !user || !db) return;
    setIsSubmitting(true);
    setStatusMsg('syncing');
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'logs'), {
        content: newPost,
        category,
        createdAt: serverTimestamp(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        userId: user.uid
      });
      setNewPost('');
      setStatusMsg('success');
      setTimeout(() => setStatusMsg(null), 1500);
    } catch (err) { setStatusMsg('error'); } finally { setIsSubmitting(false); }
  };

  const postBlog = async (e) => {
    e.preventDefault();
    if (!db) { setStatusMsg('no-db'); return; }
    if (!newBlog.title.trim() || !newBlog.content.trim()) {
      setStatusMsg('missing-fields');
      setTimeout(() => setStatusMsg(null), 3000);
      return;
    }

    setIsSubmitting(true);
    setStatusMsg('syncing');
    
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'blogs'), {
        ...newBlog,
        createdAt: serverTimestamp(),
        date: new Date().toLocaleDateString('en-GB', { month: '2-digit', year: 'numeric' }).replace('/', ' · '),
        readTime: `${Math.max(1, Math.ceil(newBlog.content.split(' ').length / 200))} MIN READ`
      });
      setNewBlog({ title: '', excerpt: '', content: '' });
      setStatusMsg('success');
      setTimeout(() => {
        setStatusMsg(null);
        setSubView('archive');
      }, 1500);
    } catch (err) {
      setStatusMsg('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteDocItem = async (col, id) => {
    if (!db || !isAdmin) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', col, id));
      if (col === 'blogs' && selectedBlog?.id === id) setSelectedBlog(null);
    } catch (err) { console.error(err); }
  };

  const submitContact = async (e) => {
    e.preventDefault();
    if (!db || !contactData.message) return;
    setContactStatus('sending');
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), {
        ...contactData,
        createdAt: serverTimestamp()
      });
      setContactStatus('success');
      setContactData({ name: '', email: '', message: '' });
      setTimeout(() => setContactStatus(null), 3000);
    } catch (err) { setContactStatus('error'); }
  };

  const themeColors = {
    bg: isDarkMode ? (view === 'garden' ? 'bg-[#0e0e11]' : 'bg-[#0a0a0c]') : 'bg-[#fcfaf2]',
    card: isDarkMode ? 'bg-white/[0.02] border-white/5 shadow-2xl' : 'bg-white border-[#e5e1d8] shadow-sm',
    textMain: isDarkMode ? 'text-white' : 'text-[#1a1a1a]',
    navBg: isDarkMode ? 'bg-white/[0.02] border-white/5' : 'bg-[#f5f2e8]/80 border-[#e5e1d8]'
  };

  // Combine static and dynamic blogs for display
  const displayBlogs = [...blogs, ...STATIC_BLOGS];

  if (!isConfigValid || error) {
    return (
      <div className="min-h-screen bg-[#050505] text-slate-200 flex items-center justify-center p-6 font-sans">
        <div className="max-w-xl w-full bg-zinc-900/40 border border-red-500/20 p-8 md:p-12 rounded-[2.5rem] backdrop-blur-3xl shadow-2xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/5"><AlertCircle className="text-red-500 w-8 h-8" /></div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight uppercase leading-tight">System Error</h1>
              <p className="text-red-400/80 text-[10px] font-bold uppercase tracking-widest mt-1">Diagnostic Mode Active</p>
            </div>
          </div>
          <div className="bg-black/40 p-6 rounded-2xl border border-white/5 mb-8">
            <p className="text-sm text-zinc-300 leading-relaxed font-medium">{error || "Environment keys missing. Please restart terminal."}</p>
          </div>
          <div className="flex flex-col gap-3">
            <button onClick={() => window.location.reload()} className="w-full bg-white text-black py-4 rounded-2xl font-black text-sm hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"><RefreshCcw className="w-4 h-4" /> Restart Node</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-700 font-sans ${themeColors.bg} ${themeColors.textMain} selection:bg-emerald-500/20`}>
      
      {/* READING MODAL (POP-UP) */}
      {selectedBlog && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-8 backdrop-blur-xl bg-black/60 animate-in fade-in duration-300">
           <div className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto ${themeColors.card} rounded-[3rem] shadow-2xl relative outline-none custom-scrollbar`}>
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500/20 via-emerald-600 to-indigo-500/20" />
              
              <button 
                onClick={() => setSelectedBlog(null)} 
                className="sticky top-6 right-6 float-right ml-4 mb-4 p-3 bg-zinc-100 dark:bg-white/10 rounded-full hover:bg-red-500 hover:text-white transition-all z-50 backdrop-blur-md"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-8 md:p-16 lg:p-20">
                <div className="mb-12 border-b border-black/5 dark:border-white/5 pb-10 flex flex-wrap items-center gap-6">
                   <div className="flex items-center gap-3"><Clock className="w-5 h-5 text-zinc-400" /><span className={`${UI.mono} text-zinc-500`}>{selectedBlog.readTime}</span></div>
                   <span className="text-zinc-300">/</span>
                   <span className={`${UI.mono} text-emerald-600 font-black`}>{selectedBlog.date}</span>
                   {isAdmin && (
                     <button onClick={() => deleteDocItem('blogs', selectedBlog.id)} className="ml-auto flex items-center gap-2 text-[10px] font-bold text-red-400 hover:text-red-600 transition-colors bg-red-50 dark:bg-red-900/10 px-4 py-2 rounded-xl">
                       <Trash2 className="w-4 h-4" /> Delete Entry
                     </button>
                   )}
                </div>

                <h1 className={`${UI.serif} text-4xl md:text-7xl font-black mb-16 tracking-tighter leading-[1] ${themeColors.textMain}`}>
                  {selectedBlog.title}
                </h1>

                <div className={`${UI.serif} text-xl md:text-2xl leading-[1.8] space-y-10 ${isDarkMode ? 'text-slate-300' : 'text-[#222]'} font-medium`}>
                   {selectedBlog.content ? selectedBlog.content.split('\n').map((p, i) => (
                     <p key={i} className="mb-4">{p}</p>
                   )) : <p>No content available.</p>}
                </div>

                <div className="mt-24 pt-12 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-white text-sm font-black italic">M</div>
                     <div>
                       <p className={`${UI.sans} ${themeColors.textMain}`}>Manas Sontakke</p>
                       <p className={`${UI.mono} text-zinc-500 mt-1`}>Repository Archivist</p>
                     </div>
                   </div>
                </div>
              </div>
           </div>
        </div>
      )}

      {/* AUTH MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 backdrop-blur-md bg-black/30 animate-in fade-in">
           <div className={`${themeColors.card} w-full max-w-sm p-10 rounded-[2.5rem] border`}>
              <div className="flex justify-between items-center mb-8">
                 <h3 className={`${UI.heading} text-2xl`}>Node Entry</h3>
                 <X onClick={() => setShowAuthModal(false)} className="w-5 h-5 cursor-pointer opacity-40 hover:opacity-100" />
              </div>
              <form onSubmit={handleAdminAuth} className="space-y-6">
                <input type="password" placeholder="Passkey" value={adminKeyInput} onChange={e => setAdminKeyInput(e.target.value)} className={`w-full p-5 rounded-2xl outline-none border ${isDarkMode ? 'bg-black/40 border-white/5 text-white' : 'bg-[#fcfaf2] border-[#e5e1d8]'}`} autoFocus />
                <button className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest ${view === 'garden' ? 'bg-emerald-600' : 'bg-indigo-600'} text-white shadow-xl`}>Authorize</button>
                {statusMsg === 'auth-fail' && <p className={`${UI.mono} text-red-500 text-center mt-4`}>Invalid Key</p>}
              </form>
           </div>
        </div>
      )}

      {/* DECOR */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-[-10%] right-[-10%] w-[50%] h-[50%] blur-[150px] rounded-full transition-all duration-1000 ${isDarkMode ? (view === 'garden' ? 'bg-emerald-500/5' : 'bg-indigo-500/10') : 'opacity-0'}`} />
        <div className={`absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] blur-[150px] rounded-full transition-all duration-1000 ${isDarkMode ? (view === 'garden' ? 'bg-purple-500/5' : 'bg-blue-500/10') : 'opacity-0'}`} />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 py-8 md:py-12">
        
        {/* NAV */}
        <nav className={`flex justify-between items-center mb-24 backdrop-blur-2xl ${themeColors.navBg} p-5 rounded-[2.5rem] border sticky top-6 z-50 shadow-2xl transition-all`}>
          <div className="flex items-center gap-4">
            <div onClick={() => isAdmin ? setIsAdmin(false) : setShowAuthModal(true)} className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-700 cursor-pointer ${view === 'garden' ? 'bg-emerald-600 rotate-0' : 'bg-indigo-600 rotate-90'} ${isAdmin ? 'ring-2 ring-emerald-500/50 scale-105' : ''}`}>
              <span className="text-white font-black text-2xl italic select-none">M</span>
            </div>
            <div className="hidden sm:block">
              <h2 className={`${UI.sans} text-sm leading-none`}>{isAdmin ? 'Manas / Admin' : 'Manas Sontakke'}</h2>
              <p className={`${UI.mono} mt-1.5 ${isAdmin ? 'text-emerald-600' : 'text-zinc-500'}`}>{isAdmin ? 'Override Active' : 'Archive_v1.0'}</p>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className={`flex items-center gap-1 p-1 ${isDarkMode ? 'bg-black/40' : 'bg-[#e5e1d8]'} rounded-2xl border ${isDarkMode ? 'border-white/10' : 'border-black/5'}`}>
              <button onClick={() => { setView('garden'); setSubView('archive'); }} className={`px-5 py-2.5 rounded-xl ${UI.sans} transition-all flex items-center gap-2 ${view === 'garden' ? (isDarkMode ? 'bg-white text-black shadow-lg' : 'bg-white text-black shadow-sm') : 'text-zinc-500 hover:text-zinc-700'}`}>Garden</button>
              <button onClick={() => setView('pro')} className={`px-5 py-2.5 rounded-xl ${UI.sans} transition-all flex items-center gap-2 ${view === 'pro' ? (isDarkMode ? 'bg-white text-black shadow-lg' : 'bg-white text-black shadow-sm') : 'text-zinc-500 hover:text-zinc-700'}`}>Portal</button>
            </div>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-11 h-11 rounded-2xl flex items-center justify-center bg-black/5 dark:bg-white/5 transition-all">
              {isDarkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-zinc-800" />}
            </button>
          </div>
        </nav>

        {/* CONTENT SWITCHER */}
        <main className="min-h-[600px]">
          {view === 'garden' ? (
            /* --- GARDEN VIEW (STABLE SPLIT) --- */
            <div className="animate-in fade-in duration-700">
              <header className="mb-24 flex justify-between items-end border-b border-black/5 dark:border-white/5 pb-10">
                <div className="max-w-2xl">
                   <h1 className={`${UI.heading} text-6xl md:text-8xl mb-6`}>Archive.</h1>
                   <p className={`${UI.serif} text-xl leading-relaxed opacity-60 font-medium`}>
                     A digital backyard for raw thoughts, engineering logs, and technical deep-dives from IIT Kanpur.
                   </p>
                </div>
                {subView === 'archive' && (
                  <div className="flex gap-4">
                    {isAdmin && (
                      <button onClick={seedSampleBlog} className={`flex items-center gap-2 ${UI.sans} px-6 py-3 rounded-2xl border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 shadow-sm transition-all`}>
                        <Database className="w-3.5 h-3.5" /> Seed
                      </button>
                    )}
                    <button onClick={handleNewEntryClick} className={`flex items-center gap-2 ${UI.sans} px-8 py-4 rounded-[1.5rem] bg-emerald-600 text-white hover:bg-emerald-700 shadow-xl transition-all`}>
                      <Plus className="w-4 h-4" /> New Entry
                    </button>
                  </div>
                )}
              </header>

              {/* ROUTING */}
              {subView === 'write' ? (
                <div className="animate-in slide-in-from-top-6 duration-500 mb-20">
                   <div className="flex justify-between items-center mb-8">
                     <h2 className={`${UI.mono} text-zinc-400`}>Creating New Entry</h2>
                     <button onClick={() => setSubView('archive')} className={`flex items-center gap-2 ${UI.sans} text-red-500 hover:text-red-700`}><X className="w-4 h-4" /> Cancel</button>
                   </div>
                   <form onSubmit={postBlog} className={`${themeColors.card} p-12 rounded-[3.5rem] space-y-10 border bg-white/50 dark:bg-black/40 shadow-2xl`}>
                      <input 
                        type="text" 
                        placeholder="Entry Headline" 
                        value={newBlog.title} 
                        onChange={e => setNewBlog({...newBlog, title: e.target.value})} 
                        className={`w-full text-4xl font-black bg-transparent border-b border-black/10 outline-none focus:border-emerald-500 transition-all ${themeColors.textMain} ${UI.serif} pb-4`} 
                      />
                      <textarea 
                        placeholder="Brief summary..." 
                        value={newBlog.excerpt} 
                        onChange={e => setNewBlog({...newBlog, excerpt: e.target.value})} 
                        className={`w-full p-6 rounded-3xl text-sm outline-none h-28 resize-none shadow-inner border ${isDarkMode ? 'bg-black/40 border-white/5 text-white' : 'bg-white border-zinc-200'}`} 
                      />
                      <textarea 
                        placeholder="Full content..." 
                        value={newBlog.content} 
                        onChange={e => setNewBlog({...newBlog, content: e.target.value})} 
                        className={`w-full p-8 rounded-[2rem] text-lg outline-none h-[500px] resize-none border shadow-inner ${isDarkMode ? 'bg-black/20 border-white/5 text-white' : 'bg-white border-zinc-200'} font-serif`} 
                      />
                      
                      <div className="space-y-4">
                        {statusMsg === 'missing-fields' && (
                          <div className="flex items-center gap-2 text-amber-600 bg-amber-500/10 p-4 rounded-xl">
                            <AlertCircle className="w-4 h-4" />
                            <span className={UI.mono}>Title and Content required.</span>
                          </div>
                        )}
                        {statusMsg === 'no-db' && (
                          <div className="flex items-center gap-2 text-red-500 bg-red-500/10 p-4 rounded-xl">
                            <AlertCircle className="w-4 h-4" />
                            <span className={UI.mono}>Database offline.</span>
                          </div>
                        )}

                        <button 
                          disabled={isSubmitting} 
                          className={`w-full py-6 rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-xs transition-all shadow-xl active:scale-95 ${statusMsg === 'syncing' ? 'bg-zinc-500 animate-pulse' : statusMsg === 'success' ? 'bg-green-600' : 'bg-emerald-600'} text-white flex items-center justify-center gap-3`}
                        >
                          {statusMsg === 'syncing' ? <><Database className="w-4 h-4 animate-spin" /> Transmitting...</> : statusMsg === 'success' ? <><CheckCircle2 className="w-4 h-4" /> Committed</> : 'Commit to Archive'}
                        </button>
                      </div>
                   </form>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                  {/* Left: Live Logs */}
                  <div className="lg:col-span-5 space-y-8">
                    <div className="flex items-center justify-between px-2">
                      <h3 className={`${UI.mono} flex items-center gap-2`}><Zap className="w-4 h-4 text-emerald-500" /> Live Stream</h3>
                      <div className="text-[10px] font-mono font-bold opacity-50">{logs.length} Updates</div>
                    </div>

                    {isAdmin && (
                      <div className={`${themeColors.card} p-6 rounded-[2.5rem] backdrop-blur-3xl border-emerald-500/20`}>
                        <form onSubmit={postLog} className="space-y-4">
                          <textarea 
                            value={newPost}
                            onChange={(e) => setNewPost(e.target.value)}
                            placeholder="Log an update..."
                            className={`w-full rounded-2xl p-4 text-xs outline-none h-24 resize-none transition-all shadow-inner ${isDarkMode ? 'bg-black/40 border-white/5 text-white' : 'bg-[#fcfaf2] border-[#e5e1d8] text-[#1a1a1a]'}`}
                          />
                          <button disabled={isSubmitting || !newPost.trim()} className={`w-full py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${isDarkMode ? 'bg-white text-black hover:bg-emerald-500 hover:text-white' : 'bg-[#1a1a1a] text-white hover:bg-emerald-600'} flex items-center justify-center gap-2`}>
                            {statusMsg === 'syncing' ? 'Transmitting...' : statusMsg === 'success' ? 'Committed' : 'Ship Log'}
                          </button>
                        </form>
                      </div>
                    )}

                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide">
                      {logs.map(log => (
                        <div key={log.id} className={`${themeColors.card} p-6 rounded-[2rem] border transition-all relative group`}>
                           <div className="flex justify-between items-start mb-3">
                              <span className={`${UI.mono} text-emerald-600`}>{log.category}</span>
                              <div className="flex items-center gap-2">
                                <span className={`${UI.mono} opacity-40`}>{log.timestamp}</span>
                                {isAdmin && <button onClick={() => deleteDocItem('logs', log.id)} className="opacity-0 group-hover:opacity-100 text-red-500 transition-opacity"><Trash2 className="w-3 h-3" /></button>}
                              </div>
                           </div>
                           <p className={`text-xs leading-relaxed font-medium opacity-80`}>{log.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Blogs Grid */}
                  <div className="lg:col-span-7 space-y-12">
                    <h3 className={`${UI.mono} flex items-center gap-2 px-2`}><BookOpen className="w-4 h-4 text-emerald-500" /> Featured Notes</h3>
                    <div className="grid gap-8">
                      {displayBlogs.map(blog => (
                        <div key={blog.id} onClick={() => setSelectedBlog(blog)} className={`${themeColors.card} p-12 rounded-[3.5rem] hover:translate-y-[-4px] transition-all cursor-pointer group border relative overflow-hidden`}>
                           <div className="flex justify-between items-start mb-8">
                              <span className={`${UI.mono} opacity-50`}>{blog.date}</span>
                              <Clock className="w-4 h-4 opacity-30" />
                           </div>
                           <h4 className={`${UI.serif} text-3xl font-black mb-4 tracking-tight leading-none group-hover:text-emerald-600 transition-colors`}>{blog.title}</h4>
                           <p className="text-sm leading-relaxed opacity-60 mb-8 max-w-md line-clamp-3">{blog.excerpt}</p>
                           <div className="flex gap-2 mb-4">
                             {blog.tags && blog.tags.map(tag => (
                               <span key={tag} className={`${UI.mono} text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded`}>{tag}</span>
                             ))}
                           </div>
                           <div className="flex items-center justify-between pt-8 border-t border-black/5 dark:border-white/5">
                              <span className={UI.mono}>{blog.readTime}</span>
                              <ArrowRight className="w-5 h-5 opacity-30 group-hover:translate-x-2 transition-transform group-hover:text-emerald-600" />
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* --- PRO PORTAL VIEW (Direct Render) --- */
            <div className="animate-in slide-in-from-bottom-10 fade-in duration-1000 block w-full bg-transparent min-h-[600px] pb-24">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
                {/* Sidebar */}
                <div className="lg:col-span-4 space-y-12">
                  <section className={`${themeColors.card} p-12 rounded-[4rem] relative overflow-hidden border shadow-xl bg-white dark:bg-black/20`}>
                     <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full ${isDarkMode ? 'bg-indigo-600/10' : 'bg-indigo-500/5'}`} />
                     <div className="w-20 h-20 bg-gradient-to-tr from-indigo-600 to-blue-600 rounded-[2rem] mb-12 flex items-center justify-center shadow-xl shadow-indigo-500/20"><User className="w-8 h-8 text-white" /></div>
                     <h1 className={`${UI.heading} text-4xl mb-4`}>Manas Sontakke</h1>
                     <p className={`${UI.mono} text-indigo-600 mb-10`}>Software Engineer</p>
                     <p className="opacity-60 text-lg leading-relaxed mb-12 font-medium">Undergraduate researcher at IIT Kanpur. Focused on high-performance systems.</p>
                     <div className="flex gap-4">
                        {[
                          { Icon: Github, href: "https://github.com/manas-sontakke" },
                          { Icon: Linkedin, href: "https://linkedin.com/in/manas-sontakke" },
                          { Icon: Mail, href: "mailto:manass@iitk.ac.in" }
                        ].map((social, i) => (
                          <a key={i} href={social.href} target="_blank" rel="noopener noreferrer" className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all opacity-50 hover:opacity-100 hover:bg-indigo-600 hover:text-white border border-transparent hover:border-white/20`}><social.Icon className="w-5 h-5" /></a>
                        ))}
                     </div>
                  </section>
                  <section className="space-y-6 px-4">
                     <h3 className={UI.mono}>Stack Inventory</h3>
                     {[
                       { label: 'Systems', value: 'C++, OS Architecture' },
                       { label: 'Fullstack', value: 'React, Node.js, Firebase' },
                       { label: 'Core', value: 'Data Structures' }
                     ].map(item => (
                       <div key={item.label} className="border-l-2 border-black/10 pl-6 py-1">
                          <p className="text-[10px] opacity-40 uppercase font-black mb-1">{item.label}</p>
                          <p className="text-sm font-bold">{item.value}</p>
                       </div>
                     ))}
                  </section>
                </div>

                {/* Content */}
                <div className="lg:col-span-8 space-y-24">
                   <section>
                      <h3 className={`${UI.mono} mb-12 flex items-center gap-4`}><ShieldCheck className="w-4 h-4 text-indigo-500" /> Milestones</h3>
                      <div className="relative pl-12 border-l-2 border-black/5 dark:border-white/5">
                         <div className="absolute top-0 left-[-5px] w-2.5 h-2.5 bg-indigo-600 rounded-full shadow-lg" />
                         <h4 className={`${UI.serif} text-4xl font-black mb-4 tracking-tight`}>IIT Kanpur</h4>
                         <span className="inline-block bg-indigo-500/10 text-indigo-600 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase mb-6">Class of 2026</span>
                         <p className="opacity-60 text-xl leading-relaxed font-medium">B.Tech in Computer Science. Researching algorithmic efficiency.</p>
                      </div>
                   </section>

                   <section>
                      <h3 className={`${UI.mono} mb-12 flex items-center gap-4`}><Code2 className="w-4 h-4 text-indigo-500" /> Engineering</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className={`${themeColors.card} p-10 rounded-[3.5rem] hover:translate-y-[-6px] transition-all group border`}>
                            <Code2 className="w-8 h-8 text-indigo-500 mb-8 opacity-40" />
                            <h4 className={`${UI.serif} text-2xl font-black mb-4 tracking-tight`}>Merge Algorithm</h4>
                            <p className="opacity-50 text-sm leading-relaxed mb-8">Efficiency-first implementation of array logic.</p>
                            <button className={`flex items-center gap-3 ${UI.sans} text-indigo-600 hover:opacity-80 transition-all`}>View Logic <ExternalLink className="w-3 h-3" /></button>
                         </div>
                         <div className={`${themeColors.card} p-10 rounded-[3.5rem] hover:translate-y-[-6px] transition-all group border`}>
                            <Globe className="w-8 h-8 text-indigo-500 mb-8 opacity-40" />
                            <h4 className={`${UI.serif} text-2xl font-black mb-4 tracking-tight`}>Garden Engine</h4>
                            <p className="opacity-50 text-sm leading-relaxed mb-8">Real-time sync engine for collaborative archives.</p>
                            <button className={`flex items-center gap-3 ${UI.sans} text-indigo-600 hover:opacity-80 transition-all`}>Documentation <ExternalLink className="w-3 h-3" /></button>
                         </div>
                      </div>
                   </section>

                   <section className={`${themeColors.card} p-16 rounded-[4rem] relative shadow-2xl overflow-hidden border`}>
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 to-blue-600" />
                      <div className="flex items-center gap-6 mb-12">
                         <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center"><MessageSquare className="w-7 h-7 text-indigo-600" /></div>
                         <div><h3 className={`${UI.heading} text-3xl`}>Connect</h3><p className={`${UI.mono} text-zinc-400 mt-2 italic font-mono`}>Direct Node Transmission</p></div>
                      </div>
                      <form onSubmit={submitContact} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <input type="text" placeholder="Identity" value={contactData.name} onChange={e => setContactData({...contactData, name: e.target.value})} className={`rounded-2xl p-5 text-sm outline-none transition-all shadow-inner border border-black/5 ${isDarkMode ? 'bg-black/40 border-white/5 text-white' : 'bg-[#fcfaf2] border-zinc-200 text-[#1a1a1a]'}`} />
                         <input type="email" placeholder="Email" value={contactData.email} onChange={e => setContactData({...contactData, email: e.target.value})} className={`rounded-2xl p-5 text-sm outline-none transition-all shadow-inner border border-black/5 ${isDarkMode ? 'bg-black/40 border-white/5 text-white' : 'bg-[#fcfaf2] border-zinc-200 text-[#1a1a1a]'}`} />
                         <textarea placeholder="Transmission..." value={contactData.message} onChange={e => setContactData({...contactData, message: e.target.value})} className={`md:col-span-2 rounded-2xl p-5 text-sm outline-none transition-all h-40 resize-none shadow-inner border border-black/5 ${isDarkMode ? 'bg-black/40 border-white/5 text-white' : 'bg-[#fcfaf2] border-zinc-200 text-[#1a1a1a]'}`} />
                         <div className="md:col-span-2 flex items-center justify-between">
                            <p className={`${UI.mono} text-zinc-400 max-w-[200px]`}>Encrypted via Firebase Handshake.</p>
                            <button disabled={contactStatus === 'sending'} className={`px-12 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-xl ${contactStatus === 'success' ? 'bg-green-600' : contactStatus === 'error' ? 'bg-red-600' : (isDarkMode ? 'bg-white text-black' : 'bg-[#1a1a1a] text-white hover:bg-black transition-colors')}`}>
                               {contactStatus === 'sending' ? 'Transmitting...' : contactStatus === 'success' ? 'Delivered' : 'Ship Message'}
                            </button>
                         </div>
                      </form>
                   </section>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* FOOTER */}
        <footer className={`mt-48 pt-20 border-t ${isDarkMode ? 'border-white/5' : 'border-black/5'} pb-32 transition-all`}>
          <div className="flex flex-col md:flex-row justify-between items-start gap-20">
            <div className="space-y-8">
               <div className="flex items-center gap-4">
                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${view === 'garden' ? 'bg-emerald-600' : 'bg-indigo-600'}`}>
                    <span className="text-white font-black italic text-lg">M</span>
                 </div>
                 <span className={`${UI.serif} text-2xl font-black tracking-tighter`}>Manas Sontakke</span>
               </div>
               <div className="flex gap-4 opacity-50">
                  {view === 'garden' ? (
                    <>
                      <a href="https://instagram.com/manas.sontakke" target="_blank" className="p-4 bg-zinc-100 dark:bg-white/5 rounded-2xl hover:bg-pink-600 hover:text-white transition-all shadow-sm"><Instagram className="w-5 h-5" /></a>
                      <a href="https://twitter.com/manassontakke" target="_blank" className="p-4 bg-zinc-100 dark:bg-white/5 rounded-2xl hover:bg-sky-500 hover:text-white transition-all shadow-sm"><Twitter className="w-5 h-5" /></a>
                      <a href="mailto:manass@iitk.ac.in" className="p-4 bg-zinc-100 dark:bg-white/5 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"><Mail className="w-5 h-5" /></a>
                      <a href="tel:+919999999999" className="p-4 bg-zinc-100 dark:bg-white/5 rounded-2xl hover:bg-green-600 hover:text-white transition-all shadow-sm"><Phone className="w-5 h-5" /></a>
                    </>
                  ) : (
                    <>
                      <a href="https://linkedin.com/in/manas-sontakke" target="_blank" className="p-4 bg-zinc-100 dark:bg-white/5 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Linkedin className="w-5 h-5" /></a>
                      <a href="https://github.com/manas-sontakke" target="_blank" className="p-4 bg-zinc-100 dark:bg-white/5 rounded-2xl hover:bg-zinc-900 hover:text-white transition-all shadow-sm"><Github className="w-5 h-5" /></a>
                      <a href="mailto:manass@iitk.ac.in" className="p-4 bg-zinc-100 dark:bg-white/5 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"><Mail className="w-5 h-5" /></a>
                    </>
                  )}
               </div>
            </div>
            <div className="flex flex-col items-end gap-6">
               <p className={`${UI.mono} opacity-40`}>IIT Kanpur // Class of 2026</p>
               <div className={`inline-flex items-center gap-3 px-5 py-2 rounded-full border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white border-zinc-200'}`}>
                  <div className={`w-2 h-2 rounded-full animate-pulse ${view === 'garden' ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                  <p className={UI.mono}>{user ? 'NODE_SECURE' : 'HANDSHAKE'}</p>
               </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}