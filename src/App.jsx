import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { auth, db, appId, isConfigValid } from './firebase';
import { UI } from './constants';
import ApartmentView from './components/GardenView'; // We use the file we named GardenView
import OfficeView from './components/OfficeView';     // We use OfficeView here
import { 
  Sun, Moon, X, AlertCircle, RefreshCcw, 
  Instagram, Twitter, Mail, Phone, Linkedin, Github, Cpu, Code2, Terminal 
} from 'lucide-react';

function App() {
  const [view, setView] = useState('apartment'); 
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
    bg: isDarkMode ? (view === 'apartment' ? 'bg-[#0e0e11]' : 'bg-[#0a0a0c]') : 'bg-[#fdfbf7]',
    textMain: isDarkMode ? 'text-zinc-200' : 'text-zinc-900',
    navBg: isDarkMode ? 'bg-zinc-900/60 border-white/5' : 'bg-[#fdfbf7]/80 border-[#e6e4dc]',
    border: isDarkMode ? 'border-white/5' : 'border-[#e6e4dc]'
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
              <button onClick={() => setView('apartment')} className={`px-4 py-2 rounded-lg ${UI.label} transition-all ${view === 'apartment' ? (isDarkMode ? 'bg-white text-black shadow-lg' : 'bg-white text-black shadow-sm') : 'opacity-60'}`}>Apartment</button>
              <button onClick={() => setView('pro')} className={`px-4 py-2 rounded-lg ${UI.label} transition-all ${view === 'pro' ? (isDarkMode ? 'bg-white text-black shadow-lg' : 'bg-white text-black shadow-sm') : 'opacity-60'}`}>Office</button>
            </div>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-3 rounded-xl bg-black/5 dark:bg-white/5 hover:opacity-70 transition-opacity">
              {isDarkMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-zinc-800" />}
            </button>
          </div>
        </nav>

        <main className="min-h-[600px]">
          {view === 'apartment' ? (
            <ApartmentView isAdmin={isAdmin} isDarkMode={isDarkMode} user={user} db={db} appId={appId} />
          ) : (
            <OfficeView isDarkMode={isDarkMode} db={db} appId={appId} />
          )}
        </main>

        <footer className={`mt-48 pt-20 border-t ${themeColors.border} pb-32 transition-all`}>
          <div className="flex flex-col md:flex-row justify-between items-start gap-20">
            <div className="space-y-8">
               <div className="flex items-center gap-4">
                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${view === 'apartment' ? 'bg-emerald-600' : 'bg-indigo-600'}`}>
                    <span className="text-white font-black italic text-lg">M</span>
                 </div>
                 <span className={`${UI.serif} text-2xl font-black tracking-tighter`}>Manas Sontakke</span>
               </div>
               <div className="flex gap-4 opacity-50">
                  {view === 'apartment' ? (
                    <>
                      <a href="#" className="p-3 bg-zinc-100 dark:bg-white/5 rounded-xl hover:text-pink-600 transition-all"><Instagram className="w-5 h-5" /></a>
                      <a href="#" className="p-3 bg-zinc-100 dark:bg-white/5 rounded-xl hover:text-sky-500 transition-all"><Twitter className="w-5 h-5" /></a>
                      <a href="#" className="p-3 bg-zinc-100 dark:bg-white/5 rounded-xl hover:text-emerald-600 transition-all"><Mail className="w-5 h-5" /></a>
                      <a href="#" className="p-3 bg-zinc-100 dark:bg-white/5 rounded-xl hover:text-green-600 transition-all"><Phone className="w-5 h-5" /></a>
                    </>
                  ) : (
                    <>
                      <a href="#" className="p-3 bg-zinc-100 dark:bg-white/5 rounded-xl hover:text-blue-600 transition-all"><Linkedin className="w-5 h-5" /></a>
                      <a href="#" className="p-3 bg-zinc-100 dark:bg-white/5 rounded-xl hover:text-white transition-all"><Github className="w-5 h-5" /></a>
                      <a href="#" className="p-3 bg-zinc-100 dark:bg-white/5 rounded-xl hover:text-indigo-600 transition-all"><Mail className="w-5 h-5" /></a>
                    </>
                  )}
               </div>
            </div>
            <div className="flex flex-col items-end gap-6">
               <p className={`${UI.mono} opacity-40`}>IIT Kanpur // Class of 2026</p>
               <div className={`inline-flex items-center gap-3 px-5 py-2 rounded-full border ${themeColors.border}`}>
                  <div className={`w-2 h-2 rounded-full animate-pulse ${view === 'apartment' ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                  <p className={UI.mono}>{user ? 'NODE_SECURE' : 'HANDSHAKE'}</p>
               </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;