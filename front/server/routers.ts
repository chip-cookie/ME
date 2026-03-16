import { COOKIE_NAME, DEFAULT_OPENROUTER_MODEL } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  getAllServices,
  getAllCaseStudies,
  getCaseStudiesByFilters,
  getAllClientResults,
  getClientResultsByCategory,
  getAllInsights,
  getFeaturedInsights,
  createLeadInquiry,
  getLeadInquiries,
  updateLeadInquiryStatus,
  updateUserOpenRouterSettings,
  getUserOpenRouterSettings,
} from "./db";
import { getAllPosts, getPostBySlug, getFeaturedPosts } from "./content";
import { registerUser, loginUser } from "./auth";
import { ONE_YEAR_MS } from "../shared/const";

/** 현재 사용자의 OpenRouter 설정을 조회합니다 */
async function getOrSettings(userId: number | undefined) {
  return userId ? await getUserOpenRouterSettings(userId) : null;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      ctx.res.clearCookie("jasos_user_id", { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    login: publicProcedure
      .input(z.object({
        username: z.string().min(1),
        password: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await loginUser(input.username, input.password);
        if (!result.success || !result.user) {
          throw new Error(result.error || 'Login failed');
        }
        // Set session cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie("jasos_user_id", String(result.user.id), {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
        });
        return { success: true, user: result.user };
      }),
    register: publicProcedure
      .input(z.object({
        username: z.string().min(3).max(20),
        password: z.string().min(6),
        name: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await registerUser(input.username, input.password, input.name);
        if (!result.success || !result.user) {
          throw new Error(result.error || 'Registration failed');
        }
        // Auto-login after registration
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie("jasos_user_id", String(result.user.id), {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
        });
        return { success: true, user: result.user };
      }),
  }),

  // User settings (OpenRouter API 연동 등)
  user: router({
    /** 현재 로그인된 사용자의 설정 조회 (API 키는 마스킹) */
    getSettings: publicProcedure.query(async ({ ctx }) => {
      const settings = await getOrSettings(ctx.user?.id);
      return settings ?? { hasKey: false, maskedKey: null, openRouterModel: DEFAULT_OPENROUTER_MODEL };
    }),

    /** OpenRouter API 키 및 모델 저장 */
    saveOpenRouterKey: protectedProcedure
      .input(z.object({
        apiKey: z.string().min(10, "API 키가 너무 짧습니다"),
        model: z.string().default(DEFAULT_OPENROUTER_MODEL),
      }))
      .mutation(async ({ input, ctx }) => {
        await updateUserOpenRouterSettings(ctx.user.id, {
          openRouterApiKey: input.apiKey,
          openRouterModel: input.model,
        });
        return { success: true };
      }),

    /** OpenRouter API 키 삭제 */
    deleteOpenRouterKey: protectedProcedure
      .mutation(async ({ ctx }) => {
        await updateUserOpenRouterSettings(ctx.user.id, { openRouterApiKey: null });
        return { success: true };
      }),
  }),

  // Services routes
  services: router({
    list: publicProcedure.query(async () => {
      return await getAllServices();
    }),
  }),

  // Case Studies routes
  caseStudies: router({
    list: publicProcedure.query(async () => {
      return await getAllCaseStudies();
    }),
    filter: publicProcedure
      .input(
        z.object({
          industry: z.string().optional(),
          scope: z.string().optional(),
          impact: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        return await getCaseStudiesByFilters(input.industry, input.scope, input.impact);
      }),
  }),

  // Client Results routes
  clientResults: router({
    list: publicProcedure.query(async () => {
      return await getAllClientResults();
    }),
    byCategory: publicProcedure
      .input(z.string())
      .query(async ({ input }) => {
        return await getClientResultsByCategory(input);
      }),
  }),

  // Insights routes
  insights: router({
    list: publicProcedure.query(async () => {
      return await getAllInsights();
    }),
    featured: publicProcedure.query(async () => {
      return await getFeaturedInsights();
    }),
  }),

  // Content/Blog routes (MDX)
  content: router({
    list: publicProcedure.query(() => {
      return getAllPosts();
    }),
    getBySlug: publicProcedure
      .input(z.string())
      .query(({ input }) => {
        return getPostBySlug(input);
      }),
    featured: publicProcedure.query(() => {
      return getFeaturedPosts();
    }),
  }),

  // Lead Inquiries routes
  leadInquiries: router({
    create: publicProcedure
      .input(
        z.object({
          companyName: z.string().min(1),
          companySize: z.string().optional(),
          industry: z.string().optional(),
          contactName: z.string().min(1),
          contactEmail: z.string().email(),
          contactPhone: z.string().optional(),
          projectScope: z.string().optional(),
          projectTimeline: z.string().optional(),
          budgetRange: z.string().optional(),
          challenges: z.string().optional(),
          goals: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await createLeadInquiry({
          ...input,
          status: "new",
        });
        return { success: true };
      }),
    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized");
      }
      return await getLeadInquiries();
    }),
    updateStatus: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["new", "contacted", "qualified", "proposal", "closed"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized");
        }
        await updateLeadInquiryStatus(input.id, input.status);
        return { success: true };
      }),
  }),

  // Writing Learning - Cover letter writing style management
  writingLearning: router({
    listStyles: publicProcedure.query(async ({ ctx }) => {
      const { getWritingStyleProfilesByUserId } = await import("./db");
      const userId = ctx.user?.id || 0;
      return await getWritingStyleProfilesByUserId(userId);
    }),

    createStyle: publicProcedure
      .input(z.object({
        name: z.string().min(1),
        trainingText: z.string().min(10),
        description: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { createWritingStyleProfile } = await import("./db");
        const { analyzeWritingStyle } = await import("./llm-helpers");
        const orSettings = await getOrSettings(ctx.user?.id);

        // Analyze style using LLM
        const characteristics = await analyzeWritingStyle(input.trainingText, orSettings?._rawKey, orSettings?.openRouterModel);
        const userId = ctx.user?.id || 0;

        const result = await createWritingStyleProfile({
          userId,
          name: input.name,
          description: input.description,
          trainingText: input.trainingText,
          characteristics: JSON.stringify(characteristics),
        });

        // --- Collective Intelligence: Aggregate style PATTERNS only (no content) ---
        // Extract only structural/format patterns, NEVER the actual experiences/content
        try {
          const { getAdminUserId } = await import("./auth");
          const { createWritingStyleProfile: createAdminStyle, getWritingStyleProfilesByUserId } = await import("./db");

          const adminId = getAdminUserId();
          const adminStyles = await getWritingStyleProfilesByUserId(adminId);

          // Find or create the "Collective Patterns" style for admin
          let collectiveStyle = adminStyles.find(s => s.name === '_collective_writing_patterns');

          // Build aggregated patterns (ONLY format/structure, NO content)
          const newPatterns = {
            tones: [characteristics.tone],
            sentence_structures: [characteristics.sentence_structure],
            key_patterns: characteristics.key_patterns || [],
            strengths: characteristics.strengths || [],
          };

          if (collectiveStyle) {
            // Merge with existing patterns
            const existing = JSON.parse(collectiveStyle.characteristics || '{}');
            const merged = {
              tones: [...new Set([...(existing.tones || []), ...newPatterns.tones])].slice(0, 20),
              sentence_structures: [...new Set([...(existing.sentence_structures || []), ...newPatterns.sentence_structures])].slice(0, 20),
              key_patterns: [...new Set([...(existing.key_patterns || []), ...newPatterns.key_patterns])].slice(0, 50),
              strengths: [...new Set([...(existing.strengths || []), ...newPatterns.strengths])].slice(0, 50),
              updated_at: new Date().toISOString(),
              contribution_count: (existing.contribution_count || 0) + 1,
            };

            // Update admin's collective style
            const { updateWritingStyleProfile } = await import("./db");
            await updateWritingStyleProfile(collectiveStyle.id, {
              characteristics: JSON.stringify(merged),
            });
            console.log('[CollectiveIntelligence] Updated patterns:', merged.contribution_count, 'contributions');
          } else {
            // Create new collective style for admin
            await createAdminStyle({
              userId: adminId,
              name: '_collective_writing_patterns',
              description: '시스템에서 자동 수집한 글쓰기 패턴 (형식/구조만, 내용 없음)',
              trainingText: '(자동 생성 - 패턴만 저장)', // No actual content stored
              characteristics: JSON.stringify({
                ...newPatterns,
                updated_at: new Date().toISOString(),
                contribution_count: 1,
              }),
            });
            console.log('[CollectiveIntelligence] Created collective patterns profile');
          }
        } catch (aggError) {
          console.error('[CollectiveIntelligence] Aggregation failed:', aggError);
          // Don't fail the main operation
        }

        return { success: true, id: (result as any).insertId };
      }),

    deleteStyle: publicProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        const { deleteWritingStyleProfile } = await import("./db");
        await deleteWritingStyleProfile(input);
        return { success: true };
      }),

    analyzePreview: publicProcedure
      .input(z.object({
        text: z.string().min(10),
      }))
      .mutation(async ({ input, ctx }) => {
        const { analyzeWritingStyle } = await import("./llm-helpers");
        const orSettings = await getOrSettings(ctx.user?.id);
        const characteristics = await analyzeWritingStyle(input.text, orSettings?._rawKey, orSettings?.openRouterModel);
        return characteristics;
      }),
  }),

  // Interview Learning - Interview answer style management (separate DB)
  interviewLearning: router({
    listStyles: publicProcedure.query(async ({ ctx }) => {
      const { getInterviewStyleProfilesByUserId } = await import("./db");
      const userId = ctx.user?.id || 0;
      return await getInterviewStyleProfilesByUserId(userId);
    }),

    createStyle: publicProcedure
      .input(z.object({
        name: z.string().min(1),
        trainingText: z.string().min(10),
        description: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { createInterviewStyleProfile } = await import("./db");
        const { analyzeInterviewStyle } = await import("./llm-helpers");
        const orSettings = await getOrSettings(ctx.user?.id);

        // Analyze interview style using LLM
        const characteristics = await analyzeInterviewStyle(input.trainingText, orSettings?._rawKey, orSettings?.openRouterModel);
        const userId = ctx.user?.id || 0;

        const result = await createInterviewStyleProfile({
          userId,
          name: input.name,
          description: input.description,
          trainingText: input.trainingText,
          characteristics: JSON.stringify(characteristics),
        });

        return { success: true, id: (result as any).insertId };
      }),

    deleteStyle: publicProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        const { deleteInterviewStyleProfile } = await import("./db");
        await deleteInterviewStyleProfile(input);
        return { success: true };
      }),

    analyzePreview: publicProcedure
      .input(z.object({
        text: z.string().min(10),
      }))
      .mutation(async ({ input, ctx }) => {
        const { analyzeInterviewStyle } = await import("./llm-helpers");
        const orSettings = await getOrSettings(ctx.user?.id);
        const characteristics = await analyzeInterviewStyle(input.text, orSettings?._rawKey, orSettings?.openRouterModel);
        return characteristics;
      }),
  }),

  // Writing - Cover letter generation with character count constraints
  writing: router({
    generate: publicProcedure
      .input(z.object({
        prompt: z.string().min(1),
        styleId: z.number().optional(),
        itemType: z.string().optional(),
        targetCharCount: z.number().optional(),
        experienceId: z.number().optional(),
        corporateId: z.number().optional(), // Corporate Analysis context
        context: z.object({
          jd_keywords: z.array(z.string()).optional(),
          jd_summary: z.string().optional(),
        }).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const {
          getWritingStyleProfileById,
          createWritingHistory,
          getExperienceById,
          getCorporateAnalysisById,
          getWritingStyleProfilesByUserId,
        } = await import("./db");
        const { generateCoverLetter } = await import("./llm-helpers");
        const { getAdminUserId } = await import("./auth");

        const userId = ctx.user?.id || 0;

        // Fetch style, experience, corporate context, and user settings in parallel
        const [styleInfo, expRaw, corpRaw, orSettings] = await Promise.all([
          input.styleId ? getWritingStyleProfileById(input.styleId) : Promise.resolve(null),
          input.experienceId ? getExperienceById(input.experienceId) : Promise.resolve(null),
          input.corporateId ? getCorporateAnalysisById(input.corporateId) : Promise.resolve(null),
          getOrSettings(ctx.user?.id),
        ]);

        // Allow access only to user's own experience
        const experienceContext = expRaw && expRaw.userId === userId ? expRaw.analysis : undefined;

        // Allow access only to user's own corporate analysis
        let corporateContext = undefined;
        if (corpRaw && corpRaw.userId === userId) {
          corporateContext = typeof corpRaw.analysisResult === 'string' ? JSON.parse(corpRaw.analysisResult) : corpRaw.analysisResult;
          if (corporateContext) corporateContext.companyName = corpRaw.companyName;
        }

        // Get collective patterns from admin (format/structure only, no content)
        let collectivePatterns = undefined;
        try {
          const adminId = getAdminUserId();
          const adminStyles = await getWritingStyleProfilesByUserId(adminId);
          const collectiveStyle = adminStyles.find(s => s.name === '_collective_writing_patterns');
          if (collectiveStyle?.characteristics) {
            collectivePatterns = JSON.parse(collectiveStyle.characteristics);
          }
        } catch (e) {
          // Silently continue without collective patterns
        }

        // Generate cover letter with character count constraint and RAG
        const result = await generateCoverLetter({
          prompt: input.prompt,
          style: styleInfo?.characteristics ? JSON.parse(styleInfo.characteristics) : null,
          trainingText: styleInfo?.trainingText || undefined,
          itemType: input.itemType,
          targetCharCount: input.targetCharCount,
          jdKeywords: input.context?.jd_keywords,
          jdSummary: input.context?.jd_summary,
          experienceContext,
          corporateContext,
          collectivePatterns,
          openRouterApiKey: orSettings?._rawKey,
          openRouterModel: orSettings?.openRouterModel,
        });

        // Calculate actual character count (excluding spaces)
        const actualCharCount = result.text.replace(/\s/g, '').length;

        // Save to history
        const history = await createWritingHistory({
          userId,
          styleId: input.styleId,
          itemType: input.itemType,
          prompt: input.prompt,
          targetCharCount: input.targetCharCount,
          generatedText: result.text,
          actualCharCount,
          jdKeywords: input.context?.jd_keywords ? JSON.stringify(input.context.jd_keywords) : null,
          jdSummary: input.context?.jd_summary || null,
        });

        return {
          generatedText: result.text,
          actualCharCount,
          targetCharCount: input.targetCharCount,
          styleSimilarity: result.styleSimilarity,
          historyId: (history as any).insertId
        };
      }),

    getHistory: publicProcedure.query(async ({ ctx }) => {
      const { getWritingHistoryByUserId } = await import("./db");
      const userId = ctx.user?.id || 0;
      return await getWritingHistoryByUserId(userId);
    }),

    getById: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        const { getWritingHistoryById } = await import("./db");
        return await getWritingHistoryById(input);
      }),
  }),

  // Interview - Question generation with consulting (answer strategy and tips)
  interview: router({
    generateQuestions: publicProcedure
      .input(z.object({
        writingId: z.number().optional(),
        coverLetterText: z.string().optional(),
        interviewStyleId: z.number().optional(),
        questionCount: z.number().default(5),
        corporateId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const {
          getWritingHistoryById,
          getInterviewStyleProfileById,
          createInterviewQuestions,
          getCorporateAnalysisById
        } = await import("./db");
        const { generateInterviewQuestionsWithConsulting } = await import("./llm-helpers");

        // Get cover letter text (must resolve before parallel fetch)
        let text = input.coverLetterText;
        if (!text && input.writingId) {
          const history = await getWritingHistoryById(input.writingId);
          text = history?.generatedText;
        }

        if (!text) {
          throw new Error("자소서 내용이 필요합니다");
        }

        const userId = ctx.user?.id || 0;

        // Fetch interview style, corporate context, and user settings in parallel
        const [interviewStyle, corpRaw, orSettings] = await Promise.all([
          input.interviewStyleId ? getInterviewStyleProfileById(input.interviewStyleId) : Promise.resolve(null),
          input.corporateId ? getCorporateAnalysisById(input.corporateId) : Promise.resolve(null),
          getOrSettings(ctx.user?.id),
        ]);

        // Allow access only to user's own corporate analysis
        let corporateContext = undefined;
        if (corpRaw && corpRaw.userId === userId) {
          corporateContext = typeof corpRaw.analysisResult === 'string' ? JSON.parse(corpRaw.analysisResult) : corpRaw.analysisResult;
          if (corporateContext) corporateContext.companyName = corpRaw.companyName;
        }

        // Generate interview questions with consulting
        const questions = await generateInterviewQuestionsWithConsulting({
          coverLetterText: text,
          interviewStyle: interviewStyle?.characteristics ? JSON.parse(interviewStyle.characteristics) : null,
          questionCount: input.questionCount,
          corporateContext,
          openRouterApiKey: orSettings?._rawKey,
          openRouterModel: orSettings?.openRouterModel,
        });

        // Save to database
        const questionsToSave = questions.map((q: any) => ({
          userId,
          interviewStyleId: input.interviewStyleId,
          writingId: input.writingId,
          question: q.question,
          suggestedAnswer: q.suggestedAnswer,
          answerStrategy: q.answerStrategy,
          category: q.category,
          difficulty: q.difficulty,
        }));

        await createInterviewQuestions(questionsToSave);

        return { questions };
      }),

    getQuestions: publicProcedure.query(async ({ ctx }) => {
      const { getInterviewQuestionsByUserId } = await import("./db");
      const currentUserId = ctx.user?.id || 0;
      return await getInterviewQuestionsByUserId(currentUserId);
    }),

    getByWritingId: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        const { getInterviewQuestionsByWritingId } = await import("./db");
        return await getInterviewQuestionsByWritingId(input);
      }),
  }),

  // Experience Analysis - Sentiment & Personality Analysis
  experience: router({
    analyze: publicProcedure
      .input(z.object({
        text: z.string().min(10),
      }))
      .mutation(async ({ input, ctx }) => {
        const { analyzeExperience } = await import("./llm-helpers");
        const orSettings = await getOrSettings(ctx.user?.id);
        const analysis = await analyzeExperience(input.text, 'competency', orSettings?._rawKey, orSettings?.openRouterModel);
        return analysis;
      }),

    create: publicProcedure
      .input(z.object({
        content: z.string().min(1),
        analysisResult: z.string(), // JSON string
      }))
      .mutation(async ({ input, ctx }) => {
        const { createExperienceLog } = await import("./db");
        const userId = ctx.user?.id || 0;
        await createExperienceLog({
          userId,
          content: input.content,
          analysisResult: input.analysisResult,
        });
        return { success: true };
      }),

    list: publicProcedure.query(async ({ ctx }) => {
      const { getExperienceLogsByUserId } = await import("./db");
      const userId = ctx.user?.id || 0;
      return await getExperienceLogsByUserId(userId);
    }),

    delete: publicProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        const { deleteExperienceLog } = await import("./db");
        await deleteExperienceLog(input);
        return { success: true };
      }),
  }),

  // Corporate Analysis
  corporate: router({
    analyze: publicProcedure
      .input(z.object({
        companyName: z.string().min(1),
        websiteUrl: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { crawlUrl } = await import("./tools/crawler");
        const { getDartCompanyInfo } = await import("./tools/dart");
        const { getNpsCompanyInfo } = await import("./tools/nps");
        const { analyzeCompany } = await import("./llm-helpers");

        // Fetch URL content, DART info, NPS info, and user settings in parallel
        const [text, dartInfo, npsInfo, orSettings] = await Promise.all([
          input.websiteUrl && input.websiteUrl.length > 5
            ? crawlUrl(input.websiteUrl).catch(() => "")
            : Promise.resolve(""),
          getDartCompanyInfo(input.companyName).catch(e => { console.error("DART fetch failed:", e); return null; }),
          getNpsCompanyInfo(input.companyName).catch(e => { console.error("NPS fetch failed:", e); return null; }),
          getOrSettings(ctx.user?.id),
        ]);

        // Analyze with LLM (using DART + NPS context)
        const llmAnalysis = await analyzeCompany(input.companyName, input.websiteUrl || "", text, dartInfo, npsInfo, orSettings?._rawKey, orSettings?.openRouterModel);

        // Return enriched result with all API data for frontend to save
        return {
          ...llmAnalysis,
          dartInfo: dartInfo || null,
          npsInfo: npsInfo || null,
        };
      }),

    create: publicProcedure
      .input(z.object({
        companyName: z.string().min(1),
        websiteUrl: z.string().optional(),
        analysisResult: z.string(), // JSON string
      }))
      .mutation(async ({ input, ctx }) => {
        const { createCorporateAnalysis } = await import("./db");
        const userId = ctx.user?.id || 0;
        await createCorporateAnalysis({
          userId,
          companyName: input.companyName,
          websiteUrl: input.websiteUrl,
          analysisResult: input.analysisResult,
        });
        return { success: true };
      }),

    list: publicProcedure.query(async ({ ctx }) => {
      const { getCorporateAnalysisByUserId } = await import("./db");
      const userId = ctx.user?.id || 0;
      return await getCorporateAnalysisByUserId(userId);
    }),

    delete: publicProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        const { deleteCorporateAnalysis } = await import("./db");
        await deleteCorporateAnalysis(input);
        return { success: true };
      }),
  }),

  // Experiences - User experience management with AI analysis
  experiences: router({
    list: publicProcedure.query(async ({ ctx }) => {
      const { getExperiencesByUserId } = await import("./db");
      const userId = ctx.user?.id || 0;
      return await getExperiencesByUserId(userId);
    }),

    get: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        const { getExperienceById } = await import("./db");
        return await getExperienceById(input);
      }),

    create: publicProcedure
      .input(z.object({
        title: z.string().min(1),
        content: z.string().min(10),
        category: z.string().optional(),
        analysisType: z.enum(['competency', 'value', 'pdf', 'cover_letter']).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { createExperience } = await import("./db");
        const { analyzeExperience } = await import("./llm-helpers");
        const userId = ctx.user?.id || 0;
        const orSettingsExp = await getOrSettings(userId);

        // Analyze experience with LLM
        const analysis = await analyzeExperience(input.content, input.analysisType || 'competency', orSettingsExp?._rawKey, orSettingsExp?.openRouterModel);

        await createExperience({
          userId,
          title: input.title,
          content: input.content,
          category: analysis.category || input.category,
          analysisType: input.analysisType || 'competency',
          analysis,
        });

        return { success: true, analysis };
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        content: z.string().optional(),
        category: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { updateExperience } = await import("./db");
        const { id, ...data } = input;
        await updateExperience(id, data);
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        const { deleteExperience } = await import("./db");
        await deleteExperience(input);
        return { success: true };
      }),

    reanalyze: publicProcedure
      .input(z.object({
        id: z.number(),
        analysisType: z.enum(['competency', 'value', 'pdf', 'cover_letter']),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getExperienceById, updateExperience } = await import("./db");
        const { analyzeExperience } = await import("./llm-helpers");
        const orSettings = await getOrSettings(ctx.user?.id);

        const exp = await getExperienceById(input.id);
        if (!exp) throw new Error("Experience not found");

        const analysis = await analyzeExperience(exp.content, input.analysisType, orSettings?._rawKey, orSettings?.openRouterModel);
        await updateExperience(input.id, { analysis, analysisType: input.analysisType });

        return { success: true, analysis };
      }),
  }),
});

export type AppRouter = typeof appRouter;
