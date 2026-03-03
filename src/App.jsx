import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { auth, isConfigValid } from './services/firebase';
import { UI } from './utils/constants';
import Journal from './pages/Journal';
import Profile from './pages/Profile';
import {
  Sun, Moon, X, AlertCircle, RefreshCcw,
  Instagram, Twitter, Mail, Phone, Linkedin, Github, Code2, Cpu, Terminal
} from 'lucide-react';

function App() {
  const [view, setView] = useState('journal');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    if (!auth) return;
    const init = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else { await signInAnonymously(auth); }
      } catch (e) {
        console.error("[App Auth] Firebase initialization/sign-in error:", e);
      }
    };
    init();
    return onAuthStateChanged(auth, setUser);
  }, []);

  const handleAuth = (e) => {
    e.preventDefault();
    if (adminKey === 'iitk2026') {
      setIsAdmin(true);
      setShowAuthModal(false);
      setAdminKey('');
    } else {
      console.warn("[App Auth] Invalid admin key attempt.");
      setAuthError(true);
      setTimeout(() => setAuthError(false), 2000);
    }
  };

  const themeColors = {
    bg: isDarkMode ? 'bg-[#151515]' : 'bg-[#F4F1EA]',
    textMain: isDarkMode ? 'text-[#EDEDED]' : 'text-[#232323]',
    textSub: isDarkMode ? 'text-zinc-500' : 'text-[#5A5A5A]',
    navBg: isDarkMode ? 'bg-[#151515]/80 border-white/10' : 'bg-[#F4F1EA]/80 border-black/5',
    border: isDarkMode ? 'border-white/10' : 'border-black/5'
  };

  if (!isConfigValid) return <div className="p-10 font-mono text-red-500">CONFIG ERROR: CHECK .ENV</div>;

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans ${themeColors.bg} ${themeColors.textMain} selection:bg-black selection:text-white ${isDarkMode ? 'dark' : ''}`}>

      {showAuthModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-md bg-white/60 dark:bg-black/80 animate-in fade-in">
          <div className={`w-full max-w-sm p-10 outline-none relative`}>
            <div className="flex justify-between items-center mb-12">
              <h3 className={`${UI.mono} text-zinc-400`}>ACCESS</h3>
              <X onClick={() => setShowAuthModal(false)} className="w-5 h-5 cursor-pointer text-zinc-400 hover:text-black dark:hover:text-white transition-colors" />
            </div>
            <form onSubmit={handleAuth} className="space-y-4">
              <input type="password" placeholder="KEY" value={adminKey} onChange={e => setAdminKey(e.target.value)} className={`w-full p-4 bg-transparent border-b outline-none text-center font-mono tracking-widest text-2xl transition-all ${authError ? 'border-red-500 text-red-500' : `border-zinc-300 dark:border-zinc-700 focus:border-black dark:focus:border-white ${themeColors.textMain}`}`} autoFocus />
            </form>
          </div>
        </div>
      )}

      <div className="relative max-w-[640px] mx-auto px-6 py-16 md:py-24">
        <nav className={`flex justify-between items-center mb-24 gap-4 z-50 transition-all`}>
          <div className="cursor-default select-none shrink-0">
            <div className="flex items-center gap-3">
              <span className={`font-sans font-semibold text-lg tracking-tight`}>Manas Sontakke</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className={`flex gap-4`}>
              <button onClick={() => setView('journal')} className={`${UI.label} transition-colors ${view === 'journal' ? themeColors.textMain : 'text-zinc-400 hover:text-black dark:hover:text-white'}`}>Journal</button>
              <button onClick={() => setView('profile')} className={`${UI.label} transition-colors ${view === 'profile' ? themeColors.textMain : 'text-zinc-400 hover:text-black dark:hover:text-white'}`}>Profile</button>
            </div>
            <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-800"></div>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-zinc-400 hover:text-black dark:hover:text-white transition-colors">
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </nav>

        <main className="w-full">
          {view === 'journal' ? (
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
              <div className="flex justify-center md:justify-start gap-8">
                {view === 'journal' ? (
                  <>
                    <a href="https://twitter.com/manas_sontakke" target="_blank" className={`${UI.mono} text-zinc-400 ${UI.linkHover}`}>TWITTER</a>
                    <a href="https://instagram.com/manas_sontakke" target="_blank" className={`${UI.mono} text-zinc-400 ${UI.linkHover}`}>INSTAGRAM</a>
                    <a href="mailto:sontakke.manas@gmail.com" className={`${UI.mono} text-zinc-400 ${UI.linkHover}`}>EMAIL</a>
                    <a href="#" className={`${UI.mono} text-zinc-400 ${UI.linkHover}`}>RSS</a>
                  </>
                ) : (
                  <>
                    <a href="https://github.com/manas-sontakke" target="_blank" className={`${UI.mono} text-zinc-400 ${UI.linkHover}`}>GITHUB</a>
                    <a href="https://linkedin.com/in/manas-sontakke" target="_blank" className={`${UI.mono} text-zinc-400 ${UI.linkHover}`}>LINKEDIN</a>
                    <a href="mailto:sontakke.manas@gmail.com" className={`${UI.mono} text-zinc-400 ${UI.linkHover}`}>EMAIL</a>
                  </>
                )}
              </div>
              <p className={`${UI.serif} text-zinc-500 text-sm max-w-sm leading-relaxed text-center md:text-left`}>
                This digital space is built using React, structured with Tailwind, and synced via Firebase. Deployed gracefully on Vercel.
              </p>
            </div>
            <div className="flex flex-col items-start md:items-end gap-2">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => isAdmin ? setIsAdmin(false) : setShowAuthModal(true)}
                  className={`text-zinc-600 dark:text-zinc-500 ${UI.linkHover} transition-colors ${isAdmin ? 'text-emerald-500 dark:text-emerald-500 hover:text-emerald-600' : ''}`}
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
}

export default App;