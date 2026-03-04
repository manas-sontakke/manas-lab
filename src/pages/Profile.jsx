import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '../services/firebase';
import { UI } from '../utils/constants';
import { User, Github, Linkedin, Mail, ShieldCheck, Code2, Globe, ExternalLink, MessageSquare, CheckCircle2, ArrowRight } from 'lucide-react';
import { useGlobalContent } from '../contexts/GlobalContentContext';

export default function Profile({ isDarkMode }) {
  const { content } = useGlobalContent();
  const navigate = useNavigate();
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
    } catch (err) {
      console.error("[Profile] Error submitting contact form:", err);
      setContactStatus('error');
    }
  };

  const themeColors = {
    card: 'bg-transparent',
    textMain: isDarkMode ? 'text-zinc-100' : 'text-[#1A1A1A]',
    textSub: isDarkMode ? 'text-zinc-500' : 'text-[#666666]'
  };

  return (
    <div className="animate-in fade-in duration-700 w-full pb-12">

      {/* Header Bio */}
      <section className="mb-12 mt-4 md:mt-8">
        <p className={`${UI.serif} text-[1.2rem] leading-[1.7] ${themeColors.textSub} max-w-xl whitespace-pre-wrap`}>
          {content?.profileBio || "A student exploring systems, code, and digital spaces."}
        </p>
        <div className="flex flex-wrap gap-6 mt-8">
          {(content?.socials || []).map(social => (
            <a key={social.platform} href={social.url} target="_blank" rel="noreferrer" className={`flex items-center gap-1.5 font-sans text-sm text-[#666666] ${UI.linkHover} capitalize`}>
              {social.platform.toLowerCase()}
            </a>
          ))}
        </div>
      </section>

      <div className="space-y-12">
        <section>
          <h3 className={`font-sans font-medium text-zinc-400 mb-4 uppercase tracking-[0.1em] text-[10px]`}>EXPERIENCE</h3>
          <div className={`flex flex-col glass-texture border border-black/5 dark:border-white/10 rounded-xl p-6 md:p-8 shadow-sm`}>
            {(content?.experience || []).map((exp, idx) => (
              <div key={exp.id || idx} className={`flex flex-col md:flex-row gap-2 md:gap-8 items-start md:items-baseline ${idx !== 0 ? 'mt-8 pt-8 border-t border-black/5 dark:border-white/5' : ''}`}>
                <span className={`font-sans text-zinc-400 text-sm md:text-[0.95rem] w-32 shrink-0`}>{exp.years}</span>
                <div>
                  <h4 className={`font-sans font-medium text-[0.95rem] md:text-[1rem] ${themeColors.textMain} mb-1`}>{exp.title}</h4>
                  <p className={`${UI.serif} text-[1.05rem] ${themeColors.textSub} leading-[1.6]`}>{exp.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className={`font-sans font-medium text-zinc-400 mb-4 uppercase tracking-[0.1em] text-[10px]`}>PROJECTS</h3>
          <div className={`flex flex-col glass-texture border border-black/5 dark:border-white/10 rounded-xl p-2 md:p-4 shadow-sm`}>
            {(content?.projects || []).map((proj, idx) => (
              <div
                key={proj.id || idx}
                onClick={() => navigate(`/project/${proj.id}`)}
                className={`group py-5 px-4 flex items-center gap-4 cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors rounded-lg ${idx !== (content?.projects?.length || 1) - 1 ? 'border-b border-black/[0.04] dark:border-white/[0.04] pb-5 mb-1' : ''}`}
              >
                <div className="flex-1 flex flex-col gap-1">
                  <h4 className={`font-sans font-medium text-[0.95rem] md:text-[1rem] ${themeColors.textMain} group-hover:opacity-70 transition-opacity`}>
                    {proj.title}
                  </h4>
                  <p className={`${UI.serif} text-[1.05rem] ${themeColors.textSub}`}>{proj.description}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-300 dark:text-zinc-700 shrink-0 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}