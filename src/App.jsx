import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { auth, isConfigValid } from './firebase';
import { UI } from './constants';
import GardenView from './components/GardenView'; 
import OfficeView from './components/OfficeView';
import { 
  Sun, Moon, X, AlertCircle, RefreshCcw, 
  Instagram, Twitter, Mail, Phone, Linkedin, Github, Code2, Cpu, Terminal
} from 'lucide-react';

function App() {
  const [view, setView] = useState('garden'); 
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
    // The specific warm cream from your screenshot
    bg: isDarkMode ? (view === 'garden' ? 'bg-[#0e0e11]' : 'bg-[#0a0a0c]') : 'bg-[#F9F8F4]',
    textMain: isDarkMode ? 'text-zinc-200' : 'text-[#1A1A1A]',
    navBg: isDarkMode ? 'bg-zinc-900/60 border-white/5' : 'bg-white/80 border-[#E6E4DC]',
    border: isDarkMode ? 'border-white/5' : 'border-[#E6E4DC]'
  };

  if (!isConfigValid) return <div className="p-10 font-mono text-red-500">CONFIG ERROR: CHECK .ENV</div>;

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans ${themeColors.bg} ${themeColors.textMain} selection:bg-black selection:text-white`}>
      
      {showAuthModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-md bg-black/50 animate-in fade-in">
           <div className={`w-full max-w-sm p-8 rounded-3xl border shadow-xl ${isDarkMode ? 'bg-zinc-900 border-white/10' : 'bg-white border-zinc-200'}`}>
              <div className="flex justify-between items-center mb-8">
                 <h3 className={`${UI.mono} text-lg`}>SYSTEM_ACCESS</h3>
                 <X onClick={() => setShowAuthModal(false)} className="w-5 h-5 cursor-pointer opacity-50 hover:opacity-100" />
              </div>
              <form onSubmit={handleAuth} className="space-y-4">
                <input type="password" placeholder="KEY..." value={adminKey} onChange={e => setAdminKey(e.target.value)} className={`w-full p-4 bg-transparent border-b-2 outline-none text-center font-mono tracking-widest text-xl transition-all ${authError ? 'border-red-500 text-red-500' : 'border-zinc-200 dark:border-zinc-700 focus:border-black dark:focus:border-white'}`} autoFocus />
              </form>
           </div>
        </div>
      )}

      <div className="relative max-w-7xl mx-auto px-6 py-8 md:py-12 mt-8">
        <nav className={`flex flex-col md:flex-row justify-between items-start md:items-center mb-32 gap-8 sticky top-6 z-50 backdrop-blur-xl p-4 rounded-3xl border ${themeColors.border} shadow-sm`}>
          <div className="group cursor-pointer select-none" onClick={() => isAdmin ? setIsAdmin(false) : setShowAuthModal(true)}>
            <div className="flex flex-col">
              <span className={`${UI.heading} text-4xl tracking-tighter`}>MANAS</span>
              <div className="flex items-center gap-3">
                <span className={`${UI.heading} text-4xl text-transparent bg-clip-text bg-gradient-to-r from-zinc-400 to-zinc-600`}>SONTAKKE</span>
                {isAdmin && <span className="bg-black text-white dark:bg-white dark:text-black text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">Root</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6 self-end md:self-auto">
            <div className={`flex gap-2 p-1 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
              <button onClick={() => setView('garden')} className={`px-4 py-2 rounded-lg ${UI.label} transition-all ${view === 'garden' ? (isDarkMode ? 'bg-white text-black shadow-lg' : 'bg-white text-black shadow-sm') : 'opacity-60'}`}>Garden</button>
              <button onClick={() => setView('pro')} className={`px-4 py-2 rounded-lg ${UI.label} transition-all ${view === 'pro' ? (isDarkMode ? 'bg-white text-black shadow-lg' : 'bg-white text-black shadow-sm') : 'opacity-60'}`}>Office</button>
            </div>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-3 rounded-xl bg-black/5 dark:bg-white/5 hover:opacity-70 transition-opacity">
              {isDarkMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-zinc-800" />}
            </button>
          </div>
        </nav>

        <main className="min-h-[600px]">
          {view === 'garden' ? (
            <GardenView isAdmin={isAdmin} isDarkMode={isDarkMode} />
          ) : (
            <OfficeView isDarkMode={isDarkMode} />
          )}
        </main>

        <footer className={`mt-48 pt-16 border-t ${themeColors.border} pb-24`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-4">
            {/* Identity */}
            <div className="space-y-4">
              <span className={`${UI.serif} text-lg font-bold block`}>Manas Sontakke</span>
              <p className={`${UI.sans} text-zinc-500 text-xs max-w-[200px]`}>
                A digital archive and professional portfolio. Built with React & Firebase.
              </p>
              <p className={`${UI.mono} text-zinc-400`}>Kanpur, India</p>
            </div>

            {/* Sitemap */}
            <div className="space-y-4">
              <span className={UI.mono}>SITEMAP</span>
              <ul className={`space-y-2 ${UI.sans} text-zinc-500`}>
                <li><button onClick={() => setView('garden')} className="hover:text-black dark:hover:text-white transition-colors">Digital Garden</button></li>
                <li><button onClick={() => setView('pro')} className="hover:text-black dark:hover:text-white transition-colors">Professional Office</button></li>
                <li><span className="opacity-50">RSS Feed (Coming Soon)</span></li>
              </ul>
            </div>

            {/* Connect */}
            <div className="space-y-4">
              <span className={UI.mono}>CONNECT</span>
              <div className={`flex flex-col gap-2 ${UI.sans} text-zinc-500`}>
                {view === 'garden' ? (
                  <>
                    <a href="#" className="flex items-center gap-2 hover:text-black dark:hover:text-white transition-colors"><Instagram className="w-3 h-3" /> Instagram</a>
                    <a href="#" className="flex items-center gap-2 hover:text-black dark:hover:text-white transition-colors"><Twitter className="w-3 h-3" /> Twitter</a>
                    <a href="mailto:manass@iitk.ac.in" className="flex items-center gap-2 hover:text-black dark:hover:text-white transition-colors"><Mail className="w-3 h-3" /> Email</a>
                    <a href="#" className="flex items-center gap-2 hover:text-black dark:hover:text-white transition-colors"><Phone className="w-3 h-3" /> Phone</a>
                  </>
                ) : (
                  <>
                    <a href="#" className="flex items-center gap-2 hover:text-black dark:hover:text-white transition-colors"><Linkedin className="w-3 h-3" /> LinkedIn</a>
                    <a href="#" className="flex items-center gap-2 hover:text-black dark:hover:text-white transition-colors"><Github className="w-3 h-3" /> GitHub</a>
                    <a href="#" className="flex items-center gap-2 hover:text-black dark:hover:text-white transition-colors"><Mail className="w-3 h-3" /> Email</a>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t border-black/5 dark:border-white/5 flex justify-between items-center opacity-40">
             <p className={UI.mono}>© 2026 Manas Sontakke</p>
             <div className="flex gap-4">
               <Cpu className="w-4 h-4" />
               <Terminal className="w-4 h-4" />
               <Code2 className="w-4 h-4" />
             </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;