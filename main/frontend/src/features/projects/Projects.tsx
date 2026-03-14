import type { Component } from 'solid-js';
import { For } from 'solid-js';
import rawData from '../../data/portfolio.json';
import type { PortfolioData } from '../../types/portfolio';

const data = rawData as PortfolioData;

// 🔥 [핵심] 디자인 프리셋 고정 (AI가 건드리지 못함)
// 순서대로: 파랑(Sky) -> 초록(Emerald) -> 분홍(Rose) -> 보라(Violet) -> 노랑(Amber)
const STATIC_STYLES = [
    { primary: "sky", secondary: "indigo", icon: "pets" },
    { primary: "emerald", secondary: "teal", icon: "shopping_cart" },
    { primary: "rose", secondary: "orange", icon: "design_services" },
    { primary: "violet", secondary: "fuchsia", icon: "code" },
    { primary: "amber", secondary: "orange", icon: "lightbulb" }
];

const Projects: Component = () => {
    return (
        <section class="fade-in-up scroll-mt-28" id="projects">
            <div class="flex items-center gap-4 mb-12 draw-border pb-4">
                <span class="px-3 py-1 bg-pastel-mint text-emerald-700 rounded-full text-xs font-bold tracking-widest uppercase">
                    Selected Works
                </span>
                <h2 class="font-display text-4xl text-slate-800 font-black tracking-tight">주요 프로젝트</h2>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <For each={data.projects}>
                    {(project, index) => {
                        // 🔥 인덱스 기반 스타일 주입 로직
                        // 프로젝트 개수가 스타일 개수보다 많아도 계속 로테이션됨 (Modulo 연산)
                        const style = STATIC_STYLES[index() % STATIC_STYLES.length];
                        const { primary, secondary, icon } = style;

                        return (
                            <div class={`group bg-white rounded-3xl border border-stone-100 overflow-hidden transition-all duration-300 shadow-lg shadow-stone-200/40 hover:shadow-2xl hover:-translate-y-2 flex flex-col h-full hover:border-${primary}-200 hover:shadow-${primary}-100/50`}>

                                {/* 스타일(배경, 아이콘)은 STATIC_STYLES에서 적용 */}
                                <div class={`h-56 bg-gradient-to-br from-${primary}-50 to-${secondary}-50 relative overflow-hidden flex items-center justify-center`}>
                                    <div class="w-full h-full absolute inset-0 opacity-60"
                                        style={{
                                            "background-image": `radial-gradient(var(--tw-gradient-from) 1px, transparent 1px)`,
                                            "background-size": "16px 16px"
                                        }}
                                    />
                                    <div class={`relative z-10 w-20 h-20 bg-white/80 backdrop-blur rounded-2xl shadow-sm flex items-center justify-center text-${primary}-400 group-hover:scale-110 transition-transform duration-500`}>
                                        <span class="material-symbols-outlined text-5xl">{icon}</span>
                                    </div>
                                </div>

                                {/* 텍스트(내용)는 JSON 데이터에서 적용 */}
                                <div class="p-8 flex flex-col flex-1">
                                    <div class="mb-6">
                                        <h3 class={`font-display text-2xl font-bold text-slate-800 mb-3 transition-colors group-hover:text-${primary}-500`}>
                                            {project.title}
                                        </h3>
                                        <p class="text-slate-500 text-sm leading-relaxed line-clamp-3">
                                            {project.description}
                                        </p>
                                    </div>

                                    <div class="mt-auto">
                                        <div class="flex flex-wrap gap-2 mb-6">
                                            <For each={project.tags}>
                                                {(tag) => (
                                                    <span class={`px-3 py-1.5 bg-${primary}-50 text-${primary}-600 text-xs font-bold rounded-full border border-${primary}-100`}>
                                                        {tag.name}
                                                    </span>
                                                )}
                                            </For>
                                        </div>

                                        <a href={project.link} class="block w-full py-4 bg-slate-50 text-slate-500 hover:bg-rose-300 hover:text-white text-center text-sm font-bold uppercase tracking-wider rounded-xl transition-colors">
                                            View Details
                                        </a>
                                    </div>
                                </div>
                            </div>
                        );
                    }}
                </For>
            </div>
        </section>
    );
};

export default Projects;
