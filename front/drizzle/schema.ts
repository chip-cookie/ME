import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ─── Users ───────────────────────────────────────────────────────────────────

export const users = sqliteTable("users", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    /** OAuth or local identifier — unique per user */
    openId: text("openId").notNull().unique(),
    /** Username for local auth */
    username: text("username"),
    password: text("password"),
    name: text("name"),
    email: text("email"),
    loginMethod: text("loginMethod"),
    role: text("role").$type<"user" | "admin">().default("user").notNull(),
    openRouterApiKey: text("openRouterApiKey"),
    openRouterModel: text("openRouterModel"),
    createdAt: text("createdAt").default(sql`(current_timestamp)`).notNull(),
    updatedAt: text("updatedAt").default(sql`(current_timestamp)`).notNull(),
    lastSignedIn: text("lastSignedIn").default(sql`(current_timestamp)`).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Services ────────────────────────────────────────────────────────────────

export const services = sqliteTable("services", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    description: text("description"),
    icon: text("icon"),
    category: text("category"),
    order: integer("order").default(0),
    createdAt: text("createdAt").default(sql`(current_timestamp)`).notNull(),
    updatedAt: text("updatedAt").default(sql`(current_timestamp)`).notNull(),
});

export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;

// ─── Case Studies ─────────────────────────────────────────────────────────────

export const caseStudies = sqliteTable("case_studies", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    description: text("description"),
    industry: text("industry"),
    scope: text("scope"),
    impact: text("impact"),
    clientName: text("clientName"),
    results: text("results"),
    imageUrl: text("imageUrl"),
    featured: integer("featured").default(0),
    order: integer("order").default(0),
    createdAt: text("createdAt").default(sql`(current_timestamp)`).notNull(),
    updatedAt: text("updatedAt").default(sql`(current_timestamp)`).notNull(),
});

export type CaseStudy = typeof caseStudies.$inferSelect;
export type InsertCaseStudy = typeof caseStudies.$inferInsert;

// ─── Client Results ───────────────────────────────────────────────────────────

export const clientResults = sqliteTable("client_results", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    clientName: text("clientName").notNull(),
    metric: text("metric").notNull(),
    beforeValue: text("beforeValue"),
    afterValue: text("afterValue"),
    improvement: text("improvement"),
    category: text("category"),
    order: integer("order").default(0),
    createdAt: text("createdAt").default(sql`(current_timestamp)`).notNull(),
    updatedAt: text("updatedAt").default(sql`(current_timestamp)`).notNull(),
});

export type ClientResult = typeof clientResults.$inferSelect;
export type InsertClientResult = typeof clientResults.$inferInsert;

// ─── Insights ─────────────────────────────────────────────────────────────────

export const insights = sqliteTable("insights", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    description: text("description"),
    category: text("category"),
    pdfUrl: text("pdfUrl"),
    featured: integer("featured").default(0),
    order: integer("order").default(0),
    publishedAt: text("publishedAt").default(sql`(current_timestamp)`),
    createdAt: text("createdAt").default(sql`(current_timestamp)`).notNull(),
    updatedAt: text("updatedAt").default(sql`(current_timestamp)`).notNull(),
});

export type Insight = typeof insights.$inferSelect;
export type InsertInsight = typeof insights.$inferInsert;

// ─── Lead Inquiries ───────────────────────────────────────────────────────────

export const leadInquiries = sqliteTable("lead_inquiries", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    companyName: text("companyName").notNull(),
    companySize: text("companySize"),
    industry: text("industry"),
    contactName: text("contactName").notNull(),
    contactEmail: text("contactEmail").notNull(),
    contactPhone: text("contactPhone"),
    projectScope: text("projectScope"),
    projectTimeline: text("projectTimeline"),
    budgetRange: text("budgetRange"),
    challenges: text("challenges"),
    goals: text("goals"),
    status: text("status").$type<"new" | "contacted" | "qualified" | "proposal" | "closed">().default("new"),
    notes: text("notes"),
    createdAt: text("createdAt").default(sql`(current_timestamp)`).notNull(),
    updatedAt: text("updatedAt").default(sql`(current_timestamp)`).notNull(),
});

export type LeadInquiry = typeof leadInquiries.$inferSelect;
export type InsertLeadInquiry = typeof leadInquiries.$inferInsert;

// ─── Writing Style Profiles ───────────────────────────────────────────────────

