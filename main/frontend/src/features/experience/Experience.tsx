import type { Component } from 'solid-js';
import { For } from 'solid-js';
import rawData from '../../data/portfolio.json';
import type { PortfolioData } from '../../types/portfolio';

const data = rawData as PortfolioData;

const Experience: Component = () => {
    return (
        <section class="fade-in-up scroll-mt-28" id="experience" style={{ "animation-delay": "0.4s" }}>
            <div class="flex items-center gap-4 mb-20 draw-border pb-4">
                <span class="px-3 py-1 bg-pastel-peach text-orange-700 rounded-full text-xs font-bold tracking-widest uppercase">
                    04. Resume
                </span>
                <h2 class="font-display text-4xl text-slate-800 font-black tracking-tight">경력</h2>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 max-w-6xl mx-auto">
                {/* Experience */}
                <div class="relative">
                    <h3 class="flex items-center gap-3 font-display text-2xl font-bold text-slate-700 mb-8">
                        <span class="p-2 bg-sky-50 text-sky-500 rounded-lg material-symbols-outlined">work</span>
                        Experience
                    </h3>
                    <div class="overflow-y-auto h-[480px] pr-4 scrollbar-pastel relative -ml-4 pl-4 pt-2 pb-8">
                        <div class="relative space-y-12 min-h-full">
                            <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-100" />

                            {/* NOW */}
                            <div class="relative pl-12 group">
                                <div class="absolute left-0 top-1.5 w-8 h-8 flex items-center justify-center bg-pastel-cream z-10">
                                    <span class="absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-20 animate-ping" />
                                    <div class="relative bg-sky-500 rounded-full p-1.5 shadow-lg shadow-sky-200">
                                        <span class="material-symbols-outlined text-white text-[14px] leading-none animate-bounce">rocket_launch</span>
                                    </div>
                                </div>
                                <div class="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm hover:shadow-lg transition-all border-l-4 border-l-sky-400">
                                    <span class="text-xs font-bold text-sky-500 mb-1 block">NOW</span>
                                    <h4 class="text-xl font-bold text-slate-800">{data.profile.title} 구직 중</h4>
                                    <p class="text-slate-500 text-sm mt-2">최적화 및 효율화를 위한 새로운 도전을 준비하고 있습니다.</p>
                                </div>
                            </div>

                            <For each={data.projects}>
                                {(project) => (
                                    <div class="relative pl-12 group">
                                        <div class="absolute left-2 top-2 w-4 h-4 rounded-full bg-white border-4 border-slate-200 z-10 group-hover:border-sky-300 transition-colors" />
                                        <div class="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-all">
                                            <span class="text-xs font-bold text-slate-400 mb-1 block">{project.date}</span>
                                            <h4 class="text-xl font-bold text-slate-800">{project.title}</h4>
                                            <p class="text-slate-500 text-sm mt-2 line-clamp-2">{project.description}</p>
                                        </div>
                                    </div>
                                )}
                            </For>
                        </div>
                    </div>
                </div>

                {/* Education */}
                <div class="relative space-y-12">
                    <h3 class="flex items-center gap-3 font-display text-2xl font-bold text-slate-700">
                        <span class="p-2 bg-rose-50 text-rose-500 rounded-lg material-symbols-outlined">school</span>
                        Education
                    </h3>
                    <div class="absolute left-4 top-12 bottom-0 w-0.5 bg-slate-100" />

                    {/* 대학교 */}
                    <div class="relative pl-12 group">
                        <div class="absolute left-2 top-2 w-4 h-4 rounded-full bg-white border-4 border-slate-200 z-10 group-hover:border-rose-300 transition-colors" />
                        <div class="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-all">
                            <span class="text-xs font-bold text-slate-400 mb-1 block">2015.03 - 2018.02</span>
                            <h4 class="text-xl font-bold text-slate-800">대전고등학교 졸업</h4>
                            <p class="text-slate-500 text-sm mt-2">문과계열</p>
                        </div>
                    </div>

                    {/* 부트캠프 */}
                    <div class="relative pl-12 group">
                        <div class="absolute left-2 top-2 w-4 h-4 rounded-full bg-white border-4 border-slate-200 z-10 group-hover:border-rose-300 transition-colors" />
                        <div class="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-all">
                            <span class="text-xs font-bold text-slate-400 mb-1 block">2018.03 - 졸업</span>
                            <h4 class="text-xl font-bold text-slate-800">경운대학교 졸업</h4>
                            <p class="text-slate-500 text-sm mt-2">에너지소재공학과</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Experience;
