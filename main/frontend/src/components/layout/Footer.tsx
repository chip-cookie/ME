import type { Component } from 'solid-js';
import { exportToPDF } from '../../utils/print';
import rawData from '../../data/portfolio.json';
import type { PortfolioData } from '../../types/portfolio';

const data = rawData as PortfolioData;

const Footer: Component = () => {
    return (
        <footer class="pt-32 pb-16 text-center border-t border-stone-100">
            <div class="inline-block p-4 rounded-full bg-sky-50 mb-6 border border-sky-100">
                <span class="material-symbols-outlined text-4xl text-sky-400 animate-bounce-slow">handshake</span>
            </div>

            <h2 class="font-display text-4xl md:text-5xl font-black text-slate-800 mb-6 tracking-tight">
                성장의 기회를 찾고 있습니다
            </h2>

            <p class="text-slate-500 mb-12 max-w-lg mx-auto leading-relaxed text-lg">
                <span class="text-sky-500 font-bold">AI & Data Analysis</span>에 대한 열정으로 <span class="text-sky-500 font-bold">비즈니스 가치</span>를 창출하겠습니다. 언제든 편하게 연락주세요!
            </p>

            <div class="flex flex-col items-center gap-4">
                <button
                    onClick={exportToPDF}
                    class="inline-flex items-center gap-2 bg-rose-300 text-white font-bold py-5 px-12 rounded-full hover:shadow-2xl hover:scale-105 transition-all duration-300 shadow-xl shadow-rose-100/50 hover:bg-rose-400 group no-print"
                >
                    <span class="material-symbols-outlined group-hover:-translate-y-1 transition-transform duration-300">picture_as_pdf</span>
                    <span>PDF로 내보내기</span>
                </button>

                <a
                    class="flex items-center gap-1 text-slate-400 hover:text-sky-500 text-sm font-bold transition-colors mt-2"
                    href={`mailto:${data.profile.email}`}
                >
                    <span class="material-symbols-outlined text-base">mail</span>
                    <span>이메일 문의하기</span>
                </a>
            </div>

            <div class="mt-24 text-xs font-bold text-slate-400 uppercase tracking-widest">
                © {new Date().getFullYear()} {data.profile.name}. {data.profile.title} Portfolio.
            </div>
        </footer>
    );
};

export default Footer;
