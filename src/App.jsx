import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signInAnonymously, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth, isConfigValid } from './services/firebase';
import { UI } from './utils/constants';
import Journal from './pages/Journal';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import { GlobalContentProvider, useGlobalContent } from './contexts/GlobalContentContext';
import {
  Sun, Moon, X, AlertCircle, RefreshCcw, Lock,
  Instagram, Twitter, Mail, Phone, Linkedin, Github, Code2, Cpu, Terminal
} from 'lucide-react';

function App() {
  const [view, setView] = useState('journal');
  const [isDarkMode, setIsDarkMode] = useState(true);
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

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
      setShowAuthModal(false);
      setAuthError(false);
    } catch (err) {
      console.error("[App Auth] Google Sign-In failed.", err);
      setAuthError(true);
      setTimeout(() => setAuthError(false), 3000);
    }
  };

  // Removed handleForgotPassword since we are strictly using Google OAuth now.

  const themeColors = {
    bg: isDarkMode ? 'bg-[#151515]' : 'bg-[#F4F1EA]',
    textMain: isDarkMode ? 'text-[#EDEDED]' : 'text-[#232323]',
    textSub: isDarkMode ? 'text-zinc-500' : 'text-[#5A5A5A]',
    navBg: isDarkMode ? 'bg-[#151515]/80 border-white/10' : 'bg-[#F4F1EA]/80 border-black/5',
    border: isDarkMode ? 'border-white/10' : 'border-black/5'
  };

  if (!isConfigValid) return <div className="p-10 font-mono text-red-500">CONFIG ERROR: CHECK .ENV</div>;

  const InnerApp = () => {
    const { content } = useGlobalContent();
    return (
      <div className={`min-h-screen transition-colors duration-500 font-sans ${themeColors.bg} ${themeColors.textMain} selection:bg-black selection:text-white ${isDarkMode ? 'dark' : ''}`}>

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
                <p className={`${UI.sans} text-sm text-zinc-500 mt-2`}>Authenticate to manage the digital garden.</p>
              </div>

              <form onSubmit={handleAuth} className="space-y-6">
                <button type="submit" className={`w-full flex items-center justify-center gap-3 ${UI.label} py-3.5 bg-white dark:bg-[#2A2A2A] text-black dark:text-zinc-200 border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors rounded-xl`}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                  Connect with Google
                </button>
                {authError && <p className="text-red-500 text-xs text-center font-medium mt-4">Authentication failed. Please use sontakke.manas@gmail.com</p>}
              </form>
            </div>
          </div>
        )}

        {/* Global Admin Indicator */}
        {isAdmin && (
          <div className="fixed left-0 top-0 bottom-0 w-8 md:w-10 bg-[#1A1A1A]/5 dark:bg-[#1A1A1A]/50 border-r border-[#1A1A1A]/10 dark:border-white/5 flex flex-col items-center justify-center z-[150] shadow-[10px_0_30px_rgba(0,0,0,0.03)] dark:shadow-none backdrop-blur-sm">
            <span className="[writing-mode:vertical-lr] rotate-180 uppercase text-[10px] md:text-[11px] tracking-[0.2em] font-mono text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              ADMIN MODE
            </span>
          </div>
        )}

        <div className="relative max-w-[640px] mx-auto px-6 py-16 md:py-24">
          <nav className={`flex justify-between items-center mb-20 gap-4 z-50 transition-all px-6 py-4 rounded-2xl border shadow-sm glass-texture ${isDarkMode ? 'border-white/10' : 'border-black/5'}`}>
            <div className="cursor-default select-none shrink-0">
              <div className="flex items-center gap-3">
                <span className={`font-sans font-semibold text-lg tracking-tight`} onClick={() => setView('journal')}>Manas Sontakke</span>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className={`flex gap-4`}>
                {isAdmin && (
                  <button onClick={() => setView('dashboard')} className={`${UI.label} transition-colors ${view === 'dashboard' ? themeColors.textMain : 'text-zinc-400 hover:text-black dark:hover:text-white'}`}>Dashboard</button>
                )}
                <button onClick={() => setView('journal')} className={`${UI.label} transition-colors ${view === 'journal' ? themeColors.textMain : 'text-zinc-400 hover:text-black dark:hover:text-white'}`}>Journal</button>
                <button onClick={() => setView('profile')} className={`${UI.label} transition-colors ${view === 'profile' ? themeColors.textMain : 'text-zinc-400 hover:text-black dark:hover:text-white'}`}>Profile</button>
              </div>
              <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-800"></div>
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-zinc-400 hover:text-black dark:hover:text-white transition-colors">
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </nav>

          <main className="w-full min-h-[50vh]">
            {view === 'dashboard' && isAdmin ? (
              <AdminDashboard themeColors={themeColors} isDarkMode={isDarkMode} />
            ) : view === 'journal' ? (
              <Journal isAdmin={isAdmin} isDarkMode={isDarkMode} />
            ) : (
              <Profile isDarkMode={isDarkMode} />
            )}
          </main>

          <footer className={`mt-16 pt-10 border-t ${themeColors.border} pb-12 flex flex-col items-center md:items-start justify-between gap-12`}>
            {/* Reangdeba Style Contact Card */}
            <div className="w-full flex flex-col md:flex-row items-center justify-between p-6 md:p-8 rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#1E1E1E] shadow-sm mb-8">
              <span className={`${UI.sans} text-[1.1rem] ${themeColors.textMain}`}>Have something to say? Send me an email.</span>
              <a href="mailto:sontakke.manas@gmail.com" className="mt-4 md:mt-0 px-6 py-2.5 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-lg font-sans font-medium transition-colors">
                Email me →
              </a>
            </div>

            <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-end gap-12 md:gap-6">
              <div className="flex flex-col gap-6 w-full md:w-auto">
                <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-8">
                  {(content?.socials || []).map((social) => (
                    <a key={social.platform} href={social.url} target="_blank" rel="noreferrer" className={`${UI.mono} text-zinc-400 ${UI.linkHover}`}>
                      {social.platform}
                    </a>
                  ))}
                  <a href="mailto:sontakke.manas@gmail.com" className={`${UI.mono} text-zinc-400 ${UI.linkHover}`}>EMAIL</a>
                </div>
                <p className={`${UI.serif} text-zinc-500 text-sm max-w-sm leading-relaxed text-center md:text-left`}>
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
                    className={`text-zinc-600 dark:text-zinc-500 ${UI.linkHover} transition-colors ${isAdmin ? 'text-red-500 dark:text-red-500 hover:text-red-600' : ''}`}
                    title={isAdmin ? "Log Out" : "System Access"}
                  >
                    <Terminal className="w-4 h-4" />
                  </button>
                </div>
                <p className={`${UI.mono} text-zinc-400 mt-4`}>© 2026 MANAS SONTAKKE</p>
                <p className={`${UI.mono} text-zinc-500 text-[10px]`}>KANPUR, INDIA</p>
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