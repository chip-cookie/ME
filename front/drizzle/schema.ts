import { integer, pgEnum, pgTable, text, timestamp, varchar, json, serial } from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = pgTable("users", {
    /**
     * Surrogate primary key. Auto-incremented numeric value managed by the database.
     * Use this for relations between tables.
     */
    id: serial("id").primaryKey(),
    /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
    openId: varchar("openId", { length: 64 }).notNull().unique(),
    /** Username for local authentication */
    username: varchar("username", { length: 64 }),
    password: text("password"), // Hashed password
    name: text("name"),
    email: varchar("email", { length: 320 }),
    loginMethod: varchar("loginMethod", { length: 64 }),
    role: text("role").$type<"user" | "admin">().default("user").notNull(), // Use text for simplicity in Postgres
    /** 사용자가 연동한 OpenRouter API 키 (개인 LLM 사용을 위해) */
    openRouterApiKey: text("openRouterApiKey"),
    /** 사용자가 선택한 OpenRouter 모델 (기본값: anthropic/claude-3.5-haiku) */
    openRouterModel: varchar("openRouterModel", { length: 128 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
    lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Services table - Stores consulting service offerings
 */
export const services = pgTable("services", {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    icon: varchar("icon", { length: 100 }),
    category: varchar("category", { length: 100 }),
    order: integer("order").default(0),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;

/**
 * Case Studies table - Stores client case studies and success stories
 */
export const caseStudies = pgTable("case_studies", {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    industry: varchar("industry", { length: 100 }),
    scope: varchar("scope", { length: 100 }),
    impact: varchar("impact", { length: 100 }),
    clientName: varchar("clientName", { length: 255 }),
    results: text("results"),
    imageUrl: varchar("imageUrl", { length: 500 }),
    featured: integer("featured").default(0),
    order: integer("order").default(0),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type CaseStudy = typeof caseStudies.$inferSelect;
export type InsertCaseStudy = typeof caseStudies.$inferInsert;

/**
 * Client Results table - Stores KPI and performance metrics
 */
export const clientResults = pgTable("client_results", {
    id: serial("id").primaryKey(),
    clientName: varchar("clientName", { length: 255 }).notNull(),
    metric: varchar("metric", { length: 255 }).notNull(),
    beforeValue: varchar("beforeValue", { length: 100 }),
    afterValue: varchar("afterValue", { length: 100 }),
    improvement: varchar("improvement", { length: 100 }),
    category: varchar("category", { length: 100 }),
    order: integer("order").default(0),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ClientResult = typeof clientResults.$inferSelect;
export type InsertClientResult = typeof clientResults.$inferInsert;

/**
 * Insights table - Stores analyst reports and research documents
 */
export const insights = pgTable("insights", {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 100 }),
    pdfUrl: varchar("pdfUrl", { length: 500 }),
    featured: integer("featured").default(0),
    order: integer("order").default(0),
    publishedAt: timestamp("publishedAt").defaultNow(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Insight = typeof insights.$inferSelect;
export type InsertInsight = typeof insights.$inferInsert;

/**
 * Lead Inquiries table - Stores multi-step lead qualification form submissions
 */
export const leadInquiries = pgTable("lead_inquiries", {
    id: serial("id").primaryKey(),
    companyName: varchar("companyName", { length: 255 }).notNull(),
    companySize: varchar("companySize", { length: 50 }),
    industry: varchar("industry", { length: 100 }),
    contactName: varchar("contactName", { length: 255 }).notNull(),
    contactEmail: varchar("contactEmail", { length: 320 }).notNull(),
    contactPhone: varchar("contactPhone", { length: 20 }),
    projectScope: text("projectScope"),
    projectTimeline: varchar("projectTimeline", { length: 100 }),
    budgetRange: varchar("budgetRange", { length: 100 }),
    challenges: text("challenges"),
    goals: text("goals"),
    status: text("status").$type<"new" | "contacted" | "qualified" | "proposal" | "closed">().default("new"),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type LeadInquiry = typeof leadInquiries.$inferSelect;
export type InsertLeadInquiry = typeof leadInquiries.$inferInsert;

/**
 * Writing Style Profiles table - Stores learned writing styles for cover letters
 */
export const writingStyleProfiles = pgTable("writing_style_profiles", {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    trainingText: text("trainingText"),
    characteristics: text("characteristics"), // JSON
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type WritingStyleProfile = typeof writingStyleProfiles.$inferSelect;
export type InsertWritingStyleProfile = typeof writingStyleProfiles.$inferInsert;

/**
 * Interview Style Profiles table - Stores learned interview answer styles (separate DB)
 */
export const interviewStyleProfiles = pgTable("interview_style_profiles", {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    trainingText: text("trainingText"),
    characteristics: text("characteristics"), // JSON
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type InterviewStyleProfile = typeof interviewStyleProfiles.$inferSelect;
export type InsertInterviewStyleProfile = typeof interviewStyleProfiles.$inferInsert;

/**
 * Writing History table - Stores generated cover letters with character count tracking
 */
export const writingHistory = pgTable("writing_history", {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull(),
    styleId: integer("styleId"),
    itemType: varchar("itemType", { length: 100 }),
    prompt: text("prompt").notNull(),
    targetCharCount: integer("targetCharCount"),
    generatedText: text("generatedText").notNull(),
    actualCharCount: integer("actualCharCount"),
    jdKeywords: text("jdKeywords"), // JSON array
    jdSummary: text("jdSummary"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type WritingHistory = typeof writingHistory.$inferSelect;
export type InsertWritingHistory = typeof writingHistory.$inferInsert;

/**
 * Interview Questions table - Stores generated interview questions with consulting info
 */
export const interviewQuestions = pgTable("interview_questions", {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull(),
    interviewStyleId: integer("interviewStyleId"),
    writingId: integer("writingId"),
    question: text("question").notNull(),
    suggestedAnswer: text("suggestedAnswer"),
    answerStrategy: text("answerStrategy"),
    category: varchar("category", { length: 100 }),
    difficulty: varchar("difficulty", { length: 20 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InterviewQuestion = typeof interviewQuestions.$inferSelect;
export type InsertInterviewQuestion = typeof interviewQuestions.$inferInsert;

/**
 * Experience Logs table - Stores user experiences and sentiment/personality analysis
 */
export const experienceLogs = pgTable("experience_logs", {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull(),
    content: text("content").notNull(),
    analysisResult: json("analysis_result"), // JSON: { star_summary, personality }
    createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ExperienceLog = typeof experienceLogs.$inferSelect;
export type InsertExperienceLog = typeof experienceLogs.$inferInsert;

/**
 * Corporate Analysis table - Stores company analysis results
 */
export const corporateAnalysis = pgTable("corporate_analysis", {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull(),
    companyName: varchar("companyName", { length: 255 }).notNull(),
    websiteUrl: varchar("websiteUrl", { length: 500 }),
    analysisResult: json("analysisResult"), // JSON: { mission, financials, news, business_direction }
    createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CorporateAnalysis = typeof corporateAnalysis.$inferSelect;
export type InsertCorporateAnalysis = typeof corporateAnalysis.$inferInsert;

/**
 * Experiences table - Stores user experiences with AI analysis for cover letter generation
 */
export const experiences = pgTable("experiences", {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    category: varchar("category", { length: 50 }), // 역량, 가치관, 성과, 리더십 등
    content: text("content").notNull(), // 원본 경험 텍스트
    analysisType: varchar("analysisType", { length: 50 }), // competency, value, pdf, cover_letter
    analysis: json("analysis"), // JSON: { situation, action, result, achievement, lesson, core_value }
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Experience = typeof experiences.$inferSelect;
export type InsertExperience = typeof experiences.$inferInsert;
