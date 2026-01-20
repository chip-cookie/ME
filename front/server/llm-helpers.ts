import { invokeLLM, invokeVLLM, Message } from "./_core/llm";

/**
 * Analyze writing style from cover letter text
 * Uses vLLM (local) as primary, Gemini as fallback
 */
export async function analyzeWritingStyle(text: string) {
    const messages: Message[] = [
        {
            role: "system",
            content: `당신은 자기소개서 글쓰기 스타일을 분석하는 전문가입니다. 주어진 자소서 텍스트의 문체, 어조, 표현 방식을 분석하여 JSON 형태로 반환하세요.

반드시 아래 JSON 형식으로만 응답하세요:
{
  "suggested_name": "스타일 이름",
  "tone": "어조",
  "vocabulary_level": "어휘 수준",
  "sentence_structure": "문장 구조",
  "key_patterns": ["패턴1", "패턴2"],
  "strengths": ["강점1", "강점2"]
}`
        },
        {
            role: "user",
            content: `다음 자기소개서의 글쓰기 스타일을 분석해주세요:\n\n${text}`
        }
    ];

    // Try vLLM first (local), fallback to Gemini on error
    try {
        const result = await invokeVLLM({ messages, temperature: 0.3 });
        const content = result.choices[0].message.content as string;
        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
        return JSON.parse(jsonStr);
    } catch (vllmError) {
        console.log("[analyzeWritingStyle] vLLM failed, falling back to Gemini...");
        // Fallback to Gemini with structured output
        const result = await invokeLLM({
            messages,
            outputSchema: {
                name: "writing_style_analysis",
                schema: {
                    type: "object",
                    properties: {
                        suggested_name: { type: "string", description: "스타일의 특징을 잘 나타내는 이름" },
                        tone: { type: "string", description: "어조" },
                        vocabulary_level: { type: "string", description: "어휘 수준" },
                        sentence_structure: { type: "string", description: "문장 구조 특징" },
                        key_patterns: { type: "array", items: { type: "string" }, description: "주요 표현 패턴" },
                        strengths: { type: "array", items: { type: "string" }, description: "강점" },
                    },
                    required: ["suggested_name", "tone", "vocabulary_level", "sentence_structure", "key_patterns", "strengths"]
                }
            }
        });
        return JSON.parse(result.choices[0].message.content as string);
    }
}

/**
 * Analyze interview answer style (separate DB)
 * Uses vLLM (local) as primary, Gemini as fallback
 */
