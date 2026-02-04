import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '../firebase';
import { UI } from '../constants';
import { User, Github, Linkedin, Mail, ShieldCheck, Code2, Globe, ExternalLink, MessageSquare, CheckCircle2 } from 'lucide-react';

export default function OfficeView({ isDarkMode }) {
  const [contactData, setContactData] = useState({ name: '', email: '', message: '' });
  const [contactStatus, setContactStatus] = useState(null);

  const submitContact = async (e) => {
    e.preventDefault();
    if (!db) return;
    setContactStatus('sending');
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), { ...contactData, createdAt: serverTimestamp() });
      setContactStatus('success');
      setContactData({ name: '', email: '', message: '' });
      setTimeout(() => setContactStatus(null), 3000);
    } catch (err) { setContactStatus('error'); }
  };

  const themeColors = {
    card: isDarkMode ? 'bg-zinc-900/40 border-white/5 shadow-xl' : 'bg-white border-[#e6e4dc] shadow-xl',
    textMain: isDarkMode ? 'text-white' : 'text-zinc-900',
    textSub: isDarkMode ? 'text-zinc-400' : 'text-zinc-600',
    border: isDarkMode ? 'border-white/5' : 'border-[#e6e4dc]'
  };

  return (
    <div className="animate-in slide-in-from-bottom-10 fade-in duration-1000 block w-full bg-transparent min-h-[600px] pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
        <div className="lg:col-span-4 space-y-12">
          <section className={`${themeColors.card} p-12 rounded-[3rem] relative overflow-hidden border ${themeColors.border}`}>
             <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full ${isDarkMode ? 'bg-indigo-600/10' : 'bg-indigo-500/5'}`} />
             <div className="w-20 h-20 bg-gradient-to-tr from-indigo-600 to-blue-600 rounded-[2rem] mb-10 flex items-center justify-center shadow-xl shadow-indigo-500/20"><User className="w-8 h-8 text-white" /></div>
             <h1 className={`${UI.heading} text-4xl mb-4 ${themeColors.textMain}`}>Manas Sontakke</h1>
             <p className={`${UI.mono} text-indigo-600 mb-8`}>Software Engineer</p>
             <p className={`${themeColors.textSub} text-sm leading-relaxed mb-10 font-medium`}>Undergraduate researcher at IIT Kanpur. Focused on high-performance systems.</p>
             <div className="flex gap-4">
                {[{ Icon: Github, href: "https://github.com/manas-sontakke" }, { Icon: Linkedin, href: "https://linkedin.com/in/manas-sontakke" }, { Icon: Mail, href: "mailto:manass@iitk.ac.in" }].map((item, i) => (
                  <a key={i} href={item.href} target="_blank" rel="noreferrer" className={`w-12 h-12 rounded-2xl flex items-center justify-center border border-transparent hover:border-black/10 dark:hover:border-white/10 transition-all ${themeColors.textSub}`}><item.Icon className="w-5 h-5" /></a>
                ))}
             </div>
          </section>
          
          <section className="space-y-8 px-6">
             <h3 className={`${UI.mono} text-zinc-400`}>Stack</h3>
             {[
               { label: 'Systems', value: 'C++, OS Architecture' },
               { label: 'Fullstack', value: 'React, Node.js, Firebase' },
               { label: 'Core', value: 'Data Structures' }
             ].map(item => (
               <div key={item.label} className={`border-l-2 ${isDarkMode ? 'border-white/10' : 'border-black/10'} pl-6 py-1`}>
                  <p className="text-[10px] opacity-40 uppercase font-bold mb-1">{item.label}</p>
                  <p className={`text-sm font-bold ${themeColors.textMain}`}>{item.value}</p>
               </div>
             ))}
          </section>
        </div>

        <div className="lg:col-span-8 space-y-24">
           <section>
              <h3 className={`${UI.mono} mb-12 flex items-center gap-4 text-zinc-400`}><ShieldCheck className="w-4 h-4" /> Milestones</h3>
              <div className={`relative pl-12 border-l-2 ${isDarkMode ? 'border-white/10' : 'border-black/5'}`}>
                 <div className="absolute top-0 left-[-5px] w-2.5 h-2.5 bg-indigo-600 rounded-full shadow-lg" />
                 <h4 className={`${UI.serif} text-4xl font-black mb-4 tracking-tight ${themeColors.textMain}`}>IIT Kanpur</h4>
                 <span className="inline-block bg-indigo-500/10 text-indigo-600 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase mb-6">Class of 2026</span>
              </div>
           </section>

           <section>
              <h3 className={`${UI.mono} mb-12 flex items-center gap-4 text-zinc-400`}><Code2 className="w-4 h-4" /> Engineering</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className={`${themeColors.card} p-10 rounded-[3rem] hover:translate-y-[-6px] transition-all group border ${themeColors.border}`}>
                    <Code2 className="w-8 h-8 text-indigo-500 mb-8 opacity-40" />
                    <h4 className={`${UI.heading} text-2xl mb-4 ${themeColors.textMain}`}>Merge Algo</h4>
                    <p className={`${themeColors.textSub} text-sm leading-relaxed mb-8`}>Efficiency-first implementation of array logic.</p>
                    <button className={`flex items-center gap-3 ${UI.label} text-indigo-600 hover:opacity-80 transition-all`}>View Logic <ExternalLink className="w-3 h-3" /></button>
                 </div>
                 <div className={`${themeColors.card} p-10 rounded-[3rem] hover:translate-y-[-6px] transition-all group border ${themeColors.border}`}>
                    <Globe className="w-8 h-8 text-indigo-500 mb-8 opacity-40" />
                    <h4 className={`${UI.heading} text-2xl mb-4 ${themeColors.textMain}`}>Garden Engine</h4>
                    <p className={`${themeColors.textSub} text-sm leading-relaxed mb-8`}>Real-time sync engine for collaborative archives.</p>
                    <button className={`flex items-center gap-3 ${UI.label} text-indigo-600 hover:opacity-80 transition-all`}>Docs <ExternalLink className="w-3 h-3" /></button>
                 </div>
              </div>
           </section>

           <section className={`${themeColors.card} p-12 rounded-[3rem] relative shadow-xl overflow-hidden border ${themeColors.border}`}>
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 to-blue-600" />
              <div className="flex items-center gap-6 mb-12">
                 <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center"><MessageSquare className="w-6 h-6 text-indigo-600" /></div>
                 <div><h3 className={`${UI.heading} text-3xl ${themeColors.textMain}`}>Connect</h3><p className={`${UI.mono} text-zinc-400 mt-2`}>Direct Transmission</p></div>
              </div>
              <form onSubmit={submitContact} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <input type="text" placeholder="Identity" value={contactData.name} onChange={e => setContactData({...contactData, name: e.target.value})} className={`rounded-xl p-4 text-sm outline-none border bg-transparent focus:border-indigo-500 transition-all ${isDarkMode ? 'border-white/10' : 'border-black/10'}`} />
                 <input type="email" placeholder="Email" value={contactData.email} onChange={e => setContactData({...contactData, email: e.target.value})} className={`rounded-xl p-4 text-sm outline-none border bg-transparent focus:border-indigo-500 transition-all ${isDarkMode ? 'border-white/10' : 'border-black/10'}`} />
                 <textarea placeholder="Transmission..." value={contactData.message} onChange={e => setContactData({...contactData, message: e.target.value})} className={`md:col-span-2 rounded-xl p-4 text-sm outline-none h-32 resize-none border bg-transparent focus:border-indigo-500 transition-all ${isDarkMode ? 'border-white/10' : 'border-black/10'}`} />
                 <button disabled={contactStatus === 'sending'} className={`md:col-span-2 py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all shadow-lg ${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'}`}>{contactStatus === 'sending' ? 'Transmitting...' : 'Send Message'}</button>
              </form>
           </section>
        </div>
      </div>
    </div>
  );
}