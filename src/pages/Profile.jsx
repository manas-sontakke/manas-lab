import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '../services/firebase';
import { UI } from '../utils/constants';
import { User, Github, Linkedin, Mail, ShieldCheck, Code2, Globe, ExternalLink, MessageSquare, CheckCircle2 } from 'lucide-react';

export default function Profile({ isDarkMode }) {
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
    card: 'bg-transparent',
    textMain: isDarkMode ? 'text-zinc-100' : 'text-[#1A1A1A]',
    textSub: isDarkMode ? 'text-zinc-500' : 'text-[#666666]'
  };

  return (
    <div className="animate-in fade-in duration-700 w-full pb-32">

      {/* Header Bio */}
      <section className="mb-24 mt-8 md:mt-16">
        <p className={`${UI.serif} text-[1.2rem] leading-[1.7] ${themeColors.textSub} max-w-xl`}>
          Software Engineer and Undergraduate Researcher at IIT Kanpur. <br />
          Specializing in high-performance systems and digital architecture.
        </p>
        <div className="flex gap-6 mt-8">
          <a href="https://github.com/manas-sontakke" target="_blank" className={`flex items-center gap-1.5 font-sans text-sm text-[#666666] ${UI.linkHover}`}><Github className="w-3.5 h-3.5" /> GitHub</a>
          <a href="https://linkedin.com/in/manas-sontakke" target="_blank" className={`flex items-center gap-1.5 font-sans text-sm text-[#666666] ${UI.linkHover}`}><Linkedin className="w-3.5 h-3.5" /> LinkedIn</a>
          <a href="mailto:manass@iitk.ac.in" className={`flex items-center gap-1.5 font-sans text-sm text-[#666666] ${UI.linkHover}`}><Mail className="w-3.5 h-3.5" /> Email</a>
        </div>
      </section>

      <div className="space-y-12">
        <section>
          <h3 className={`font-sans font-medium text-zinc-400 mb-4 uppercase tracking-[0.1em] text-[10px]`}>EXPERIENCE</h3>
          <div className={`flex flex-col bg-white dark:bg-[#111111] border border-black/5 dark:border-white/5 rounded-xl p-6 md:p-8 shadow-sm`}>
            <div className="flex flex-col md:flex-row gap-2 md:gap-8 items-start md:items-baseline">
              <span className={`font-sans text-zinc-400 text-sm md:text-[0.95rem] w-32 shrink-0`}>2022 — 2026</span>
              <div>
                <h4 className={`font-sans font-medium text-[0.95rem] md:text-[1rem] ${themeColors.textMain} mb-1`}>IIT Kanpur</h4>
                <p className={`${UI.serif} text-[1.05rem] ${themeColors.textSub} leading-[1.6]`}>Bachelor of Technology in Comp Science. Researching efficiency.</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h3 className={`font-sans font-medium text-zinc-400 mb-4 uppercase tracking-[0.1em] text-[10px]`}>SELECTED WORK</h3>
          <div className={`flex flex-col bg-white dark:bg-[#111111] border border-black/5 dark:border-white/5 rounded-xl p-2 md:p-4 shadow-sm`}>
            {[
              { title: "Merge Optimization", desc: "Efficiency-first implementation of array logic with O(1) space." },
              { title: "Garden Engine", desc: "Real-time sync engine for collaborative archives." }
            ].map((proj, idx) => (
              <div key={proj.title} className={`group py-5 px-4 flex flex-col gap-1 cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors rounded-lg ${idx !== 1 ? 'border-b border-black/[0.04] dark:border-white/[0.04] pb-5 mb-1' : ''}`}>
                <h4 className={`font-sans font-medium text-[0.95rem] md:text-[1rem] ${themeColors.textMain} flex items-center gap-2 group-hover:opacity-70 transition-opacity`}>
                  {proj.title} <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400" />
                </h4>
                <p className={`${UI.serif} text-[1.05rem] ${themeColors.textSub}`}>{proj.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className={`font-sans font-medium text-zinc-400 mb-4 uppercase tracking-[0.1em] text-[10px]`}>CONTACT</h3>
          <div className={`bg-white dark:bg-[#111111] border border-black/5 dark:border-white/5 rounded-xl p-6 md:p-8 shadow-sm`}>
            <form onSubmit={submitContact} className="space-y-6 w-full max-w-xl">
              <input type="email" placeholder="Email Address" value={contactData.email} onChange={e => setContactData({ ...contactData, email: e.target.value })} className={`w-full p-2 bg-transparent border-b border-black/10 dark:border-white/10 outline-none font-sans text-[0.95rem] focus:border-black dark:focus:border-white transition-colors placeholder:text-zinc-400 ${themeColors.textMain}`} />
              <textarea placeholder="Your Message" value={contactData.message} onChange={e => setContactData({ ...contactData, message: e.target.value })} className={`w-full p-2 bg-transparent border-b border-black/10 dark:border-white/10 outline-none font-sans text-[0.95rem] h-24 resize-none focus:border-black dark:focus:border-white transition-colors placeholder:text-zinc-400 ${themeColors.textMain}`} />
              <div className="flex justify-start pt-4">
                <button disabled={contactStatus === 'sending'} className={`px-6 py-2 bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] font-sans text-xs font-medium uppercase tracking-wider rounded-full hover:opacity-80 transition-opacity`}>
                  {contactStatus === 'sending' ? 'Sending...' : contactStatus === 'success' ? 'Sent' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}