export async function analyzeInterviewStyle(text: string) {
    const messages: Message[] = [
        {
            role: "system",
            content: `당신은 면접 답변 스타일을 분석하는 전문가입니다. 주어진 면접 답변 예시의 특징을 분석하여 JSON 형태로 반환하세요.

반드시 아래 JSON 형식으로만 응답하세요:
{
  "suggested_name": "스타일 이름",
  "answer_structure": "답변 구조",
  "communication_style": "커뮤니케이션 스타일",
  "emphasis_points": ["포인트1", "포인트2"],
  "key_phrases": ["표현1", "표현2"]
}`
        },
        {
            role: "user",
            content: `다음 면접 답변의 스타일을 분석해주세요:\n\n${text}`
        }
    ];

    // Try vLLM first (local), fallback to Gemini on error
    try {
        const result = await invokeVLLM({ messages, temperature: 0.3 });
        const content = result.choices[0].message.content as string;
        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
        return JSON.parse(jsonStr);
    } catch (vllmError) {
        console.log("[analyzeInterviewStyle] vLLM failed, falling back to Gemini...");
        // Fallback to Gemini with structured output
        const result = await invokeLLM({
            messages,
            outputSchema: {
                name: "interview_style_analysis",
                schema: {
                    type: "object",
                    properties: {
                        suggested_name: { type: "string", description: "스타일의 특징을 잘 나타내는 이름" },
                        answer_structure: { type: "string", description: "답변 구조" },
                        communication_style: { type: "string", description: "커뮤니케이션 스타일" },
                        emphasis_points: { type: "array", items: { type: "string" }, description: "강조하는 포인트" },
                        key_phrases: { type: "array", items: { type: "string" }, description: "자주 사용하는 표현" },
                    },
                    required: ["suggested_name", "answer_structure", "communication_style", "emphasis_points", "key_phrases"]
                }
            }
        });
        return JSON.parse(result.choices[0].message.content as string);
    }
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
    experienceContext?: any; // STAR summary
    corporateContext?: any; // Corporate Analysis
    collectivePatterns?: any; // Admin's aggregated writing patterns (format/structure only)
}) {
    let systemPrompt = "당신은 자기소개서 작성 전문가입니다.";

    // Add collective writing patterns from admin (quality baseline)
    if (params.collectivePatterns) {
        const cp = params.collectivePatterns;
        systemPrompt += `\n\n**우수한 글쓰기 패턴 (참고용 - 형식/구조만, 내용 복사 금지):**`;
        if (cp.tones?.length > 0) {
            systemPrompt += `\n- 효과적인 어조 예시: ${cp.tones.slice(0, 5).join(', ')}`;
        }
        if (cp.sentence_structures?.length > 0) {
            systemPrompt += `\n- 추천 문장 구조: ${cp.sentence_structures.slice(0, 5).join(', ')}`;
        }
        if (cp.key_patterns?.length > 0) {
            systemPrompt += `\n- 효과적인 표현 기법: ${cp.key_patterns.slice(0, 8).join(', ')}`;
        }
        if (cp.strengths?.length > 0) {
            systemPrompt += `\n- 강조할 수 있는 포인트: ${cp.strengths.slice(0, 5).join(', ')}`;
        }
        systemPrompt += `\n\n위 패턴은 참고용이며, 사용자의 고유한 경험과 표현으로 작성해야 합니다.`;
    }

    if (params.style) {
        systemPrompt += `\n\n사용자의 글쓰기 스타일:\n- 어조: ${params.style.tone}\n- 어휘 수준: ${params.style.vocabulary_level}\n- 문장 구조: ${params.style.sentence_structure}`;

        // Add key patterns for better style matching
        if (params.style.key_patterns && params.style.key_patterns.length > 0) {
            systemPrompt += `\n- 특징적 표현: ${params.style.key_patterns.slice(0, 5).join(', ')}`;
        }
    }

    // Add Experience Context (STAR Summary)
    if (params.experienceContext && params.experienceContext.star_summary) {
        const star = params.experienceContext.star_summary;
        systemPrompt += `\n\n**사용자의 경험 소재 (STAR 기법 분석):**
이 경험 내용을 바탕으로 질문에 답변을 작성하세요.
- Situation (상황): ${star.S}
- Task (문제/과제): ${star.T}
- Action (행동): ${star.A}
- Result (결과): ${star.R}`;

        if (params.experienceContext.personality) {
            systemPrompt += `\n- 성향/강점 키워드: ${params.experienceContext.personality.keywords?.join(', ')}`;
            if (params.experienceContext.personality.strengths) {
                systemPrompt += `\n- 성격의 장점: ${params.experienceContext.personality.strengths}`;
            }
            if (params.experienceContext.personality.weaknesses) {
                systemPrompt += `\n- 성격의 단점/보완점: ${params.experienceContext.personality.weaknesses}`;
            }
        }
    }

    // Add Corporate Context
    if (params.corporateContext) {
        const corp = params.corporateContext;
        systemPrompt += `\n\n**지원 기업 정보 (${corp.companyName}):**
- 미션/비전: ${corp.mission}
- 인재상: ${corp.ideal_candidate ? corp.ideal_candidate.join(', ') : '정보 없음'}
- 주요 사업: ${corp.business ? corp.business.join(', ') : '정보 없음'}
- 최신 이슈: ${corp.recent_issues ? corp.recent_issues.join(', ') : ''}`;

        if (corp.swot) {
            systemPrompt += `\n- 기업 강점(Strength): ${corp.swot.strength}`;
            systemPrompt += `\n- 기업 기회(Opportunity): ${corp.swot.opportunity}`;
        }

        systemPrompt += `\n\n**작성 지침:** 위 기업의 인재상과 핵심 가치를 반영하여 사용자의 경험을 연결하고, 기업의 비전에 기여할 수 있음을 강조하세요.`;
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
    corporateContext?: any; // Corporate Analysis
}) {
    let systemPrompt = "당신은 면접 전문 컨설턴트입니다. 자기소개서를 분석하여 면접 질문을 생성하고, 각 질문에 대한 모범 답변과 답변 전략을 제공하세요.";

    if (params.interviewStyle) {
        systemPrompt += `\n\n사용자의 면접 답변 스타일:\n- 답변 구조: ${params.interviewStyle.answer_structure}\n- 커뮤니케이션 스타일: ${params.interviewStyle.communication_style}`;
    }

    if (params.corporateContext) {
        const corp = params.corporateContext;
        systemPrompt += `\n\n**지원 기업 정보 (${corp.companyName}):**
- 미션/비전: ${corp.mission}
- 인재상: ${corp.ideal_candidate ? corp.ideal_candidate.join(', ') : ''}
- 최신 이슈: ${corp.recent_issues ? corp.recent_issues.join(', ') : ''}
- SWOT: ${corp.swot ? JSON.stringify(corp.swot) : ''}

면접 질문 생성 시 기업의 최신 이슈나 인재상과 관련된 질문을 포함하고, 답변 전략에서는 기업의 핵심 가치에 부합하는 답변 방향을 제시하세요.`;
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

/**
 * Analyze experience for sentiment, STAR, and personality
 */
export async function analyzeExperience(text: string) {
    const messages: Message[] = [
        {
            role: "system",
            content: "당신은 자기소개서 소재 발굴 및 경험 분석 전문가입니다. 사용자의 경험을 듣고 STAR 기법(Situation, Task, Action, Result)으로 구조화하고, 해당 경험에서 드러나는 지원자의 성향과 강점을 분석합니다. 특히 사용자의 '감정'에 집중하여 분석을 수행하세요."
        },
        {
            role: "user",
            content: `다음 경험 내용을 분석하여 STAR 구조로 요약하고, 작성자의 성향(Personality)을 분석해주세요. 이때 감정(Sentiment) 분석을 통해 당시 느꼈을 기분이나 태도를 함께 고려해주세요:\n\n${text}`
        }
    ];

    const result = await invokeLLM({
        messages,
        outputSchema: {
            name: "experience_analysis",
            schema: {
                type: "object",
                properties: {
                    star_summary: {
                        type: "object",
                        properties: {
                            S: { type: "string", description: "Situation (상황)" },
                            T: { type: "string", description: "Task (문제/과제)" },
                            A: { type: "string", description: "Action (행동)" },
                            R: { type: "string", description: "Result (결과)" }
                        },
                        required: ["S", "T", "A", "R"]
                    },
                    personality: {
                        type: "object",
                        properties: {
                            keywords: {
                                type: "array",
                                items: { type: "string" },
                                description: "성향 키워드 (해시태그)"
                            },
                            score: {
                                type: "object",
                                properties: {
                                    analytical: { type: "number", description: "분석적 사고 (0-100)" },
                                    creativity: { type: "number", description: "창의성 (0-100)" },
                                    leadership: { type: "number", description: "리더십 (0-100)" },
                                    empathy: { type: "number", description: "공감 능력 (0-100)" },
                                    persistence: { type: "number", description: "끈기/집요함 (0-100)" }
                                },
                                required: ["analytical", "creativity", "leadership", "empathy", "persistence"]
                            },
                            comment: { type: "string", description: "성향 분석 코멘트" },
                            strengths: {
                                type: "string",
                                description: "해당 경험에서 드러난 성격의 장점 (구체적으로)"
                            },
                            weaknesses: {
                                type: "string",
                                description: "해당 경험에서 드러난 성격의 단점 또는 보완점 (구체적으로)"
                            }
                        },
                        required: ["keywords", "score", "comment", "strengths", "weaknesses"]
                    }
                },
                required: ["star_summary", "personality"]
            }
        }
    });

    return JSON.parse(result.choices[0].message.content as string);
}

/**
 * Analyze company based on name, url, and scraped text
 */
export async function analyzeCompany(name: string, url: string, text: string, dartInfo?: any, npsInfo?: any) {
    let systemPrompt = `당신은 기업 분석 및 채용 전략 전문가입니다.
제공된 기업 홈페이지/뉴스 텍스트를 바탕으로 기업을 분석하여, 구직자에게 도움이 되는 핵심 정보를 JSON 형식으로 제공합니다.

**중요: 모든 내용은 반드시 한국어로 작성하세요.**
**중요: 반드시 아래 JSON 형식만 출력하세요. 다른 텍스트나 설명 없이 JSON만 출력해야 합니다.**

출력 형식:
{
  "mission": "기업의 미션, 비전, 핵심 가치 (한국어)",
  "ideal_candidate": ["인재상 키워드1", "인재상 키워드2", "인재상 키워드3"],
  "business": ["주요 사업1", "주요 사업2", "주요 사업3"],
  "recent_issues": ["최신 이슈1", "최신 이슈2", "최신 이슈3"],
  "financials": "재무 상태 또는 성장성 요약 (한국어)",
  "swot": {
    "strength": "강점 (한국어)",
    "weakness": "약점 (한국어)",
    "opportunity": "기회 (한국어)",
    "threat": "위협 (한국어)"
  }
}`;

    let content = `기업명: ${name}\nURL: ${url}\n\n`;

    if (dartInfo) {
        content += `[DART 기업 개요]\n`;
        content += `- 법인명: ${dartInfo.corp_name}\n`;
        content += `- 영문명: ${dartInfo.corp_name_eng || ''}\n`;
        content += `- 대표자: ${dartInfo.ceo_nm}\n`;
        content += `- 업종코드: ${dartInfo.induty_code}\n`;
        content += `- 설립일: ${dartInfo.est_dt}\n`;
        content += `- 주소: ${dartInfo.adres}\n`;
        content += `- 홈페이지: ${dartInfo.hm_url || ''}\n\n`;
    }

    if (npsInfo && npsInfo.status === 'success') {
        content += `[국민연금공단 고용 정보]\n`;
        content += `- 직원 수: ${npsInfo.employees?.toLocaleString() || '정보 없음'}명\n`;
        content += `- 월평균 급여: ${npsInfo.avgMonthlyIncome?.toLocaleString() || '정보 없음'}원\n`;
        content += `- 신규 입사자: ${npsInfo.newHires || 0}명\n`;
        content += `- 퇴사자: ${npsInfo.departures || 0}명\n`;
        if (npsInfo.employees && npsInfo.departures) {
            const turnoverRate = ((npsInfo.departures / npsInfo.employees) * 100).toFixed(1);
            content += `- 이직률 (추정): ${turnoverRate}%\n`;
        }
        content += `\n`;
    }

    content += `수집된 텍스트:\n${text.substring(0, 15000)}\n\n위 내용을 분석하세요. **반드시 JSON 형식으로만 응답하세요.**`;

    const messages: Message[] = [
        {
            role: "system",
            content: systemPrompt
        },
        {
            role: "user",
            content: content
        }
    ];

    const result = await invokeLLM({ messages });
    const responseText = result.choices[0].message.content as string;

    // Robust JSON extraction - handle markdown code blocks and raw JSON
    let jsonStr = responseText;

    // Try to extract JSON from markdown code block
    const jsonBlockMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonBlockMatch) {
        jsonStr = jsonBlockMatch[1].trim();
    } else {
        // Try to find raw JSON object
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            jsonStr = jsonMatch[0];
        }
    }

    try {
        return JSON.parse(jsonStr);
    } catch (e) {
        // Fallback: return a default structure with the raw response
        console.error("Failed to parse JSON response:", e);
        return {
            mission: "분석 결과를 파싱하지 못했습니다. 원문: " + responseText.substring(0, 500),
            ideal_candidate: ["분석 실패"],
            business: ["분석 실패"],
            recent_issues: ["분석 실패"],
            financials: "분석 실패",
            swot: {
                strength: "분석 실패",
                weakness: "분석 실패",
                opportunity: "분석 실패",
                threat: "분석 실패"
            }
        };
    }
}

