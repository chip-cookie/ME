import type { Component } from 'solid-js';
import Sidebar from './components/layout/Sidebar';
import Navigation from './components/layout/Navigation';
import Intro from './features/intro';
import Projects from './features/projects';
import Skills from './features/skills';
import Experience from './features/experience';
import Docs from './features/docs';
import Footer from './components/layout/Footer';
import ChatBot from './features/chat/ChatBot';

const App: Component = () => {
    return (
        <div class="bg-pastel-cream text-slate-700 font-body antialiased selection:bg-sky-200 selection:text-sky-900 overflow-x-hidden">
            <div class="flex flex-col md:flex-row min-h-screen">
                <Sidebar />

                <main class="flex-1 bg-pastel-cream relative">
                    {/* 배경 그리드 패턴 */}
                    <div class="fixed inset-0 pointer-events-none z-0 opacity-40 bg-grid-pattern" />

                    {/* 네비게이션 */}
                    <Navigation />

                    {/* 콘텐츠 */}
                    <div class="relative z-10 max-w-6xl mx-auto p-8 md:p-12 lg:p-20 space-y-32">
                        <Intro />
                        <Projects />
                        <Skills />
                        <Experience />
                        <Docs />
                        <Footer />
                    </div>
                </main>
            </div>

            {/* AI Chatbot Widget */}
            <ChatBot />
        </div>
    );
};

export default App;
