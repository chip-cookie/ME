import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import fs from "fs";
import path from "path";
import {
  InsertUser,
  users,
  services,
  caseStudies,
  clientResults,
  insights,
  leadInquiries,
  InsertLeadInquiry,
  writingStyleProfiles,
  interviewStyleProfiles,
  writingHistory,
  interviewQuestions,
  experienceLogs,
  corporateAnalysis,
  experiences,
} from "../drizzle/schema";
import { ENV } from './_core/env';
import { DEFAULT_OPENROUTER_MODEL } from '../shared/const';

type DrizzleDb = ReturnType<typeof drizzle>;
let _db: DrizzleDb | null = null;

/**
 * sqlite:///./data/db.sqlite  →  file:./data/db.sqlite
 * sqlite:////abs/path.sqlite  →  file:/abs/path.sqlite
 * file:./data/db.sqlite       →  그대로 사용
 * libsql://...                →  그대로 사용 (Turso cloud)
 */
function normalizeDbUrl(url: string): string {
  if (url.startsWith("sqlite:///./")) {
    return `file:./${url.slice("sqlite:///./".length)}`;
  }
  if (url.startsWith("sqlite:////")) {
    return `file:/${url.slice("sqlite:////".length)}`;
  }
  if (url.startsWith("sqlite:///:memory:")) {
    return ":memory:";
  }
  return url;
}

