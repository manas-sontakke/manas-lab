import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signInAnonymously, signInWithEmailAndPassword, sendPasswordResetEmail, signOut, verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
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
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);

  // Added import for X at the top manually previously, ensuring it's available.
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Password Reset Handling (Magic Link interception)
  const [resetMode, setResetMode] = useState(false);
  const [oobCode, setOobCode] = useState(null);
  const [resetStatus, setResetStatus] = useState(null); // 'verifying' | 'valid' | 'invalid' | 'success' | 'error'
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    // 1. Check for incoming Firebase Magic Link (Password Reset)
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    const code = urlParams.get('oobCode');

    if (mode === 'resetPassword' && code) {
      setResetMode(true);
      setOobCode(code);
      setResetStatus('verifying');

      verifyPasswordResetCode(auth, code).then(() => {
        setResetStatus('valid');
      }).catch((e) => {
        console.error("Invalid or expired action code.", e);
        setResetStatus('invalid');
      });

      // Clean up URL instantly so it looks pristine
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // 2. Standard Auth Initialization
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (usr) => {
      setUser(usr);
      if (usr && !usr.isAnonymous && usr.email === 'sontakke.manas@gmail.com') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
        // Automatically ensure fallback anonymous sign-in
        if (!usr && !mode) {
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
      await signInWithEmailAndPassword(auth, 'sontakke.manas@gmail.com', password);
      setShowAuthModal(false);
      setPassword('');
      setAuthError(false);
    } catch (err) {
      console.error("[App Auth] Invalid credentials.", err);
      setAuthError(true);
      setTimeout(() => setAuthError(false), 3000);
    }
  };

  const handleForgotPassword = async () => {
    try {
      // Point the continue URL back to the current domain so the user stays natively inside our own UI.
      const actionCodeSettings = { url: window.location.origin, handleCodeInApp: true };
      await sendPasswordResetEmail(auth, 'sontakke.manas@gmail.com', actionCodeSettings);
      setResetSent(true);
      setTimeout(() => setResetSent(false), 4000);
    } catch (err) {
      console.error("[App Auth] Error sending reset email:", err);
    }
  };

  const executePasswordReset = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) { setResetStatus('error'); return; }

    setResetStatus('saving');
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setResetStatus('success');
      setTimeout(() => {
        setResetMode(false);
        setNewPassword('');
        // Automatically log them in with the new credentials
        signInWithEmailAndPassword(auth, 'sontakke.manas@gmail.com', newPassword).catch(() => setShowAuthModal(true));
      }, 2000);
    } catch (e) {
      console.error("Failed to reset password", e);
      setResetStatus('error');
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

  const InnerApp = () => {
    const { content } = useGlobalContent();
    return (
      <div className={`min-h-screen transition-colors duration-500 font-sans ${themeColors.bg} ${themeColors.textMain} selection:bg-black selection:text-white ${isDarkMode ? 'dark' : ''}`}>

        {/* --- Magic Link Password Reset Modal --- */}
        {resetMode && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/10 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className={`w-full max-w-[400px] bg-white dark:bg-[#1A1A1A] border border-black/5 dark:border-white/10 rounded-3xl p-8 shadow-2xl relative animate-in zoom-in-[0.98] duration-300`}>
              <div className="mb-8">
                <Lock className={`w-6 h-6 mb-4 ${themeColors.textMain}`} />
                <h2 className={`${UI.serif} text-2xl tracking-tight ${themeColors.textMain}`}>Reset Password</h2>
                <p className={`${UI.sans} text-sm text-zinc-500 mt-2`}>
                  {resetStatus === 'verifying' ? "Verifying secure link..." :
                    resetStatus === 'invalid' ? "This link has expired or is invalid." :
                      resetStatus === 'success' ? "Password successfully updated. Logging you in..." :
                        "Set your new system password."}
                </p>
              </div>

              {resetStatus !== 'verifying' && resetStatus !== 'invalid' && resetStatus !== 'success' && (
                <form onSubmit={executePasswordReset} className="space-y-6">
                  <input
                    type="password"
                    autoFocus
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setResetStatus('valid'); }}
                    placeholder="New Password (min. 6 chars)..."
                    className={`w-full bg-black/[0.02] dark:bg-white/[0.04] border ${resetStatus === 'error' ? 'border-red-500/50' : 'border-black/5 dark:border-white/10'} rounded-xl px-4 py-3 outline-none focus:border-black/20 dark:focus:border-white/20 transition-colors ${UI.sans} ${themeColors.textMain}`}
                  />
                  <button type="submit" disabled={resetStatus === 'saving'} className={`w-full flex items-center justify-center gap-2 ${UI.label} py-3.5 bg-[#1A1A1A] dark:bg-white/10 text-white dark:text-zinc-200 hover:opacity-80 transition-opacity rounded-xl`}>
                    {resetStatus === 'saving' ? "Saving..." : "Update Password"}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* --- Standard Login Modal --- */}
        {showAuthModal && !resetMode && (
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
                <div className="space-y-4">
                  <div>
                    <input
                      type="password"
                      autoFocus
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password..."
                      className={`w-full bg-black/[0.02] dark:bg-white/[0.04] border ${authError ? 'border-red-500/50 text-red-500' : 'border-black/5 dark:border-white/10'} rounded-xl px-4 py-3 outline-none focus:border-black/20 dark:focus:border-white/20 transition-colors ${UI.sans} ${themeColors.textMain}`}
                    />
                    {authError && <p className="text-red-500 text-xs mt-2 font-medium">Invalid credentials.</p>}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <button type="button" onClick={handleForgotPassword} className="text-xs font-medium text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 transition-colors">
                    {resetSent ? 'Recovery Email Sent to manas_sontakke...' : 'Forgot Password?'}
                  </button>
                  <button type="submit" className={`flex items-center gap-2 ${UI.label} px-5 py-2.5 bg-[#1A1A1A] dark:bg-white/10 text-white dark:text-zinc-200 hover:opacity-80 transition-opacity rounded-lg`}>
                    <Lock className="w-3.5 h-3.5" /> Login
                  </button>
                </div>
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
          <nav className={`flex justify-between items-center mb-24 gap-4 z-50 transition-all`}>
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