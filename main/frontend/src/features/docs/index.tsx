import type { Component } from 'solid-js';

const Docs: Component = () => {
    return (
        <section id="docs" class="space-y-12">
            <div class="space-y-4">
                <h2 class="text-3xl font-black text-slate-800 tracking-tight">
                    <span class="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-sky-600">
                        CSS Guides
                    </span>
                </h2>
                <div class="h-1.5 w-20 bg-sky-400 rounded-full" />
            </div>

            {/* Page Header */}
            <div class="flex flex-col gap-4 border-b border-slate-200 pb-6">
                <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div class="flex flex-col gap-2">
                        <h1 class="text-slate-900 text-3xl md:text-4xl font-black leading-tight tracking-tight">
                            인쇄 최적화 CSS 가이드 및 설정
                        </h1>
                        <p class="text-slate-500 text-base md:text-lg">
                            SolidJS 포트폴리오를 PDF로 저장하거나 인쇄할 때 완벽한 레이아웃을 유지하기 위한 기술 문서입니다.
                        </p>
                    </div>
                    <div class="flex items-start pt-1">
                        <button
                            class="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 text-sm font-bold hover:bg-slate-50 transition-all shadow-sm"
                            onClick={() => window.print()}
                        >
                            <span class="material-symbols-outlined text-[20px]">print</span>
                            <span>Print Preview</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Intro Text */}
            <div class="bg-sky-50 border border-sky-100 rounded-xl p-5 flex items-start gap-3">
                <span class="material-symbols-outlined text-sky-500 mt-0.5">info</span>
                <p class="text-slate-700 text-base leading-relaxed">
                    <strong>Why Print Styles?</strong> 개발자 포트폴리오를 웹 링크뿐만 아니라 PDF 형식으로 제출해야 하는 경우가 많습니다.
                    브라우저의 기본 인쇄 설정에 의존하면 레이아웃이 깨지거나 불필요한 요소(네비게이션, 버튼 등)가 포함될 수 있습니다.
                    아래 설정을 <code>global.css</code> 또는 별도의 <code>print.css</code> 파일에 추가하여 깔끔한 문서를 생성하세요.
                </p>
            </div>

            {/* Section 1: Basic Setup */}
            <section class="flex flex-col gap-4 mt-4">
                <h2 class="text-slate-800 text-2xl font-bold flex items-center gap-2">
                    <span class="flex items-center justify-center size-8 rounded-full bg-sky-100 text-sky-600 text-sm font-black">1</span>
                    기본 설정 및 페이지 규격
                </h2>
                <p class="text-slate-500 text-base">
                    인쇄 매체(Media Query)를 감지하고 A4 용지 규격에 맞춰 여백을 초기화합니다. 배경색을 강제로 출력하도록 설정하여 다크모드 대응을 해제하거나 특정 배경 스타일을 유지합니다.
                </p>
                {/* Code Editor Window */}
                <div class="w-full rounded-xl overflow-hidden shadow-lg border border-slate-200 bg-slate-900">
                    <div class="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
                        <div class="flex items-center gap-1.5">
                            <div class="size-3 rounded-full bg-rose-500"></div>
                            <div class="size-3 rounded-full bg-amber-500"></div>
                            <div class="size-3 rounded-full bg-emerald-500"></div>
                        </div>
                        <span class="text-xs text-slate-400 font-mono">styles/print.css</span>
                        <div class="w-10"></div>
                    </div>
                    <div class="p-4 overflow-x-auto bg-slate-900">
                        <pre class="font-mono text-sm leading-6 text-slate-300">
                            <span class="text-purple-400">@media</span> <span class="text-blue-300">print</span> {'{'}
                            {`  /* A4 용지 규격 및 여백 설정 */
  `}
                            <span class="text-purple-400">@page</span> {'{'}
                            {`    `}
                            <span class="text-sky-300">margin</span>: <span class="text-rose-300">1cm</span>;
                            {`    `}
                            <span class="text-sky-300">size</span>: <span class="text-rose-300">A4 portrait</span>;
                            {`  }

  /* 배경 그래픽 강제 출력 (Chrome/Safari/Edge) */
  `}
                            <span class="text-blue-300">body</span> {'{'}
                            {`    `}
                            <span class="text-sky-300">-webkit-print-color-adjust</span>: <span class="text-rose-300">exact</span> <span class="text-purple-400">!important</span>;
                            {`    `}
                            <span class="text-sky-300">print-color-adjust</span>: <span class="text-rose-300">exact</span> <span class="text-purple-400">!important</span>;
                            {`    `}
                            <span class="text-sky-300">background-color</span>: <span class="text-rose-300">#ffffff</span> <span class="text-purple-400">!important</span>;
                            {`  }
}`}
                        </pre>
                    </div>
                </div>
            </section>

            {/* Section 2: Typography & Visibility */}
            <section class="flex flex-col gap-4 mt-8">
                <h2 class="text-slate-800 text-2xl font-bold flex items-center gap-2">
                    <span class="flex items-center justify-center size-8 rounded-full bg-sky-100 text-sky-600 text-sm font-black">2</span>
                    가독성 및 요소 숨김 처리
                </h2>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="flex flex-col gap-3">
                        <h3 class="text-lg font-bold text-slate-800">타이포그래피 설정</h3>
                        <p class="text-slate-500 text-sm">
                            스크린용 픽셀(px) 단위 대신 인쇄에 적합한 포인트(pt) 단위를 사용합니다. 잉크 절약을 위해 텍스트는 검정색(#000) 또는 짙은 회색(#1a1a1a)으로 고정합니다.
                        </p>
                        <div class="rounded-lg bg-slate-900 p-4 border border-slate-200 mt-2 flex-1">
                            <pre class="font-mono text-xs leading-5 text-slate-300">
                                <span class="text-blue-300">html</span> {'{'}<br />
                                {'  '}<span class="text-sky-300">font-size</span>: <span class="text-rose-300">11pt</span>;<br />
                                {'}'}<br /><br />
                                <span class="text-blue-300">h1, h2, h3</span> {'{'}<br />
                                {'  '}<span class="text-sky-300">color</span>: <span class="text-rose-300">#000000</span> <span class="text-purple-400">!important</span>;<br />
                                {'  '}<span class="text-sky-300">page-break-after</span>: <span class="text-rose-300">avoid</span>;<br />
                                {'}'}<br /><br />
                                <span class="text-blue-300">p</span> {'{'}<br />
                                {'  '}<span class="text-sky-300">color</span>: <span class="text-rose-300">#1f2937</span>;<br />
                                {'  '}<span class="text-sky-300">line-height</span>: <span class="text-rose-300">1.6</span>;<br />
                                {'}'}
                            </pre>
                        </div>
                    </div>
                    <div class="flex flex-col gap-3">
                        <h3 class="text-lg font-bold text-slate-800">불필요한 UI 숨김</h3>
                        <p class="text-slate-500 text-sm">
                            네비게이션 바, 사이드바, 버튼, 그림자 등 문서의 내용과 관계없는 인터랙션 요소를 제거합니다.
                        </p>
                        <div class="rounded-lg bg-slate-900 p-4 border border-slate-200 mt-2 flex-1">
                            <pre class="font-mono text-xs leading-5 text-slate-300">
                                <span class="text-slate-500">/* 네비게이션 및 버튼 숨김 */</span><br />
                                <span class="text-blue-300">nav, header, footer, button</span> {'{'}<br />
                                {'  '}<span class="text-sky-300">display</span>: <span class="text-rose-300">none</span> <span class="text-purple-400">!important</span>;<br />
                                {'}'}<br /><br />
                                <span class="text-slate-500">/* 그림자 제거 */</span><br />
                                <span class="text-blue-300">*</span> {'{'}<br />
                                {'  '}<span class="text-sky-300">box-shadow</span>: <span class="text-rose-300">none</span> <span class="text-purple-400">!important</span>;<br />
                                {'  '}<span class="text-sky-300">text-shadow</span>: <span class="text-rose-300">none</span> <span class="text-purple-400">!important</span>;<br />
                                {'}'}
                            </pre>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 3: Page Breaks */}
            <section class="flex flex-col gap-4 mt-8 pb-10">
                <h2 class="text-slate-800 text-2xl font-bold flex items-center gap-2">
                    <span class="flex items-center justify-center size-8 rounded-full bg-sky-100 text-sky-600 text-sm font-black">3</span>
                    레이아웃 깨짐 및 페이지 넘김 방지
                </h2>
                <p class="text-slate-500 text-base">
                    프로젝트 카드나 섹션이 페이지 중간에 잘리는 것을 방지하기 위해 <code>break-inside</code> 속성을 활용합니다. Grid나 Flex 레이아웃이 인쇄 시 깨지는 것을 방지하기 위해 <code>block</code>으로 전환하는 것이 안전합니다.
                </p>
                <div class="w-full rounded-xl overflow-hidden shadow-lg border border-slate-200 bg-slate-900">
                    <div class="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
                        <div class="flex items-center gap-1.5">
                            <div class="size-3 rounded-full bg-rose-500"></div>
                            <div class="size-3 rounded-full bg-amber-500"></div>
                            <div class="size-3 rounded-full bg-emerald-500"></div>
                        </div>
                        <span class="text-xs text-slate-400 font-mono">styles/layout.css</span>
                        <div class="w-10"></div>
                    </div>
                    <div class="p-4 overflow-x-auto bg-slate-900">
                        <pre class="font-mono text-sm leading-6 text-slate-300">
                            <span class="text-slate-500">/* 요소가 페이지 경계에 걸쳐 잘리는 것을 방지 */</span><br />
                            <span class="text-blue-300">.project-card, section, .code-block</span> {'{'}<br />
                            {'  '}<span class="text-sky-300">break-inside</span>: <span class="text-rose-300">avoid</span>;<br />
                            {'  '}<span class="text-sky-300">page-break-inside</span>: <span class="text-rose-300">avoid</span>;<br />
                            {'  '}<span class="text-sky-300">margin-bottom</span>: <span class="text-rose-300">1cm</span>;<br />
                            {'  '}<span class="text-sky-300">border</span>: <span class="text-rose-300">1px solid #e5e7eb</span>;<br />
                            {'}'}<br /><br />
                            <span class="text-slate-500">/* 링크 URL 강제 표시 */</span><br />
                            <span class="text-blue-300">a[href]::after</span> {'{'}<br />
                            {'  '}<span class="text-sky-300">content</span>: <span class="text-rose-300">" (" attr(href) ")"</span>;<br />
                            {'  '}<span class="text-sky-300">font-size</span>: <span class="text-rose-300">0.8em</span>;<br />
                            {'  '}<span class="text-sky-300">color</span>: <span class="text-rose-300">#6b7280</span>;<br />
                            {'}'}
                        </pre>
                    </div>
                </div>
            </section>
        </section>
    );
};

export default Docs;
