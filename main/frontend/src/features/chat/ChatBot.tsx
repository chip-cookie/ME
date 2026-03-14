import { Component, createSignal, For, Show, onMount, createEffect } from 'solid-js';

// ---- SVG Icons (Lucide Style) ----
const MessageCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
);

const XIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
    </svg>
);

const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m22 2-7 20-4-9-9-4Z" />
        <path d="M22 2 11 13" />
    </svg>
);

const BotIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 8V4H8" />
        <rect width="16" height="12" x="4" y="8" rx="2" />
        <path d="M2 14h2" />
        <path d="M20 14h2" />
        <path d="M15 13v2" />
        <path d="M9 13v2" />
    </svg>
);

// ---- Types ----
interface Message {
    id: string;
    role: 'user' | 'assistant';
    text: string;
    timestamp: Date;
}

const ChatBot: Component = () => {
    const [isOpen, setIsOpen] = createSignal(false);
    const [messages, setMessages] = createSignal<Message[]>([
        {
            id: 'init',
            role: 'assistant',
            text: '안녕하세요! 제 포트폴리오에 대해 궁금한 점이 있으신가요? 무엇이든 물어보세요!',
            timestamp: new Date()
        }
    ]);
    const [inputText, setInputText] = createSignal('');
    const [isLoading, setIsLoading] = createSignal(false);

    let messagesEndRef: HTMLDivElement | undefined;

    const scrollToBottom = () => {
        messagesEndRef?.scrollIntoView({ behavior: 'smooth' });
    };

    createEffect(() => {
        messages(); // dependency
        scrollToBottom();
    });

    // 수정 명령 감지 키워드
    const UPDATE_KEYWORDS = ['바꿔', '바꿔줘', '변경', '수정', '업데이트', '고쳐', '수정해줘', 'update', 'change', 'modify'];

    const isUpdateCommand = (text: string): boolean => {
        const lowerText = text.toLowerCase();
        return UPDATE_KEYWORDS.some(keyword => lowerText.includes(keyword));
    };

    const handleSendMessage = async (e?: Event) => {
        e?.preventDefault();
        if (!inputText().trim() || isLoading()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: inputText(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsLoading(true);

        try {
            let botReplyText = '';

            // 🔀 스마트 라우팅: 수정 명령 감지
            if (isUpdateCommand(userMsg.text)) {
                // /update 엔드포인트 호출
                const response = await fetch('http://localhost:8002/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ command: userMsg.text })
                });

                if (!response.ok) throw new Error('Update API Error');

                const data = await response.json();

                if (data.success) {
                    botReplyText = `✅ ${data.message}\n\n**변경 내용:**\n- 위치: ${data.changed.path}\n- 이전: ${data.changed.old}\n- 변경: ${data.changed.new}\n\n(페이지를 새로고침하면 적용됩니다)`;
                } else {
                    botReplyText = `⚠️ ${data.message}`;
                }
            } else {
                // 일반 질문: /chat 엔드포인트 호출
                const response = await fetch('http://localhost:8002/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: userMsg.text })
                });

                if (!response.ok) throw new Error('Chat API Error');

                const data = await response.json();
                botReplyText = data.reply || "죄송합니다. 답변을 생성하지 못했습니다.";
            }

            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                text: botReplyText,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, botMsg]);

        } catch (error) {
            console.error(error);
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                text: "⚠️ 서버 연결에 실패했습니다. (Docker 컨테이너가 켜져 있는지 확인해주세요)",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div class="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-4">
            {/* Chat Window */}
            <Show when={isOpen()}>
                <div class="w-80 md:w-96 bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col transition-all duration-300 ease-in-out transform origin-bottom-right h-[500px]">

                    {/* Header */}
                    <div class="bg-gradient-to-r from-sky-500 to-indigo-600 p-4 flex justify-between items-center text-white">
                        <div class="flex items-center space-x-2">
                            <BotIcon />
                            <span class="font-bold">Portfolio AI Agent</span>
                        </div>
                        <button onClick={() => setIsOpen(false)} class="hover:bg-white/20 p-1 rounded-full transition">
                            <XIcon />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div class="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                        <For each={messages()}>
                            {(msg) => (
                                <div class={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div class={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                                        ? 'bg-sky-500 text-white rounded-tr-none shadow-md'
                                        : 'bg-white text-slate-700 rounded-tl-none border border-slate-200 shadow-sm'
                                        }`}>
                                        <div class="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                                        <div class={`text-[10px] mt-1 text-right ${msg.role === 'user' ? 'text-sky-100' : 'text-slate-400'}`}>
                                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </For>

                        <Show when={isLoading()}>
                            <div class="flex justify-start">
                                <div class="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm">
                                    <div class="flex space-x-1.5 animate-pulse">
                                        <div class="w-2 h-2 bg-slate-300 rounded-full"></div>
                                        <div class="w-2 h-2 bg-slate-300 rounded-full animation-delay-200"></div>
                                        <div class="w-2 h-2 bg-slate-300 rounded-full animation-delay-400"></div>
                                    </div>
                                </div>
                            </div>
                        </Show>
                        <div ref={messagesEndRef}></div>
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSendMessage} class="p-3 bg-white border-t border-slate-100">
                        <div class="relative flex items-center">
                            <input
                                type="text"
                                placeholder="질문을 입력하세요..."
                                value={inputText()}
                                onInput={(e) => setInputText(e.currentTarget.value)}
                                disabled={isLoading()}
                                class="w-full pl-4 pr-12 py-3 bg-slate-100 rounded-full border-none focus:ring-2 focus:ring-sky-500 text-sm placeholder-slate-400 transition-all shadow-inner"
                            />
                            <button
                                type="submit"
                                disabled={!inputText().trim() || isLoading()}
                                class="absolute right-2 p-2 bg-sky-500 text-white rounded-full hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg transform active:scale-95"
                            >
                                <SendIcon />
                            </button>
                        </div>
                        <div class="text-center mt-2">
                            <span class="text-[10px] text-slate-400">Powered by Local Gemma-2B & ChromaDB</span>
                        </div>
                    </form>
                </div>
            </Show>

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen())}
                class={`p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 ${isOpen() ? 'bg-slate-700 rotate-90' : 'bg-gradient-to-r from-sky-500 to-indigo-600 animate-bounce-subtle'
                    } text-white`}
            >
                <Show when={isOpen()} fallback={<MessageCircleIcon />}>
                    <XIcon />
                </Show>
            </button>
        </div>
    );
};

export default ChatBot;