/** libsql 파일 경로에서 디렉토리를 미리 생성합니다 */
function ensureDbDir(url: string) {
  if (url.startsWith("file:")) {
    const filePath = url.slice("file:".length);
    const dir = path.dirname(path.resolve(filePath));
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Lazily create the drizzle instance
export async function getDb(): Promise<DrizzleDb | null> {
  if (_db) return _db;

  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) {
    console.warn("[Database] DATABASE_URL is not set. DB features will be disabled.");
    return null;
  }

  try {
    const url = normalizeDbUrl(rawUrl);
    ensureDbDir(url);

    const client = createClient({ url });
    _db = drizzle(client);

    // 테이블이 없으면 자동 생성 (SQLite only)
    await initializeTables(client);

    console.log("[Database] Connected:", url.startsWith("file:") ? url : "(cloud)");
    return _db;
  } catch (error) {
    console.error("[Database] Failed to connect:", error);
    return null;
  }
}

/** SQLite 테이블이 없을 경우 자동으로 생성합니다 (drizzle-kit push 대체) */
async function initializeTables(client: ReturnType<typeof createClient>) {
  const ddl = [
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      openId TEXT NOT NULL UNIQUE,
      username TEXT,
      password TEXT,
      name TEXT,
      email TEXT,
      loginMethod TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      openRouterApiKey TEXT,
      openRouterModel TEXT,
      createdAt TEXT NOT NULL DEFAULT (current_timestamp),
      updatedAt TEXT NOT NULL DEFAULT (current_timestamp),
      lastSignedIn TEXT NOT NULL DEFAULT (current_timestamp)
    )`,
    `CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      category TEXT,
      "order" INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL DEFAULT (current_timestamp),
      updatedAt TEXT NOT NULL DEFAULT (current_timestamp)
    )`,
    `CREATE TABLE IF NOT EXISTS case_studies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      industry TEXT,
      scope TEXT,
      impact TEXT,
      clientName TEXT,
      results TEXT,
      imageUrl TEXT,
      featured INTEGER DEFAULT 0,
      "order" INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL DEFAULT (current_timestamp),
      updatedAt TEXT NOT NULL DEFAULT (current_timestamp)
    )`,
    `CREATE TABLE IF NOT EXISTS client_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clientName TEXT NOT NULL,
      metric TEXT NOT NULL,
      beforeValue TEXT,
      afterValue TEXT,
      improvement TEXT,
      category TEXT,
      "order" INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL DEFAULT (current_timestamp),
      updatedAt TEXT NOT NULL DEFAULT (current_timestamp)
    )`,
    `CREATE TABLE IF NOT EXISTS insights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT,
      pdfUrl TEXT,
      featured INTEGER DEFAULT 0,
      "order" INTEGER DEFAULT 0,
      publishedAt TEXT DEFAULT (current_timestamp),
      createdAt TEXT NOT NULL DEFAULT (current_timestamp),
      updatedAt TEXT NOT NULL DEFAULT (current_timestamp)
    )`,
    `CREATE TABLE IF NOT EXISTS lead_inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      companyName TEXT NOT NULL,
      companySize TEXT,
      industry TEXT,
      contactName TEXT NOT NULL,
      contactEmail TEXT NOT NULL,
      contactPhone TEXT,
      projectScope TEXT,
      projectTimeline TEXT,
      budgetRange TEXT,
      challenges TEXT,
      goals TEXT,
      status TEXT DEFAULT 'new',
      notes TEXT,
      createdAt TEXT NOT NULL DEFAULT (current_timestamp),
      updatedAt TEXT NOT NULL DEFAULT (current_timestamp)
    )`,
    `CREATE TABLE IF NOT EXISTS writing_style_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      trainingText TEXT,
      characteristics TEXT,
      createdAt TEXT NOT NULL DEFAULT (current_timestamp),
      updatedAt TEXT NOT NULL DEFAULT (current_timestamp)
    )`,
    `CREATE TABLE IF NOT EXISTS interview_style_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      trainingText TEXT,
      characteristics TEXT,
      createdAt TEXT NOT NULL DEFAULT (current_timestamp),
      updatedAt TEXT NOT NULL DEFAULT (current_timestamp)
    )`,
    `CREATE TABLE IF NOT EXISTS writing_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      styleId INTEGER,
      itemType TEXT,
      prompt TEXT NOT NULL,
      targetCharCount INTEGER,
      generatedText TEXT NOT NULL,
      actualCharCount INTEGER,
      jdKeywords TEXT,
      jdSummary TEXT,
      createdAt TEXT NOT NULL DEFAULT (current_timestamp),
      updatedAt TEXT NOT NULL DEFAULT (current_timestamp)
    )`,
    `CREATE TABLE IF NOT EXISTS interview_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      interviewStyleId INTEGER,
      writingId INTEGER,
      question TEXT NOT NULL,
      suggestedAnswer TEXT,
      answerStrategy TEXT,
      category TEXT,
      difficulty TEXT,
      createdAt TEXT NOT NULL DEFAULT (current_timestamp)
    )`,
    `CREATE TABLE IF NOT EXISTS experience_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      content TEXT NOT NULL,
      analysis_result TEXT,
      createdAt TEXT NOT NULL DEFAULT (current_timestamp)
    )`,
    `CREATE TABLE IF NOT EXISTS corporate_analysis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      companyName TEXT NOT NULL,
      websiteUrl TEXT,
      analysisResult TEXT,
      createdAt TEXT NOT NULL DEFAULT (current_timestamp)
    )`,
    `CREATE TABLE IF NOT EXISTS experiences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      title TEXT NOT NULL,
      category TEXT,
      content TEXT NOT NULL,
      analysisType TEXT,
      analysis TEXT,
      createdAt TEXT NOT NULL DEFAULT (current_timestamp),
      updatedAt TEXT NOT NULL DEFAULT (current_timestamp)
    )`,
  ];

  for (const stmt of ddl) {
    await client.execute(stmt);
  }
}

// Re-export table types for use in other files
export {
  services,
  caseStudies,
  caseStudies as caseStudiesTable,
  clientResults,
  insights,
  leadInquiries,
  writingStyleProfiles,
  interviewStyleProfiles,
  writingHistory,
  interviewQuestions,
  experienceLogs,
  corporateAnalysis,
  experiences,
} from "../drizzle/schema";

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      values[field] = value ?? null;
      updateSet[field] = value ?? null;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    const role = user.role ?? (user.openId === ENV.ownerOpenId ? 'admin' : undefined);
    if (role) {
      values.role = role;
      updateSet.role = role;
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date().toISOString() as any;
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date().toISOString();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users);
}

export async function updateUserOpenRouterSettings(
  userId: number,
  settings: { openRouterApiKey?: string | null; openRouterModel?: string | null }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({
    ...(settings.openRouterApiKey !== undefined && { openRouterApiKey: settings.openRouterApiKey }),
    ...(settings.openRouterModel !== undefined && { openRouterModel: settings.openRouterModel }),
  }).where(eq(users.id, userId));
}

export async function getUserOpenRouterSettings(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select({ openRouterApiKey: users.openRouterApiKey, openRouterModel: users.openRouterModel })
    .from(users).where(eq(users.id, userId)).limit(1);
  if (!result.length) return null;
  const { openRouterApiKey, openRouterModel } = result[0];
  return {
    hasKey: !!openRouterApiKey,
    maskedKey: openRouterApiKey ? `sk-or-...${openRouterApiKey.slice(-4)}` : null,
    openRouterModel: openRouterModel ?? DEFAULT_OPENROUTER_MODEL,
    _rawKey: openRouterApiKey ?? null,
  };
}

// ─── Services ────────────────────────────────────────────────────────────────

export async function getAllServices() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(services).orderBy(services.order);
}

// ─── Case Studies ─────────────────────────────────────────────────────────────

export async function getAllCaseStudies() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(caseStudies).orderBy(caseStudies.order);
}

export async function getCaseStudiesByFilters(industry?: string, scope?: string, impact?: string) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [
    industry ? eq(caseStudies.industry, industry) : undefined,
    scope ? eq(caseStudies.scope, scope) : undefined,
    impact ? eq(caseStudies.impact, impact) : undefined,
  ].filter((c): c is NonNullable<typeof c> => c !== undefined);

  const query = conditions.length > 0
    ? db.select().from(caseStudies).where(and(...conditions))
    : db.select().from(caseStudies);

  return await query.orderBy(caseStudies.order);
}

// ─── Client Results ───────────────────────────────────────────────────────────

export async function getAllClientResults() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(clientResults).orderBy(clientResults.order);
}

export async function getClientResultsByCategory(category: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(clientResults).where(eq(clientResults.category, category)).orderBy(clientResults.order);
}

// ─── Insights ─────────────────────────────────────────────────────────────────

export async function getAllInsights() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(insights).orderBy(insights.order);
}

export async function getFeaturedInsights() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(insights).where(eq(insights.featured, 1)).orderBy(insights.order);
}

// ─── Lead Inquiries ───────────────────────────────────────────────────────────

export async function createLeadInquiry(inquiry: InsertLeadInquiry) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(leadInquiries).values(inquiry);
}

export async function getLeadInquiries() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(leadInquiries).orderBy(leadInquiries.createdAt);
}

export async function updateLeadInquiryStatus(id: number, status: "new" | "contacted" | "qualified" | "proposal" | "closed") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(leadInquiries).set({ status }).where(eq(leadInquiries.id, id));
}

// ─── Writing Style Profiles ───────────────────────────────────────────────────

export async function createWritingStyleProfile(profile: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(writingStyleProfiles).values(profile);
}

export async function getWritingStyleProfilesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(writingStyleProfiles).where(eq(writingStyleProfiles.userId, userId));
}

export async function getWritingStyleProfileById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(writingStyleProfiles).where(eq(writingStyleProfiles.id, id)).limit(1);
  return result[0];
}

export async function deleteWritingStyleProfile(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(writingStyleProfiles).where(eq(writingStyleProfiles.id, id));
}

export async function updateWritingStyleProfile(id: number, updates: { characteristics?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(writingStyleProfiles).set(updates).where(eq(writingStyleProfiles.id, id));
}

// ─── Interview Style Profiles ─────────────────────────────────────────────────

export async function createInterviewStyleProfile(profile: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(interviewStyleProfiles).values(profile);
}

export async function getInterviewStyleProfilesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(interviewStyleProfiles).where(eq(interviewStyleProfiles.userId, userId));
}

export async function getInterviewStyleProfileById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(interviewStyleProfiles).where(eq(interviewStyleProfiles.id, id)).limit(1);
  return result[0];
}

export async function deleteInterviewStyleProfile(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(interviewStyleProfiles).where(eq(interviewStyleProfiles.id, id));
}

// ─── Writing History ──────────────────────────────────────────────────────────

export async function createWritingHistory(history: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(writingHistory).values(history);
}

export async function getWritingHistoryByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(writingHistory).where(eq(writingHistory.userId, userId)).orderBy(writingHistory.createdAt);
}

export async function getWritingHistoryById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(writingHistory).where(eq(writingHistory.id, id)).limit(1);
  return result[0];
}

// ─── Interview Questions ──────────────────────────────────────────────────────

export async function createInterviewQuestions(questions: any[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(interviewQuestions).values(questions);
}

export async function getInterviewQuestionsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(interviewQuestions).where(eq(interviewQuestions.userId, userId)).orderBy(interviewQuestions.createdAt);
}

export async function getInterviewQuestionsByWritingId(writingId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(interviewQuestions).where(eq(interviewQuestions.writingId, writingId)).orderBy(interviewQuestions.createdAt);
}

// ─── Experience Logs ──────────────────────────────────────────────────────────

export async function getExperienceLogsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(experienceLogs).where(eq(experienceLogs.userId, userId)).orderBy(experienceLogs.createdAt);
}

export async function createExperienceLog(data: { userId: number; content: string; analysisResult: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.insert(experienceLogs).values(data);
}

export async function deleteExperienceLog(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.delete(experienceLogs).where(eq(experienceLogs.id, id));
}

// ─── Corporate Analysis ───────────────────────────────────────────────────────

export async function getCorporateAnalysisByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(corporateAnalysis).where(eq(corporateAnalysis.userId, userId)).orderBy(corporateAnalysis.createdAt);
}

export async function createCorporateAnalysis(data: {
  userId: number;
  companyName: string;
  websiteUrl?: string;
  analysisResult: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.insert(corporateAnalysis).values(data);
}

export async function deleteCorporateAnalysis(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.delete(corporateAnalysis).where(eq(corporateAnalysis.id, id));
}

export async function getCorporateAnalysisById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(corporateAnalysis).where(eq(corporateAnalysis.id, id));
  return result[0] ?? null;
}

// ─── Experiences ──────────────────────────────────────────────────────────────

export async function getExperiencesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(experiences).where(eq(experiences.userId, userId)).orderBy(experiences.createdAt);
  return rows.map(r => ({ ...r, analysis: tryParse(r.analysis) }));
}

export async function getExperienceById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(experiences).where(eq(experiences.id, id));
  if (!result[0]) return null;
  return { ...result[0], analysis: tryParse(result[0].analysis) };
}

export async function createExperience(data: {
  userId: number;
  title: string;
  category?: string;
  content: string;
  analysisType?: string;
  analysis?: Record<string, unknown>;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  const { analysis, ...rest } = data;
  return await db.insert(experiences).values({
    ...rest,
    analysis: analysis ? JSON.stringify(analysis) : null,
  });
}

export async function updateExperience(id: number, data: {
  title?: string;
  category?: string;
  content?: string;
  analysisType?: string;
  analysis?: Record<string, unknown>;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  const { analysis, ...rest } = data;
  return await db.update(experiences).set({
    ...rest,
    ...(analysis !== undefined && { analysis: JSON.stringify(analysis) }),
  }).where(eq(experiences.id, id));
}

export async function deleteExperience(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.delete(experiences).where(eq(experiences.id, id));
}

function tryParse(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try { return JSON.parse(value); } catch { return value; }
}
