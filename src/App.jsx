import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, signInAnonymously, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth, isConfigValid } from './services/firebase';
import { UI } from './utils/constants';
import Journal from './pages/Journal';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import BlogPost from './pages/BlogPost';
import ProjectDetail from './pages/ProjectDetail';
import { GlobalContentProvider, useGlobalContent } from './contexts/GlobalContentContext';
import {
  Sun, Moon, X, AlertCircle, RefreshCcw, Lock,
  Instagram, Twitter, Mail, Phone, Linkedin, Github, Code2, Cpu, Terminal
} from 'lucide-react';

function App() {
  const [view, setView] = useState('journal');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);

  // Added import for X at the top manually previously, ensuring it's available.
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // (Reset Mode UI Removed: Relying on bulletproof default Firebase Reset URL)

  useEffect(() => {
    // 2. Standard Auth Initialization
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (usr) => {
      setUser(usr);
      if (usr && !usr.isAnonymous && usr.email === 'sontakke.manas@gmail.com') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
        // Automatically ensure fallback anonymous sign-in
        if (!usr) {
          try { await signInAnonymously(auth); }
          catch (e) { console.error("[App Auth] Anonymous fallback failed", e); }
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAuth = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
      setShowAuthModal(false);
      setAuthError(false);
    } catch (err) {
      console.error("[App Auth] Google Sign-In failed.", err);
      setAuthError(err.message || "Authentication failed");
      setTimeout(() => setAuthError(false), 5000);
    }
  };

  // Removed handleForgotPassword since we are strictly using Google OAuth now.

  const themeColors = {
    bg: isDarkMode ? 'bg-[#151515]' : 'bg-[#F4F1EA]',
    textMain: isDarkMode ? 'text-[#EDEDED]' : 'text-[#232323]',
    textSub: isDarkMode ? 'text-zinc-400' : 'text-[#666666]',
    navBg: isDarkMode ? 'bg-[#151515]/80 border-white/10' : 'bg-[#F4F1EA]/80 border-black/5',
    border: isDarkMode ? 'border-white/15' : 'border-black/10'
  };

  if (!isConfigValid) return <div className="p-10 font-mono text-red-500">CONFIG ERROR: CHECK .ENV</div>;

  const InnerApp = () => {
    const { content } = useGlobalContent();
    const navigate = useNavigate();
    const location = useLocation();
    const scrollPositions = useRef({});
    const [transitionKey, setTransitionKey] = useState(location.key);
    const [transitionClass, setTransitionClass] = useState('page-transition-active');

    // Smooth page transition
    useEffect(() => {
      setTransitionClass('page-transition-enter');
      const timer = requestAnimationFrame(() => {
        requestAnimationFrame(() => setTransitionClass('page-transition-active'));
      });

      const isDetailPage = location.pathname.startsWith('/post/') || location.pathname.startsWith('/project/');

      if (isDetailPage) {
        scrollPositions.current['/'] = window.scrollY;
        window.scrollTo({ top: 0, behavior: 'instant' });
      } else {
        const saved = scrollPositions.current[location.pathname];
        if (saved != null) {
          requestAnimationFrame(() => window.scrollTo({ top: saved, behavior: 'instant' }));
        } else {
          window.scrollTo({ top: 0, behavior: 'instant' });
        }
      }

      setTransitionKey(location.key);
      return () => cancelAnimationFrame(timer);
    }, [location.pathname, location.key]);

    return (
      <div className={`min-h-screen transition-colors duration-500 font-sans ${themeColors.bg} ${themeColors.textMain} selection:bg-black selection:text-white ${isDarkMode ? 'dark' : ''} overflow-x-hidden`}>

        {/* --- Standard Login Modal --- */}
        {showAuthModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/10 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className={`w-full max-w-[400px] bg-white dark:bg-[#1A1A1A] border border-black/5 dark:border-white/10 rounded-3xl p-8 shadow-2xl relative animate-in zoom-in-[0.98] duration-300`}>
              <button
                onClick={() => setShowAuthModal(false)}
                className={`absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors z-[60] text-zinc-400 hover:text-black dark:hover:text-white bg-white dark:bg-[#1A1A1A]`}
              >
                <X className="w-5 h-5 flex" />
              </button>

              <div className="mb-8">
                <Terminal className={`w-6 h-6 mb-4 ${themeColors.textMain}`} />
                <h2 className={`${UI.serif} text-2xl tracking-tight ${themeColors.textMain}`}>System Access</h2>
                <p className={`${UI.sans} text-sm text-zinc-500 mt-2`}>Hey! This console is just for me to tend my digital garden. If you want to connect, the email link below is a much better bet :)</p>
              </div>

              <div className="space-y-6">
                <button type="button" onClick={handleAuth} className={`w-full flex items-center justify-center gap-3 ${UI.label} py-3.5 bg-white dark:bg-[#2A2A2A] text-black dark:text-zinc-200 border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors rounded-xl`}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                  Connect with Google
                </button>
                {authError && <p className="text-red-500 text-xs text-center font-medium mt-4">{typeof authError === 'string' ? authError : "Authentication failed. Please use sontakke.manas@gmail.com"}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Global Admin Indicator / Exit Button */}
        {isAdmin && (
          <button
            onClick={() => {
              signOut(auth).then(() => { setIsAdmin(false); setView('journal'); });
            }}
            className="fixed bottom-6 left-6 z-[9999] flex items-center gap-3 px-5 py-2.5 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 border border-red-500/20 backdrop-blur-md shadow-lg group"
            title="Click to exit Admin Mode"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 group-hover:bg-white animate-pulse transition-colors" />
            <span className="font-mono text-[11px] font-bold tracking-widest uppercase">EXIT SYSTEM</span>
          </button>
        )}

        {/* --- Global Subtle Noise Grain --- */}
        <div
          className="fixed inset-0 z-[1] pointer-events-none opacity-[0.03] dark:opacity-[0.04] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='globalNoise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23globalNoise)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
          }}
        />
        {/* Animate on admin state change layer */}
        <div className={`fixed inset-0 z-[190] pointer-events-none transition-all duration-1000 ${isAdmin ? 'bg-emerald-500/0 mix-blend-overlay' : 'bg-black/0'}`} />

        <div className="relative max-w-[640px] mx-auto px-6 py-16 md:py-24">
          <nav className={`flex justify-between items-center mb-20 gap-2 md:gap-4 z-50 transition-all px-3 md:px-6 py-3 md:py-4 rounded-2xl border shadow-sm glass-texture ${isDarkMode ? 'border-white/10' : 'border-black/5'} overflow-hidden`}>
            <div className="cursor-pointer select-none shrink-0">
              <span className={`font-sans font-semibold text-base md:text-lg tracking-tight`} onClick={() => { setView('journal'); navigate('/'); }}>Manas Sontakke</span>
            </div>
            <div className="flex items-center gap-2 md:gap-6 relative z-10 shrink-0">
              <div className={`flex gap-2 md:gap-4`}>
                {isAdmin && (
                  <button onClick={() => { setView('dashboard'); navigate('/'); }} className={`${UI.label} transition-colors hidden md:block ${view === 'dashboard' ? themeColors.textMain : 'text-zinc-400 hover:text-black dark:hover:text-white'}`}>Dashboard</button>
                )}
                {isAdmin && (
                  <button onClick={() => { setView('dashboard'); navigate('/'); }} className={`md:hidden ${UI.label} transition-colors ${view === 'dashboard' ? themeColors.textMain : 'text-zinc-400 hover:text-black dark:hover:text-white'}`}>
                    <Terminal className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => { setView('journal'); navigate('/'); }} className={`${UI.label} transition-colors ${view === 'journal' ? themeColors.textMain : 'text-zinc-400 hover:text-black dark:hover:text-white uppercase'}`}>Indoor</button>
                <button onClick={() => { setView('profile'); navigate('/'); }} className={`${UI.label} transition-colors ${view === 'profile' ? themeColors.textMain : 'text-zinc-400 hover:text-black dark:hover:text-white uppercase'}`}>Outdoor</button>
              </div>
              <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-800"></div>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`relative w-[48px] h-[24px] rounded-full flex items-center shadow-inner transition-colors border ${isDarkMode ? 'bg-[#151515] border-white/10' : 'bg-black/5 border-black/10'}`}
                aria-label="Toggle Theme"
              >
                <div className={`absolute left-1 w-[16px] h-[16px] rounded-full flex items-center justify-center transition-transform duration-300 ease-in-out ${isDarkMode ? 'transform translate-x-[24px] bg-white text-black' : 'bg-white text-black drop-shadow-sm'}`}>
                  {isDarkMode ? <Moon className="w-[10px] h-[10px]" /> : <Sun className="w-[10px] h-[10px]" />}
                </div>
              </button>
            </div>
          </nav>

          <div key={transitionKey} className={transitionClass}>
            <Routes location={location}>
              <Route path="/post/:id" element={
                <main className="w-full min-h-[50vh]">
                  <BlogPost isAdmin={isAdmin} isDarkMode={isDarkMode} themeColors={themeColors} />
                </main>
              } />
              <Route path="/project/:id" element={
                <main className="w-full min-h-[50vh]">
                  <ProjectDetail isDarkMode={isDarkMode} themeColors={themeColors} />
                </main>
              } />
              <Route path="*" element={
                <main key={view} className="w-full min-h-[50vh]">
                  {view === 'dashboard' && isAdmin ? (
                    <AdminDashboard themeColors={themeColors} isDarkMode={isDarkMode} />
                  ) : view === 'journal' ? (
                    <Journal isAdmin={isAdmin} isDarkMode={isDarkMode} />
                  ) : (
                    <Profile isDarkMode={isDarkMode} />
                  )}
                </main>
              } />
            </Routes>
          </div>

          <footer className={`mt-16 pt-10 border-t ${isDarkMode ? 'border-white/15' : 'border-black/10'} pb-12 flex flex-col items-center md:items-start justify-between gap-6 relative z-10`}>
            {/* Contact Card */}
            <div className="relative w-full flex flex-col md:flex-row items-center justify-between p-6 md:p-8 rounded-2xl border border-black/5 dark:border-white/10 glass-texture shadow-sm mb-2 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/0 to-emerald-500/5 dark:from-white/0 dark:to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

              <span className={`${UI.sans} text-[1.1rem] ${themeColors.textMain} relative z-10`}>Have something to say? Send me an email.</span>
              <a href="mailto:sontakke.manas@gmail.com" className="relative z-10 mt-4 md:mt-0 px-6 py-2.5 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-lg font-sans font-medium transition-colors">
                Email me →
              </a>
            </div>

            <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-end gap-12 md:gap-6">
              <div className="flex flex-col gap-6 w-full md:w-auto">
                <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-8">
                  {/* Show personal socials for Indoor, professional for Outdoor */}
                  {view === 'journal' ? (
                    <>
                      {(content?.socials || []).filter(s => ['INSTAGRAM', 'TWITTER'].includes(s.platform)).map((social) => (
                        <a key={social.platform} href={social.url} target="_blank" rel="noreferrer" className={`${UI.mono} ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'} ${UI.linkHover}`}>
                          {social.platform}
                        </a>
                      ))}
                      <a href="tel:8291229103" className={`${UI.mono} ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'} ${UI.linkHover}`}>PHONE</a>
                      <a href="mailto:sontakke.manas@gmail.com" className={`${UI.mono} ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'} ${UI.linkHover}`}>EMAIL</a>
                    </>
                  ) : (
                    <>
                      {(content?.socials || []).filter(s => ['GITHUB', 'LINKEDIN'].includes(s.platform)).map((social) => (
                        <a key={social.platform} href={social.url} target="_blank" rel="noreferrer" className={`${UI.mono} ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'} ${UI.linkHover}`}>
                          {social.platform}
                        </a>
                      ))}
                      <a href="mailto:sontakke.manas@gmail.com" className={`${UI.mono} ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'} ${UI.linkHover}`}>EMAIL</a>
                    </>
                  )}
                </div>
                <p className={`${UI.serif} ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'} text-sm max-w-sm leading-relaxed text-center md:text-left`}>
                  This digital space is built using React, structured with Tailwind, and synced via Firebase. Deployed gracefully on Vercel.
                </p>
              </div>
              <div className="flex flex-col items-start md:items-end gap-2">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      if (isAdmin) {
                        signOut(auth).then(() => { setIsAdmin(false); setView('journal'); });
                      } else {
                        setShowAuthModal(true);
                      }
                    }}
                    className={`${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'} ${UI.linkHover} transition-colors ${isAdmin ? 'text-red-500 dark:text-red-500 hover:text-red-600' : ''}`}
                    title={isAdmin ? "Log Out" : "System Access"}
                  >
                    <Terminal className="w-4 h-4" />
                  </button>
                </div>
                <p className={`${UI.mono} ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'} mt-4`}>© 2026 MANAS SONTAKKE</p>
                <p className={`${UI.mono} ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'} text-[10px]`}>KANPUR, INDIA</p>
              </div>
            </div>
          </footer>
        </div>
      </div>
    );
  };

  return (
    <GlobalContentProvider>
      <InnerApp />
    </GlobalContentProvider>
  );
}

export default App;