import React, { useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '../services/firebase';
import { UI } from '../utils/constants';
import { useGlobalContent } from '../contexts/GlobalContentContext';
import { Plus, X, Save, Trash2 } from 'lucide-react';

export default function AdminDashboard({ themeColors, isDarkMode }) {
    const { content, loading } = useGlobalContent();
    const [formData, setFormData] = useState(content);
    const [status, setStatus] = useState(null);

    // Sync incoming context to local specific state once loaded
    React.useEffect(() => {
        if (!loading && Object.keys(formData).length === 0) setFormData(content);
    }, [content, loading]);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!db) return;
        setStatus('saving');
        try {
            const settingsRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'main');
            await updateDoc(settingsRef, { ...formData, updatedAt: serverTimestamp() });
            setStatus('success');
            setTimeout(() => setStatus(null), 2000);
        } catch (error) {
            console.error("[Dashboard] Save error:", error);
            setStatus('error');
        }
    };

    const updateArray = (key, index, field, value) => {
        const newArr = [...formData[key]];
        newArr[index] = { ...newArr[index], [field]: value };
        setFormData({ ...formData, [key]: newArr });
    };

    const removeArrayItem = (key, index) => {
        const newArr = formData[key].filter((_, i) => i !== index);
        setFormData({ ...formData, [key]: newArr });
    };

    const addArrayItem = (key, emptyItem) => {
        const newArr = [...(formData[key] || []), { id: Date.now().toString(), ...emptyItem }];
        setFormData({ ...formData, [key]: newArr });
    };

    if (loading) return <div className="animate-pulse w-full h-32 bg-black/5 dark:bg-white/5 rounded-2xl" />;

    const inputClasses = `w-full bg-transparent border-b border-black/10 dark:border-white/10 focus:border-black dark:focus:border-white outline-none py-2 ${themeColors.textMain} ${UI.sans} transition-colors`;
    const labelClasses = `${UI.mono} text-zinc-400 mb-2 block`;
    const cardClasses = `flex flex-col bg-white dark:bg-[#1E1E1E] border border-black/5 dark:border-white/10 rounded-2xl p-6 shadow-sm mb-8`;

    return (
        <div className="animate-in fade-in duration-700 w-full mb-12">
            <header className="mb-12 flex justify-between items-end gap-8">
                <div>
                    <h1 className={`${UI.serif} text-3xl md:text-4xl ${themeColors.textMain}`}>Content Dashboard</h1>
                    <p className={`${UI.sans} text-zinc-500 mt-2`}>Manage your live portfolio content globally.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={status === 'saving'}
                    className={`flex items-center gap-2 ${UI.label} px-6 py-3 bg-[#1A1A1A] dark:bg-white/10 text-white dark:text-zinc-200 hover:opacity-80 transition-opacity rounded-full`}
                >
                    {status === 'saving' ? 'Saving...' : status === 'success' ? 'Saved' : <><Save className="w-4 h-4" /> Save Changes</>}
                </button>
            </header>

            <form className="space-y-8 pb-16">
                {/* Intro */}
                <section className={cardClasses}>
                    <h3 className={labelClasses}>JOURNAL INTRO</h3>
                    <textarea
                        className="w-full bg-transparent outline-none resize-none h-24 font-serif text-[1.2rem] leading-[1.6] text-black dark:text-white"
                        value={formData.journalIntro || ''}
                        onChange={e => setFormData({ ...formData, journalIntro: e.target.value })}
                    />
                </section>

                {/* Bio */}
                <section className={cardClasses}>
                    <h3 className={labelClasses}>PROFILE BIO</h3>
                    <textarea
                        className="w-full bg-transparent outline-none resize-none h-24 font-serif text-[1.2rem] leading-[1.6] text-black dark:text-white"
                        value={formData.profileBio || ''}
                        onChange={e => setFormData({ ...formData, profileBio: e.target.value })}
                    />
                </section>

                {/* Experience */}
                <section className={cardClasses}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className={`${UI.mono} text-zinc-400 m-0`}>EXPERIENCE TIMELINE</h3>
                        <button type="button" onClick={() => addArrayItem('experience', { years: '', title: '', description: '' })} className="text-zinc-500 hover:text-black dark:hover:text-white"><Plus className="w-4 h-4" /></button>
                    </div>
                    <div className="space-y-6">
                        {(formData.experience || []).map((exp, idx) => (
                            <div key={exp.id || idx} className="flex gap-3 md:gap-6 items-start border-l-2 border-black/5 dark:border-white/5 pl-4">
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <input placeholder="Years" className={inputClasses} value={exp.years} onChange={e => updateArray('experience', idx, 'years', e.target.value)} />
                                    <input placeholder="Title" className={`${inputClasses} md:col-span-1`} value={exp.title} onChange={e => updateArray('experience', idx, 'title', e.target.value)} />
                                    <input placeholder="Description" className={`${inputClasses} md:col-span-2`} value={exp.description} onChange={e => updateArray('experience', idx, 'description', e.target.value)} />
                                </div>
                                <button type="button" onClick={() => removeArrayItem('experience', idx)} className="text-zinc-400 hover:text-red-500 pt-2 shrink-0"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Projects */}
                <section className={cardClasses}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className={`${UI.mono} text-zinc-400 m-0`}>PROJECTS</h3>
                        <button type="button" onClick={() => addArrayItem('projects', { title: '', description: '' })} className="text-zinc-500 hover:text-black dark:hover:text-white"><Plus className="w-4 h-4" /></button>
                    </div>
                    <div className="space-y-6">
                        {(formData.projects || []).map((proj, idx) => (
                            <div key={proj.id || idx} className="flex gap-3 md:gap-6 items-start border-l-2 border-black/5 dark:border-white/5 pl-4">
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <input placeholder="Title" className={`${inputClasses} md:col-span-1`} value={proj.title} onChange={e => updateArray('projects', idx, 'title', e.target.value)} />
                                    <input placeholder="Description" className={`${inputClasses} md:col-span-2`} value={proj.description} onChange={e => updateArray('projects', idx, 'description', e.target.value)} />
                                </div>
                                <button type="button" onClick={() => removeArrayItem('projects', idx)} className="text-zinc-400 hover:text-red-500 pt-2 shrink-0"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Socials */}
                <section className={cardClasses}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className={`${UI.mono} text-zinc-400 m-0`}>SOCIAL LINKS</h3>
                        <button type="button" onClick={() => addArrayItem('socials', { platform: '', url: '' })} className="text-zinc-500 hover:text-black dark:hover:text-white"><Plus className="w-4 h-4" /></button>
                    </div>
                    <div className="space-y-6">
                        {(formData.socials || []).map((social, idx) => (
                            <div key={social.id || idx} className="flex gap-3 md:gap-6 items-start border-l-2 border-black/5 dark:border-white/5 pl-4">
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input placeholder="Platform (e.g. GITHUB)" className={inputClasses} value={social.platform} onChange={e => updateArray('socials', idx, 'platform', e.target.value.toUpperCase())} />
                                    <input placeholder="URL" className={inputClasses} value={social.url} onChange={e => updateArray('socials', idx, 'url', e.target.value)} />
                                </div>
                                <button type="button" onClick={() => removeArrayItem('socials', idx)} className="text-zinc-400 hover:text-red-500 pt-2 shrink-0"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        ))}
                    </div>
                </section>

            </form>
        </div>
    );
}
