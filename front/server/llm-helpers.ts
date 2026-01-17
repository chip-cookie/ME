import { invokeLLM, Message } from "./_core/llm";

/**
 * Analyze writing style from cover letter text
 */
export async function analyzeWritingStyle(text: string) {
    const messages: Message[] = [
        {
            role: "system",
            content: "당신은 자기소개서 글쓰기 스타일을 분석하는 전문가입니다. 주어진 자소서 텍스트의 문체, 어조, 표현 방식을 분석하여 JSON 형태로 반환하세요."
        },
        {
            role: "user",
            content: `다음 자기소개서의 글쓰기 스타일을 분석해주세요:\n\n${text}`
        }
    ];

    const result = await invokeLLM({
        messages,
        outputSchema: {
            name: "writing_style_analysis",
            schema: {
                type: "object",
                properties: {
                    tone: { type: "string", description: "어조 (공식적, 진솔한, 열정적 등)" },
                    vocabulary_level: { type: "string", description: "어휘 수준 (전문적, 일반적 등)" },
                    sentence_structure: { type: "string", description: "문장 구조 특징 (간결함, 상세함 등)" },
                    key_patterns: { type: "array", items: { type: "string" }, description: "주요 표현 패턴" },
                    strengths: { type: "array", items: { type: "string" }, description: "강점" },
                },
                required: ["tone", "vocabulary_level", "sentence_structure", "key_patterns", "strengths"]
            }
        }
    });

    return JSON.parse(result.choices[0].message.content as string);
}

/**
 * Analyze interview answer style (separate DB)
 */
export async function analyzeInterviewStyle(text: string) {
    const messages: Message[] = [
        {
            role: "system",
            content: "당신은 면접 답변 스타일을 분석하는 전문가입니다. 주어진 면접 답변 예시의 특징을 분석하여 JSON 형태로 반환하세요."
        },
        {
            role: "user",
            content: `다음 면접 답변의 스타일을 분석해주세요:\n\n${text}`
        }
    ];

    const result = await invokeLLM({
        messages,
        outputSchema: {
            name: "interview_style_analysis",
            schema: {
                type: "object",
                properties: {
                    answer_structure: { type: "string", description: "답변 구조 (STAR, 결론먼저 등)" },
                    communication_style: { type: "string", description: "커뮤니케이션 스타일" },
                    emphasis_points: { type: "array", items: { type: "string" }, description: "강조하는 포인트" },
                    key_phrases: { type: "array", items: { type: "string" }, description: "자주 사용하는 표현" },
                },
                required: ["answer_structure", "communication_style", "emphasis_points", "key_phrases"]
            }
        }
    });

    return JSON.parse(result.choices[0].message.content as string);
}

/**
 * Calculate simple text similarity using word overlap (Jaccard similarity)
 */
function calculateTextSimilarity(text1: string, text2: string): number {
    // Normalize and tokenize
    const normalize = (text: string) => {
        return text.toLowerCase()
            .replace(/[^\w\s가-힣]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 1);
    };

    const words1 = new Set(normalize(text1));
    const words2 = new Set(normalize(text2));

    // Jaccard similarity: intersection / union
    const arr1 = Array.from(words1);
    const intersection = arr1.filter(x => words2.has(x));
    const unionSize = words1.size + words2.size - intersection.length;

    return intersection.length / unionSize;
}

/**
 * Extract top-k most relevant chunks from training text
 */
function extractTopKChunks(trainingText: string, prompt: string, k: number = 3): string[] {
    // Split training text into paragraphs
    const paragraphs = trainingText
        .split('\n\n')
        .map(p => p.trim())
        .filter(p => p.length > 50); // Filter short paragraphs

    if (paragraphs.length === 0) {
        // Fallback: split by length
        const chunkSize = Math.ceil(trainingText.length / k);
        const chunks: string[] = [];
        for (let i = 0; i < Math.min(k, Math.ceil(trainingText.length / chunkSize)); i++) {
            const start = i * chunkSize;
            const chunk = trainingText.substring(start, start + chunkSize).trim();
            if (chunk) chunks.push(chunk);
        }
        return chunks;
    }

    // Calculate similarity score for each paragraph
    const scored = paragraphs.map(para => ({
        text: para,
        score: calculateTextSimilarity(para, prompt)
    }));

    // Sort by score and take top-k
    return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, Math.min(k, scored.length))
        .map(item => item.text);
}

/**
 * Generate cover letter with character count constraint and RAG (using training examples)
 */
