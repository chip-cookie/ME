import type { Component } from 'solid-js';
import { For } from 'solid-js';
import rawData from '../../data/portfolio.json';
import type { PortfolioData } from '../../types/portfolio';

const data = rawData as PortfolioData;

const Skills: Component = () => {
    return (
        <section class="fade-in-up scroll-mt-28" id="skills" style={{ "animation-delay": "0.3s" }}>
            <div class="flex items-center gap-4 mb-12 draw-border pb-4">
                <span class="px-3 py-1 bg-pastel-lavender text-purple-700 rounded-full text-xs font-bold tracking-widest uppercase">
                    03. Tech Stack
                </span>
                <h2 class="font-display text-4xl text-slate-800 font-black tracking-tight">보유 기술</h2>
            </div>

            <div class="w-full bg-[#576d85] rounded-3xl overflow-hidden shadow-2xl shadow-slate-300/50 border border-slate-400/30 mb-12 relative group/card">
                <div class="absolute top-0 right-0 w-[600px] h-[600px] bg-sky-300/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div class="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-300/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                <div class="flex flex-col md:flex-row">
                    <div class="p-8 md:p-12 md:w-5/12 flex flex-col justify-center relative z-10">
                        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-600/50 border border-slate-500/50 w-fit mb-6 shadow-sm backdrop-blur-sm">
                            <div class="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                            <span class="text-[11px] font-bold text-emerald-200 tracking-widest uppercase">Interactive Map</span>
                        </div>
                        <h3 class="text-3xl font-display font-bold text-white mb-4">Mind Map Visualization</h3>
                        <p class="text-slate-200 text-sm leading-relaxed mb-8 font-medium">
                            기술 스택 간의 유기적인 연결을 시각화했습니다. <span class="text-sky-200 font-bold">{data.profile.name}</span> 엔지니어의 핵심 역량이 중심이 되어 각 분야로 확장됩니다.
                        </p>
                        <div class="flex flex-wrap gap-2">
                            <span class="text-xs font-bold text-sky-100 bg-sky-800/30 px-3 py-2 rounded-lg border border-sky-500/30 backdrop-blur-sm">AI & Data</span>
                            <span class="text-xs font-bold text-purple-100 bg-purple-800/30 px-3 py-2 rounded-lg border border-purple-500/30 backdrop-blur-sm">Engineering</span>
                        </div>
                    </div>

                    <div class="bg-slate-600/30 md:w-7/12 min-h-[400px] relative border-l border-slate-500/30 overflow-hidden backdrop-blur-sm">
                        <div class="absolute inset-0 opacity-10" style={{ "background-image": "linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)", "background-size": "40px 40px" }} />
                        <div class="absolute inset-0 w-full h-full p-4 overflow-hidden" id="mindmap-container">
                            <svg class="absolute inset-0 w-full h-full pointer-events-none z-0" preserveAspectRatio="none" viewBox="0 0 100 100">
                                <defs>
                                    <filter height="200%" id="glow-blue" width="200%" x="-50%" y="-50%">
                                        <feGaussianBlur result="coloredBlur" stdDeviation="1" />
                                        <feMerge>
                                            <feMergeNode in="coloredBlur" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                </defs>
                                <path class="animate-pulse opacity-60" d="M 50 50 C 50 35, 30 50, 25 30" fill="none" stroke="#38bdf8" stroke-width="0.8" />
                                <path class="animate-pulse opacity-60" d="M 50 50 C 50 35, 70 50, 75 30" fill="none" stroke="#c084fc" stroke-width="0.8" />
                                <path class="animate-pulse opacity-60" d="M 50 50 C 50 65, 50 60, 50 75" fill="none" stroke="#fbbf24" stroke-width="0.8" />

                                <path d="M 25 30 L 15 20" fill="none" opacity="0.4" stroke="#38bdf8" stroke-dasharray="2 1" stroke-width="0.5" />
                                <path d="M 25 30 L 10 40" fill="none" opacity="0.4" stroke="#38bdf8" stroke-dasharray="2 1" stroke-width="0.5" />
                                <path d="M 25 30 L 30 15" fill="none" opacity="0.4" stroke="#38bdf8" stroke-dasharray="2 1" stroke-width="0.5" />

                                <path d="M 75 30 L 85 20" fill="none" opacity="0.4" stroke="#c084fc" stroke-dasharray="2 1" stroke-width="0.5" />
                                <path d="M 75 30 L 90 40" fill="none" opacity="0.4" stroke="#c084fc" stroke-dasharray="2 1" stroke-width="0.5" />

                                <path d="M 50 75 L 35 85" fill="none" opacity="0.4" stroke="#fbbf24" stroke-dasharray="2 1" stroke-width="0.5" />
                                <path d="M 50 75 L 65 85" fill="none" opacity="0.4" stroke="#fbbf24" stroke-dasharray="2 1" stroke-width="0.5" />
                            </svg>

                            <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
                                <div class="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.2)] border-2 border-white/50 z-20 relative animate-float">
                                    <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                                        <span class="material-symbols-outlined text-3xl text-slate-700">hub</span>
                                    </div>
                                </div>
                                <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white tracking-widest uppercase whitespace-nowrap bg-slate-900/50 px-2 py-0.5 rounded">
                                    AI & Data
                                </div>
                            </div>

                            {/* AI Node */}
                            <div class="absolute left-[25%] top-[30%] -translate-x-1/2 -translate-y-1/2 z-20 group cursor-pointer">
                                <div class="w-12 h-12 bg-sky-900/80 backdrop-blur rounded-full border border-sky-400 flex items-center justify-center shadow-[0_0_15px_rgba(56,189,248,0.4)] group-hover:scale-110 transition-transform group-hover:shadow-[0_0_25px_rgba(56,189,248,0.6)] animate-pulse-glow">
                                    <span class="material-symbols-outlined text-lg text-sky-200">psychology</span>
                                </div>
                                <span class="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-sky-200 font-bold whitespace-nowrap bg-sky-900/40 px-2 rounded">Deep Learning</span>
                            </div>

                            {/* CAD Node */}
                            <div class="absolute left-[75%] top-[30%] -translate-x-1/2 -translate-y-1/2 z-20 group cursor-pointer">
                                <div class="w-12 h-12 bg-purple-900/80 backdrop-blur rounded-full border border-purple-400 flex items-center justify-center shadow-[0_0_15px_rgba(192,132,252,0.4)] group-hover:scale-110 transition-transform group-hover:shadow-[0_0_25px_rgba(192,132,252,0.6)]">
                                    <span class="material-symbols-outlined text-lg text-purple-200">precision_manufacturing</span>
                                </div>
                                <span class="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-purple-200 font-bold whitespace-nowrap bg-purple-900/40 px-2 rounded">Design & CAD</span>
                            </div>

                            {/* Efficiency Node */}
                            <div class="absolute left-[50%] top-[75%] -translate-x-1/2 -translate-y-1/2 z-20 group cursor-pointer">
                                <div class="w-12 h-12 bg-amber-900/80 backdrop-blur rounded-full border border-amber-400 flex items-center justify-center shadow-[0_0_15px_rgba(251,191,36,0.4)] group-hover:scale-110 transition-transform group-hover:shadow-[0_0_25px_rgba(251,191,36,0.6)]">
                                    <span class="material-symbols-outlined text-lg text-amber-200">speed</span>
                                </div>
                                <span class="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-amber-200 font-bold whitespace-nowrap bg-amber-900/40 px-2 rounded">Optimization</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-white p-8 md:p-12 border border-stone-100 shadow-xl shadow-stone-200/50 rounded-3xl relative overflow-hidden">
                <div class="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-12">
                    <For each={data.skills}>
                        {(category, index) => (
                            <div class="space-y-8">
                                <h3 class={`font-display text-2xl font-bold text-slate-800 border-b-2 ${index() === 0 ? 'border-sky-100' : 'border-purple-100'} pb-3 inline-block`}>
                                    {category.title}
                                </h3>
                                <ul class="space-y-5">
                                    <For each={category.items}>
                                        {(skill) => (
                                            <li class={`flex items-center justify-between group p-3 hover:bg-${index() === 0 ? 'sky' : 'purple'}-50/50 rounded-xl transition-colors -mx-3`}>
                                                <div class="flex items-center gap-3">
                                                    <span class={`text-slate-600 font-bold group-hover:text-${index() === 0 ? 'sky' : 'purple'}-500 transition-colors`}>{skill.name}</span>
                                                </div>
                                                <span class={`px-2 py-1 ${skill.level === 'Expert' ? 'bg-rose-50 text-rose-600' : 'bg-sky-50 text-sky-600'} text-xs font-bold rounded uppercase tracking-wide border border-opacity-30`}>{skill.level}</span>
                                            </li>
                                        )}
                                    </For>
                                </ul>
                            </div>
                        )}
                    </For>

                    <div class="space-y-8">
                        <h3 class="font-display text-2xl font-bold text-slate-800 border-b-2 border-yellow-100 pb-3 inline-block">
                            자격증 및 수상
                        </h3>
                        <ul class="space-y-5">
                            <For each={data.awards}>
                                {(award) => (
                                    <li class="flex items-center justify-between group p-3 hover:bg-yellow-50/50 rounded-xl transition-colors -mx-3 relative">
                                        <div class="relative flex items-center">
                                            <span class="text-slate-600 font-bold group-hover:text-yellow-600 transition-colors z-10">{award.title}</span>
                                            <div class="absolute left-full top-1/2 -translate-y-1/2 ml-3 opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 ease-out whitespace-nowrap pointer-events-none flex items-center gap-2">
                                                <div class="w-6 h-6 rounded bg-white border border-stone-200 flex items-center justify-center text-stone-400 shadow-sm">
                                                    <span class="material-symbols-outlined text-[14px]">{award.type === 'Award' ? 'emoji_events' : 'badge'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <span class="px-2 py-1 bg-yellow-50 text-yellow-600 text-xs font-bold rounded uppercase tracking-wide border border-yellow-100 z-10 relative">{award.date}</span>
                                    </li>
                                )}
                            </For>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Skills;
