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
      } catch (e) { console.error(e); }
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
      setAuthError(true);
      setTimeout(() => setAuthError(false), 2000);
    }
  };

  const themeColors = {
    bg: isDarkMode ? 'bg-[#0A0A0A]' : 'bg-[#F4F1EA]',
    textMain: isDarkMode ? 'text-[#EDEDED]' : 'text-[#232323]',
    textSub: isDarkMode ? 'text-zinc-500' : 'text-[#5A5A5A]',
    navBg: isDarkMode ? 'bg-[#0A0A0A]/80 border-white/10' : 'bg-[#F4F1EA]/80 border-black/5',
    border: isDarkMode ? 'border-white/10' : 'border-black/5'
  };

  if (!isConfigValid) return <div className="p-10 font-mono text-red-500">CONFIG ERROR: CHECK .ENV</div>;

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans ${themeColors.bg} ${themeColors.textMain} selection:bg-black selection:text-white`}>

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

        <main className="min-h-[60vh]">
          {view === 'journal' ? (
            <Journal isAdmin={isAdmin} isDarkMode={isDarkMode} />
          ) : (
            <Profile isDarkMode={isDarkMode} />
          )}
        </main>

        <footer className={`mt-48 pt-12 border-t ${themeColors.border} pb-12 flex flex-col md:flex-row justify-between items-center gap-6`}>
          <div className="flex gap-8">
            <a href="https://github.com/manas-sontakke" target="_blank" className={`${UI.mono} text-zinc-400 ${UI.linkHover}`}>GITHUB</a>
            <a href="https://linkedin.com/in/manas-sontakke" target="_blank" className={`${UI.mono} text-zinc-400 ${UI.linkHover}`}>LINKEDIN</a>
            <a href="mailto:manass@iitk.ac.in" className={`${UI.mono} text-zinc-400 ${UI.linkHover}`}>EMAIL</a>
          </div>
          <div className="flex items-center gap-6">
            <p className={`${UI.mono} text-zinc-400`}>© 2026 MANAS SONTAKKE</p>
            <button
              onClick={() => isAdmin ? setIsAdmin(false) : setShowAuthModal(true)}
              className={`text-zinc-400 ${UI.linkHover} transition-colors ${isAdmin ? 'text-emerald-500 hover:text-emerald-600' : ''}`}
              title={isAdmin ? "Log Out" : "System Access"}
            >
              <Terminal className="w-3.5 h-3.5" />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;