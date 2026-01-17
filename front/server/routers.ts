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

        return { success: true, id: (result as any).insertId };
      }),

    deleteStyle: publicProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        const { deleteWritingStyleProfile } = await import("./db");
        await deleteWritingStyleProfile(input);
        return { success: true };
      }),
  }),

  // Interview Learning - Interview answer style management (separate DB)
  interviewLearning: router({
    listStyles: protectedProcedure.query(async ({ ctx }) => {
      const { getInterviewStyleProfilesByUserId } = await import("./db");
      return await getInterviewStyleProfilesByUserId(ctx.user!.id);
    }),

    createStyle: protectedProcedure
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

        const result = await createInterviewStyleProfile({
          userId: ctx.user!.id,
          name: input.name,
          description: input.description,
          trainingText: input.trainingText,
          characteristics: JSON.stringify(characteristics),
        });

        return { success: true, id: (result as any).insertId };
      }),

    deleteStyle: protectedProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        const { deleteInterviewStyleProfile } = await import("./db");
        await deleteInterviewStyleProfile(input);
        return { success: true };
      }),
  }),

  // Writing - Cover letter generation with character count constraints
  writing: router({
    generate: protectedProcedure
      .input(z.object({
        prompt: z.string().min(1),
        styleId: z.number().optional(),
        itemType: z.string().optional(),
        targetCharCount: z.number().optional(),
        context: z.object({
          jd_keywords: z.array(z.string()).optional(),
          jd_summary: z.string().optional(),
        }).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getWritingStyleProfileById, createWritingHistory } = await import("./db");
        const { generateCoverLetter } = await import("./llm-helpers");

        // Get style info if provided
        let styleInfo = null;
        if (input.styleId) {
          styleInfo = await getWritingStyleProfileById(input.styleId);
        }

        // Generate cover letter with character count constraint and RAG
        const result = await generateCoverLetter({
          prompt: input.prompt,
          style: styleInfo?.characteristics ? JSON.parse(styleInfo.characteristics) : null,
          trainingText: styleInfo?.trainingText || undefined, // Pass training text for RAG
          itemType: input.itemType,
          targetCharCount: input.targetCharCount,
          jdKeywords: input.context?.jd_keywords,
          jdSummary: input.context?.jd_summary,
        });

        // Calculate actual character count (excluding spaces)
        const actualCharCount = result.text.replace(/\s/g, '').length;

        // Save to history
        const history = await createWritingHistory({
          userId: ctx.user!.id,
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
          styleSimilarity: result.styleSimilarity, // Top-k based similarity score
          historyId: (history as any).insertId
        };
      }),

    getHistory: protectedProcedure.query(async ({ ctx }) => {
      const { getWritingHistoryByUserId } = await import("./db");
      return await getWritingHistoryByUserId(ctx.user!.id);
    }),

    getById: protectedProcedure
      .input(z.number())
      .query(async ({ input }) => {
        const { getWritingHistoryById } = await import("./db");
        return await getWritingHistoryById(input);
      }),
  }),

  // Interview - Question generation with consulting (answer strategy and tips)
  interview: router({
    generateQuestions: protectedProcedure
      .input(z.object({
        writingId: z.number().optional(),
        coverLetterText: z.string().optional(),
        interviewStyleId: z.number().optional(),
        questionCount: z.number().default(5),
      }))
      .mutation(async ({ input, ctx }) => {
        const {
          getWritingHistoryById,
          getInterviewStyleProfileById,
          createInterviewQuestions
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

        // Generate interview questions with consulting
        const questions = await generateInterviewQuestionsWithConsulting({
          coverLetterText: text,
          interviewStyle: interviewStyle?.characteristics ? JSON.parse(interviewStyle.characteristics) : null,
          questionCount: input.questionCount,
        });

        // Save to database
        const questionsToSave = questions.map((q: any) => ({
          userId: ctx.user!.id,
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

    getQuestions: protectedProcedure.query(async ({ ctx }) => {
      const { getInterviewQuestionsByUserId } = await import("./db");
      return await getInterviewQuestionsByUserId(ctx.user!.id);
    }),

    getByWritingId: protectedProcedure
      .input(z.number())
      .query(async ({ input }) => {
        const { getInterviewQuestionsByWritingId } = await import("./db");
        return await getInterviewQuestionsByWritingId(input);
      }),
  }),
});

export type AppRouter = typeof appRouter;