export async function generateCoverLetter(params: {
    prompt: string;
    style: any;
    trainingText?: string; // Add training text parameter
    itemType?: string;
    targetCharCount?: number;
    jdKeywords?: string[];
    jdSummary?: string;
}) {
    let systemPrompt = "당신은 자기소개서 작성 전문가입니다.";

    if (params.style) {
        systemPrompt += `\n\n사용자의 글쓰기 스타일:\n- 어조: ${params.style.tone}\n- 어휘 수준: ${params.style.vocabulary_level}\n- 문장 구조: ${params.style.sentence_structure}`;

        // Add key patterns for better style matching
        if (params.style.key_patterns && params.style.key_patterns.length > 0) {
            systemPrompt += `\n- 특징적 표현: ${params.style.key_patterns.slice(0, 5).join(', ')}`;
        }
    }

    // RAG: Add actual training examples (top-k most relevant)
    if (params.trainingText && params.trainingText.length > 100) {
        const topKExamples = extractTopKChunks(params.trainingText, params.prompt, 3);

        if (topKExamples.length > 0) {
            systemPrompt += `\n\n**사용자의 과거 작성 예시 (참고용):**`;
            topKExamples.forEach((example, idx) => {
                // Truncate very long examples
                const truncated = example.length > 400 ? example.substring(0, 400) + '...' : example;
                systemPrompt += `\n\n[예시 ${idx + 1}]\n${truncated}`;
            });
            systemPrompt += `\n\n위 예시들의 문체, 어조, 표현 방식을 참고하여 작성하되, 내용은 새로운 프롬프트에 맞게 작성하세요.`;
        }
    }

    if (params.jdKeywords || params.jdSummary) {
        systemPrompt += "\n\n채용 공고 정보:";
        if (params.jdSummary) systemPrompt += `\n- 요약: ${params.jdSummary}`;
        if (params.jdKeywords) systemPrompt += `\n- 핵심 키워드: ${params.jdKeywords.join(", ")}`;
    }

    // Character count constraint - VERY IMPORTANT!
    if (params.targetCharCount) {
        systemPrompt += `\n\n**중요**: 생성할 자기소개서는 공백을 제외하고 정확히 ${params.targetCharCount}자 이내로 작성해야 합니다. 이 제한을 반드시 지켜주세요.`;
    }


    let userPrompt = params.prompt;
    if (params.itemType) {
        // Handle custom item type (prefixed with 'custom:')
        if (params.itemType.startsWith('custom:')) {
            const customQuestion = params.itemType.replace('custom:', '').trim();
            if (customQuestion) {
                userPrompt = `[자소서 항목 질문]\n${customQuestion}\n\n[추가 요구사항/내 경험]\n${params.prompt}`;
            }
        } else if (params.itemType !== "자유양식") {
            userPrompt = `[${params.itemType}]\n\n${params.prompt}`;
        }
    }

    const messages: Message[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
    ];

    const result = await invokeLLM({ messages });
    let generatedText = result.choices[0].message.content as string;

    // Verify character count and adjust if necessary
    if (params.targetCharCount) {
        const actualCount = generatedText.replace(/\s/g, '').length;

        // If more than 10% off target, request regeneration
        if (Math.abs(actualCount - params.targetCharCount) > params.targetCharCount * 0.1) {
            const adjustMessages: Message[] = [
                ...messages,
                { role: "assistant", content: generatedText },
                {
                    role: "user",
                    content: `현재 글자수는 ${actualCount}자입니다. 목표는 ${params.targetCharCount}자입니다. 내용의 핵심은 유지하면서 정확히 ${params.targetCharCount}자에 맞춰 다시 작성해주세요.`
                }
            ];

            const adjustedResult = await invokeLLM({ messages: adjustMessages });
            generatedText = adjustedResult.choices[0].message.content as string;
        }
    }

    // Calculate style similarity score if training text exists
    let styleSimilarity = null;
    if (params.trainingText) {
        styleSimilarity = calculateTextSimilarity(generatedText, params.trainingText);
    }

    return {
        text: generatedText,
        styleSimilarity: styleSimilarity ? parseFloat((styleSimilarity * 100).toFixed(1)) : null
    };
}

/**
 * Generate interview questions with consulting (answer strategy and tips)
 */
export async function generateInterviewQuestionsWithConsulting(params: {
    coverLetterText: string;
    interviewStyle: any;
    questionCount: number;
}) {
    let systemPrompt = "당신은 면접 전문 컨설턴트입니다. 자기소개서를 분석하여 면접 질문을 생성하고, 각 질문에 대한 모범 답변과 답변 전략을 제공하세요.";

    if (params.interviewStyle) {
        systemPrompt += `\n\n사용자의 면접 답변 스타일:\n- 답변 구조: ${params.interviewStyle.answer_structure}\n- 커뮤니케이션 스타일: ${params.interviewStyle.communication_style}`;
    }

    const messages: Message[] = [
        { role: "system", content: systemPrompt },
        {
            role: "user",
            content: `다음 자기소개서를 바탕으로 면접 질문 ${params.questionCount}개와 각 질문에 대한 답변 컨설팅을 제공해주세요:\n\n${params.coverLetterText}\n\n각 질문마다 다음을 포함해주세요:\n1. 면접 질문\n2. 모범 답변 예시\n3. 답변 전략 및 팁 (어떻게 답변하면 좋을지)\n4. 난이도 (easy/medium/hard)`
        }
    ];

    const result = await invokeLLM({
        messages,
        outputSchema: {
            name: "interview_questions_consulting",
            schema: {
                type: "object",
                properties: {
                    questions: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                question: { type: "string", description: "면접 질문" },
                                suggestedAnswer: { type: "string", description: "모범 답변 예시" },
                                answerStrategy: { type: "string", description: "답변 전략 및 팁" },
                                category: { type: "string", description: "질문 카테고리" },
                                difficulty: { type: "string", enum: ["easy", "medium", "hard"], description: "난이도" }
                            },
                            required: ["question", "suggestedAnswer", "answerStrategy", "category", "difficulty"]
                        }
                    }
                },
                required: ["questions"]
            }
        }
    });

    const parsed = JSON.parse(result.choices[0].message.content as string);
    return parsed.questions;
}