export const writingStyleProfiles = sqliteTable("writing_style_profiles", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("userId").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    trainingText: text("trainingText"),
    characteristics: text("characteristics"), // JSON stored as text
    createdAt: text("createdAt").default(sql`(current_timestamp)`).notNull(),
    updatedAt: text("updatedAt").default(sql`(current_timestamp)`).notNull(),
});

export type WritingStyleProfile = typeof writingStyleProfiles.$inferSelect;
export type InsertWritingStyleProfile = typeof writingStyleProfiles.$inferInsert;

// ─── Interview Style Profiles ─────────────────────────────────────────────────

export const interviewStyleProfiles = sqliteTable("interview_style_profiles", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("userId").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    trainingText: text("trainingText"),
    characteristics: text("characteristics"), // JSON stored as text
    createdAt: text("createdAt").default(sql`(current_timestamp)`).notNull(),
    updatedAt: text("updatedAt").default(sql`(current_timestamp)`).notNull(),
});

export type InterviewStyleProfile = typeof interviewStyleProfiles.$inferSelect;
export type InsertInterviewStyleProfile = typeof interviewStyleProfiles.$inferInsert;

// ─── Writing History ──────────────────────────────────────────────────────────

export const writingHistory = sqliteTable("writing_history", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("userId").notNull(),
    styleId: integer("styleId"),
    itemType: text("itemType"),
    prompt: text("prompt").notNull(),
    targetCharCount: integer("targetCharCount"),
    generatedText: text("generatedText").notNull(),
    actualCharCount: integer("actualCharCount"),
    jdKeywords: text("jdKeywords"), // JSON array as text
    jdSummary: text("jdSummary"),
    createdAt: text("createdAt").default(sql`(current_timestamp)`).notNull(),
    updatedAt: text("updatedAt").default(sql`(current_timestamp)`).notNull(),
});

export type WritingHistory = typeof writingHistory.$inferSelect;
export type InsertWritingHistory = typeof writingHistory.$inferInsert;

// ─── Interview Questions ──────────────────────────────────────────────────────

export const interviewQuestions = sqliteTable("interview_questions", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("userId").notNull(),
    interviewStyleId: integer("interviewStyleId"),
    writingId: integer("writingId"),
    question: text("question").notNull(),
    suggestedAnswer: text("suggestedAnswer"),
    answerStrategy: text("answerStrategy"),
    category: text("category"),
    difficulty: text("difficulty"),
    createdAt: text("createdAt").default(sql`(current_timestamp)`).notNull(),
});

export type InterviewQuestion = typeof interviewQuestions.$inferSelect;
export type InsertInterviewQuestion = typeof interviewQuestions.$inferInsert;

// ─── Experience Logs ──────────────────────────────────────────────────────────

export const experienceLogs = sqliteTable("experience_logs", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("userId").notNull(),
    content: text("content").notNull(),
    analysisResult: text("analysis_result"), // JSON stored as text
    createdAt: text("createdAt").default(sql`(current_timestamp)`).notNull(),
});

export type ExperienceLog = typeof experienceLogs.$inferSelect;
export type InsertExperienceLog = typeof experienceLogs.$inferInsert;

// ─── Corporate Analysis ───────────────────────────────────────────────────────

export const corporateAnalysis = sqliteTable("corporate_analysis", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("userId").notNull(),
    companyName: text("companyName").notNull(),
    websiteUrl: text("websiteUrl"),
    analysisResult: text("analysisResult"), // JSON stored as text
    createdAt: text("createdAt").default(sql`(current_timestamp)`).notNull(),
});

export type CorporateAnalysis = typeof corporateAnalysis.$inferSelect;
export type InsertCorporateAnalysis = typeof corporateAnalysis.$inferInsert;

// ─── Experiences ──────────────────────────────────────────────────────────────

export const experiences = sqliteTable("experiences", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("userId").notNull(),
    title: text("title").notNull(),
    category: text("category"),
    content: text("content").notNull(),
    analysisType: text("analysisType"),
    analysis: text("analysis"), // JSON stored as text
    createdAt: text("createdAt").default(sql`(current_timestamp)`).notNull(),
    updatedAt: text("updatedAt").default(sql`(current_timestamp)`).notNull(),
});

export type Experience = typeof experiences.$inferSelect;
export type InsertExperience = typeof experiences.$inferInsert;
