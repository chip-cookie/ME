import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
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

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = neon(process.env.DATABASE_URL);
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// Re-export table types for use in other files
export {
  services,
  caseStudies,
  caseStudies as caseStudiesTable, // Backward compat alias if needed
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
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    // Postgres onConflictDoUpdate
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
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get users: database not available");
    return [];
  }

  return await db.select().from(users);
}

/**
 * Services queries
 */
export async function getAllServices() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(services).orderBy(services.order);
}

/**
 * Case Studies queries
 */
export async function getAllCaseStudies() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(caseStudies).orderBy(caseStudies.order);
}

export async function getCaseStudiesByFilters(industry?: string, scope?: string, impact?: string) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(caseStudies) as any;

  if (industry) {
    query = query.where(eq(caseStudies.industry, industry));
  }
  if (scope) {
    query = query.where(eq(caseStudies.scope, scope));
  }
  if (impact) {
    query = query.where(eq(caseStudies.impact, impact));
  }

  return await query.orderBy(caseStudies.order);
}

/**
 * Client Results queries
 */
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

/**
 * Insights queries
 */
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

/**
 * Lead Inquiries queries
 */
export async function createLeadInquiry(inquiry: InsertLeadInquiry) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(leadInquiries).values(inquiry);
  return result;
}

export async function getLeadInquiries() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(leadInquiries).orderBy(leadInquiries.createdAt);
}

export async function updateLeadInquiryStatus(id: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(leadInquiries).set({ status: status as any }).where(eq(leadInquiries.id, id));
}

/**
 * Writing Style Profiles queries
 */
export async function createWritingStyleProfile(profile: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(writingStyleProfiles).values(profile);
  return result;
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
  return result.length > 0 ? result[0] : undefined;
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

/**
 * Interview Style Profiles queries
 */
export async function createInterviewStyleProfile(profile: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(interviewStyleProfiles).values(profile);
  return result;
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
  return result.length > 0 ? result[0] : undefined;
}

export async function deleteInterviewStyleProfile(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(interviewStyleProfiles).where(eq(interviewStyleProfiles.id, id));
}

/**
 * Writing History queries
 */
export async function createWritingHistory(history: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(writingHistory).values(history);
  return result;
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
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Interview Questions queries
 */
export async function createInterviewQuestions(questions: any[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(interviewQuestions).values(questions);
  return result;
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

// Experience Logs
export async function getExperienceLogsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(experienceLogs).where(eq(experienceLogs.userId, userId)).orderBy(experienceLogs.createdAt);
}

export async function createExperienceLog(data: {
  userId: number;
  content: string;
  analysisResult: string; // JSON string
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.insert(experienceLogs).values(data);
}

export async function deleteExperienceLog(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.delete(experienceLogs).where(eq(experienceLogs.id, id));
}

// Corporate Analysis
export async function getCorporateAnalysisByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(corporateAnalysis).where(eq(corporateAnalysis.userId, userId)).orderBy(corporateAnalysis.createdAt);
}

export async function createCorporateAnalysis(data: {
  userId: number;
  companyName: string;
  websiteUrl?: string;
  analysisResult: string; // JSON string
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
  return result[0] || null;
}

// Experiences
export async function getExperiencesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(experiences).where(eq(experiences.userId, userId)).orderBy(experiences.createdAt);
}

export async function getExperienceById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(experiences).where(eq(experiences.id, id));
  return result[0] || null;
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
  return await db.insert(experiences).values(data);
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
  return await db.update(experiences).set(data).where(eq(experiences.id, id));
}

export async function deleteExperience(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.delete(experiences).where(eq(experiences.id, id));
}
