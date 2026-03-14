import type { Component } from 'solid-js';
import rawData from '../../data/portfolio.json';
import type { PortfolioData } from '../../types/portfolio';

const data = rawData as PortfolioData;

const Sidebar: Component = () => {
    return (
        <aside class="w-full md:w-[320px] lg:w-[380px] md:h-screen md:sticky md:top-0 bg-gradient-to-b from-sky-50 via-white to-emerald-50 border-r border-slate-100 text-slate-600 flex flex-col justify-between relative z-20 shadow-xl">
            {/* 배경 장식 */}
            <div class="absolute -top-20 -right-20 w-64 h-64 bg-sky-100 opacity-40 rounded-full blur-3xl" />
            <div class="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-white/80 to-transparent" />

            <div class="p-8 lg:p-10 relative z-10 flex flex-col h-full justify-between">
                <div>
                    {/* 프로필 이미지 (고정) */}
                    <div class="w-28 h-28 mb-8 rounded-full border-4 border-sky-100 p-1 shadow-lg bg-white">
                        <img
                            alt="Profile Picture"
                            class="w-full h-full rounded-full object-cover"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAO3MEujArREHPbfp9RGbYfzmj-mhzCtVPeVehqcL4rNH9R8yIjgUtHVKcD-eyIOzVNJUpBz-KzbVdp7zHSvRwuEfOnREcU6IcEEs6-t2_mxhNmkePyzr07NubPNHj-lRybWuLU5smmCr0WYa0_swGYsk2Gi7V1U65m7Kk6aNuyW0MxCtNJQRU097p4QVCRrw5Qi8ZhfgE0jB8zSWaUXwuhgKst2anzciVt01SpLPBR4UBSjw5BcO1dhNJBFkoCnznVeLHKpVviWw4"
                        />
                    </div>

                    {/* 이름/직함 (데이터 연동) */}
                    <h1 class="font-display text-4xl font-black mb-2 tracking-tight text-slate-800 drop-shadow-sm">
                        {data.profile.name}
                    </h1>
                    <p class="text-sky-600 font-bold tracking-wider text-sm uppercase mb-8 bg-sky-100/50 border border-sky-100 inline-block px-3 py-1 rounded-full backdrop-blur-sm">
                        {data.profile.title}
                    </p>

                    {/* 소개 (데이터 연동) */}
                    <div class="space-y-6 border-t border-slate-100 pt-8">
                        <p class="font-body text-lg leading-relaxed text-slate-600 font-medium">
                            {data.profile.bio}
                        </p>
                        <div class="text-sm text-slate-500 font-normal leading-loose mt-4 bg-white/60 p-4 rounded-xl backdrop-blur-sm border border-slate-100 shadow-sm">
                            <p>👋 안녕하세요! 배움에 대한 열정으로 가득 찬 신입 개발자입니다. 함께 성장할 멋진 팀을 찾고 있습니다.</p>
                        </div>
                    </div>
                </div>

                {/* 이메일 (데이터 연동) */}
                <div class="space-y-4 text-sm font-medium tracking-wide text-slate-500 mt-12 md:mt-0">
                    <div class="flex items-center gap-3 hover:text-sky-600 hover:bg-white/80 p-2 rounded-xl transition-all cursor-pointer group -ml-2 border border-transparent hover:border-sky-50 hover:shadow-sm">
                        <span class="material-symbols-outlined group-hover:scale-110 transition-transform text-xl text-sky-400">mail</span>
                        <span>{data.profile.email}</span>
                    </div>
                    <div class="flex items-center gap-3 hover:text-sky-600 hover:bg-white/80 p-2 rounded-xl transition-all cursor-pointer group -ml-2 border border-transparent hover:border-sky-50 hover:shadow-sm">
                        <span class="material-symbols-outlined group-hover:scale-110 transition-transform text-xl text-sky-400">language</span>
                        <span>{data.profile.website}</span>
                    </div>
                    <div class="flex items-center gap-3 hover:text-sky-600 hover:bg-white/80 p-2 rounded-xl transition-all cursor-pointer group -ml-2 border border-transparent hover:border-sky-50 hover:shadow-sm">
                        <span class="material-symbols-outlined group-hover:scale-110 transition-transform text-xl text-sky-400">call</span>
                        <span>{data.profile.phone}</span>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
