import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '../services/firebase';
import { UI } from '../utils/constants';
import { ArrowRight } from 'lucide-react';
import { useGlobalContent } from '../contexts/GlobalContentContext';

export default function Profile({ isDarkMode }) {
  const { content } = useGlobalContent();
  const navigate = useNavigate();

  const themeColors = {
    card: 'bg-transparent',
    textMain: isDarkMode ? 'text-zinc-100' : 'text-[#1A1A1A]',
    textSub: isDarkMode ? 'text-zinc-400' : 'text-[#666666]'
  };

  return (
    <div className="w-full pb-12">

      {/* Header Bio */}
      <section className="mb-12 mt-4 md:mt-8 px-3">
        <p className={`${UI.serif} text-[1.2rem] leading-[1.7] ${themeColors.textSub} max-w-xl whitespace-pre-wrap`}>
          {content?.profileBio || "A student exploring systems, code, and digital spaces."}
        </p>
        <p className={`${UI.serif} text-sm ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'} mt-6 italic`}>
          {content?.profileFooterNote || "For professional links and socials, scroll down to the footer ↓"}
        </p>
      </section>

      <div className="space-y-12">
        <section>
          <h3 className={`font-sans font-medium ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'} mb-4 uppercase tracking-[0.1em] text-[10px]`}>
            {content?.experienceLabel || 'EXPERIENCE'}
          </h3>
          <div className={`flex flex-col glass-texture border ${isDarkMode ? 'border-white/10' : 'border-black/8'} rounded-xl p-6 md:p-8 shadow-sm`}>
            {(content?.experience || []).map((exp, idx) => (
              <div key={exp.id || idx} className={`flex flex-col md:flex-row gap-2 md:gap-8 items-start md:items-baseline ${idx !== 0 ? `mt-8 pt-8 border-t ${isDarkMode ? 'border-white/8' : 'border-black/5'}` : ''}`}>
                <span className={`font-sans ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'} text-sm md:text-[0.95rem] w-32 shrink-0`}>{exp.years}</span>
                <div>
                  <h4 className={`font-sans font-medium text-[0.95rem] md:text-[1rem] ${themeColors.textMain} mb-1`}>{exp.title}</h4>
                  <p className={`${UI.serif} text-[1.05rem] ${themeColors.textSub} leading-[1.6]`}>{exp.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className={`font-sans font-medium ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'} mb-4 uppercase tracking-[0.1em] text-[10px]`}>
            {content?.projectsLabel || 'PROJECTS'}
          </h3>
          <div className={`flex flex-col glass-texture border ${isDarkMode ? 'border-white/10' : 'border-black/8'} rounded-xl p-2 md:p-4 shadow-sm`}>
            {(content?.projects || []).map((proj, idx) => (
              <div
                key={proj.id || idx}
                onClick={() => navigate(`/project/${proj.id}`)}
                className={`group py-5 px-4 flex items-center gap-4 cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors rounded-lg ${idx !== (content?.projects?.length || 1) - 1 ? `border-b ${isDarkMode ? 'border-white/5' : 'border-black/[0.04]'} pb-5 mb-1` : ''}`}
              >
                <div className="flex-1 flex flex-col gap-1">
                  <h4 className={`font-sans font-medium text-[0.95rem] md:text-[1rem] ${themeColors.textMain} group-hover:opacity-70 transition-opacity`}>
                    {proj.title}
                  </h4>
                  <p className={`${UI.serif} text-[1.05rem] ${themeColors.textSub}`}>{proj.description}</p>
                </div>
                <ArrowRight className={`w-4 h-4 ${isDarkMode ? 'text-zinc-700' : 'text-zinc-300'} shrink-0 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1`} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}