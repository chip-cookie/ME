import { COOKIE_NAME } from "../shared/const";
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
} from "./db";
import { getAllPosts, getPostBySlug, getFeaturedPosts } from "./content";
import { registerUser, loginUser } from "./auth";
import { ONE_YEAR_MS } from "../shared/const";

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

        // Analyze style using LLM
        const characteristics = await analyzeWritingStyle(input.trainingText);
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
      .mutation(async ({ input }) => {
        const { analyzeWritingStyle } = await import("./llm-helpers");
        const characteristics = await analyzeWritingStyle(input.text);
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

        // Analyze interview style using LLM
        const characteristics = await analyzeInterviewStyle(input.trainingText);
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
      .mutation(async ({ input }) => {
        const { analyzeInterviewStyle } = await import("./llm-helpers");
        const characteristics = await analyzeInterviewStyle(input.text);
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
        const { getWritingStyleProfileById, createWritingHistory, getExperienceLogsByUserId } = await import("./db");
        const { generateCoverLetter } = await import("./llm-helpers");

        // Get style info if provided
        let styleInfo = null;
        if (input.styleId) {
          styleInfo = await getWritingStyleProfileById(input.styleId);
        }

        // Get experience info if provided
        let experienceContext = null;
        if (input.experienceId) {
          const userId = ctx.user?.id || 0;
          const logs = await getExperienceLogsByUserId(userId);
          const log = logs.find(l => l.id === input.experienceId);
          if (log && log.analysisResult) {
            experienceContext = typeof log.analysisResult === 'string'
              ? JSON.parse(log.analysisResult)
              : log.analysisResult;
          }
        }

        // Get corporate info if provided
        let corporateContext = undefined;
        if (input.corporateId) {
          const { getCorporateAnalysisById } = await import("./db");
          const userId = ctx.user?.id || 0;
          const corp = await getCorporateAnalysisById(input.corporateId);
          if (corp && corp.userId === userId) {
            corporateContext = typeof corp.analysisResult === 'string' ? JSON.parse(corp.analysisResult) : corp.analysisResult;
            if (corporateContext) {
              corporateContext.companyName = corp.companyName;
            }
          }
        }

        // Get collective patterns from admin (format/structure only, no content)
        let collectivePatterns = undefined;
        try {
          const { getAdminUserId } = await import("./auth");
          const { getWritingStyleProfilesByUserId } = await import("./db");
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
          experienceContext, // Pass STAR summary
          corporateContext, // Pass Corporate Analysis
          collectivePatterns, // Pass admin's aggregated patterns (format/structure only)
        });

        // Calculate actual character count (excluding spaces)
        const actualCharCount = result.text.replace(/\s/g, '').length;
        const userId = ctx.user?.id || 0;

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

        // Get cover letter text
        let text = input.coverLetterText;
        if (!text && input.writingId) {
          const history = await getWritingHistoryById(input.writingId);
          text = history?.generatedText;
        }

        if (!text) {
          throw new Error("자소서 내용이 필요합니다");
        }

        // Get interview style if provided
        let interviewStyle = null;
        if (input.interviewStyleId) {
          interviewStyle = await getInterviewStyleProfileById(input.interviewStyleId);
        }

        // Get corporate info if provided
        let corporateContext = undefined;
        if (input.corporateId) {
          const userId = ctx.user?.id || 0;
          const corp = await getCorporateAnalysisById(input.corporateId);
          if (corp && corp.userId === userId) {
            corporateContext = typeof corp.analysisResult === 'string' ? JSON.parse(corp.analysisResult) : corp.analysisResult;
            if (corporateContext) {
              corporateContext.companyName = corp.companyName;
            }
          }
        }

        // Generate interview questions with consulting
        const questions = await generateInterviewQuestionsWithConsulting({
          coverLetterText: text,
          interviewStyle: interviewStyle?.characteristics ? JSON.parse(interviewStyle.characteristics) : null,
          questionCount: input.questionCount,
          corporateContext,
        });

        const userId = ctx.user?.id || 0;

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
      const userId = ctx.user?.id || 0;
      return await getInterviewQuestionsByUserId(userId);
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
      .mutation(async ({ input }) => {
        const { analyzeExperience } = await import("./llm-helpers");
        const analysis = await analyzeExperience(input.text);
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
      .mutation(async ({ input }) => {
        const { crawlUrl } = await import("./tools/crawler");
        const { getDartCompanyInfo } = await import("./tools/dart");
        const { getNpsCompanyInfo } = await import("./tools/nps");
        const { analyzeCompany } = await import("./llm-helpers");

        let text = "";
        if (input.websiteUrl && input.websiteUrl.length > 5) {
          text = await crawlUrl(input.websiteUrl);
        }

        // Fetch DART info
        let dartInfo = null;
        try {
          if (input.companyName) {
            dartInfo = await getDartCompanyInfo(input.companyName);
          }
        } catch (e) {
          console.error("DART fetch failed:", e);
        }

        // Fetch NPS info
        let npsInfo = null;
        try {
          if (input.companyName) {
            npsInfo = await getNpsCompanyInfo(input.companyName);
          }
        } catch (e) {
          console.error("NPS fetch failed:", e);
        }

        // Analyze with LLM (using DART + NPS context)
        const llmAnalysis = await analyzeCompany(input.companyName, input.websiteUrl || "", text, dartInfo, npsInfo);

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
});

export type AppRouter = typeof appRouter;
