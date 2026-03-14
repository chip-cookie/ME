import type { Component } from 'solid-js';

const Navigation: Component = () => {
    return (
        <div class="sticky top-0 z-30 bg-pastel-cream/80 backdrop-blur-md border-b border-stone-100 px-8 lg:px-20 shadow-sm">
            <nav class="flex space-x-8 overflow-x-auto">
                <a
                    class="py-5 text-sm font-extrabold text-sky-500 border-b-4 border-sky-300 uppercase tracking-widest whitespace-nowrap"
                    href="#intro"
                >
                    소개
                </a>
                <a
                    class="py-5 text-sm font-bold text-slate-400 hover:text-sky-500 border-b-4 border-transparent hover:border-sky-200 transition-all uppercase tracking-widest whitespace-nowrap"
                    href="#projects"
                >
                    프로젝트
                </a>
                <a
                    class="py-5 text-sm font-bold text-slate-400 hover:text-sky-500 border-b-4 border-transparent hover:border-sky-200 transition-all uppercase tracking-widest whitespace-nowrap"
                    href="#skills"
                >
                    기술 스택
                </a>
                <a
                    class="py-5 text-sm font-bold text-slate-400 hover:text-sky-500 border-b-4 border-transparent hover:border-sky-200 transition-all uppercase tracking-widest whitespace-nowrap"
                    href="#experience"
                >
                    경력/학력
                </a>
                <a
                    class="py-5 text-sm font-bold text-slate-400 hover:text-sky-500 border-b-4 border-transparent hover:border-sky-200 transition-all uppercase tracking-widest whitespace-nowrap"
                    href="#docs"
                >
                    가이드
                </a>
            </nav>
        </div>
    );
};

export default Navigation;
