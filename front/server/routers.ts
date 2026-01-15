import { COOKIE_NAME } from "@shared/const";
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

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
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
});

export type AppRouter = typeof appRouter;
