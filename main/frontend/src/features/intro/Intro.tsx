import type { Component } from 'solid-js';
import rawData from '../../data/portfolio.json';
import type { PortfolioData } from '../../types/portfolio';

const data = rawData as PortfolioData;

const Intro: Component = () => {
    return (
        <section class="fade-in-up scroll-mt-28" id="intro" style={{ "animation-delay": "0.1s" }}>
            <div class="flex items-center gap-4 mb-8 draw-border pb-4">
                <span class="px-3 py-1 bg-pastel-blue text-sky-700 rounded-full text-xs font-bold tracking-widest uppercase">
                    01. Hello World
                </span>
                <h2 class="font-display text-4xl text-slate-800 font-black tracking-tight">프로필 개요</h2>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div class="space-y-6">
                    <p class="text-slate-600 leading-relaxed text-xl font-medium">
                        안녕하세요, <span class="text-sky-600 font-bold bg-sky-50 px-1 rounded">데이터 기반의</span> 운영 효율성을 <span class="text-rose-400 font-bold bg-rose-50 px-1 rounded">이끌어내는</span> 엔지니어 <span class="text-slate-800 font-bold">{data.profile.name}</span>입니다.
                    </p>
                    <p class="text-slate-500 leading-relaxed text-lg">
                        {data.profile.bio}
                    </p>
                </div>

                <div class="bg-white p-8 rounded-2xl border border-stone-100 shadow-xl shadow-stone-200/50 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                    <div class="absolute top-0 right-0 w-32 h-32 bg-yellow-100 opacity-60 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <h3 class="font-display text-2xl font-bold mb-6 text-slate-800 flex items-center gap-2">
                        <span class="material-symbols-outlined text-rose-300">bolt</span> 핵심 역량
                    </h3>
                    <ul class="space-y-4">
                        <li class="flex items-center gap-3 text-slate-600 font-medium bg-stone-50/50 p-3 rounded-xl shadow-sm border border-stone-100 hover:bg-white transition-colors">
                            <div class="bg-indigo-50 p-2 rounded-lg text-indigo-400">
                                <span class="material-symbols-outlined text-xl">code</span>
                            </div>
                            <span>Python & PyTorch 활용 능력</span>
                        </li>
                        <li class="flex items-center gap-3 text-slate-600 font-medium bg-stone-50/50 p-3 rounded-xl shadow-sm border border-stone-100 hover:bg-white transition-colors">
                            <div class="bg-emerald-50 p-2 rounded-lg text-emerald-400">
                                <span class="material-symbols-outlined text-xl">speed</span>
                            </div>
                            <span>AI/Data 기반의 인사이트 도출</span>
                        </li>
                        <li class="flex items-center gap-3 text-slate-600 font-medium bg-stone-50/50 p-3 rounded-xl shadow-sm border border-stone-100 hover:bg-white transition-colors">
                            <div class="bg-rose-50 p-2 rounded-lg text-rose-400">
                                <span class="material-symbols-outlined text-xl">brush</span>
                            </div>
                            <span>CAD & 엔지니어링 설계</span>
                        </li>
                    </ul>
                </div>
            </div>
        </section>
    );
};

export default Intro;
