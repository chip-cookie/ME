import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Services table - Stores consulting service offerings
 */
export const services = mysqlTable("services", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 100 }),
  category: varchar("category", { length: 100 }),
  order: int("order").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;

/**
 * Case Studies table - Stores client case studies and success stories
 */
export const caseStudies = mysqlTable("case_studies", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  industry: varchar("industry", { length: 100 }),
  scope: varchar("scope", { length: 100 }),
  impact: varchar("impact", { length: 100 }),
  clientName: varchar("clientName", { length: 255 }),
  results: text("results"),
  imageUrl: varchar("imageUrl", { length: 500 }),
  featured: int("featured").default(0),
  order: int("order").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CaseStudy = typeof caseStudies.$inferSelect;
export type InsertCaseStudy = typeof caseStudies.$inferInsert;

/**
 * Client Results table - Stores KPI and performance metrics
 */
export const clientResults = mysqlTable("client_results", {
  id: int("id").autoincrement().primaryKey(),
  clientName: varchar("clientName", { length: 255 }).notNull(),
  metric: varchar("metric", { length: 255 }).notNull(),
  beforeValue: varchar("beforeValue", { length: 100 }),
  afterValue: varchar("afterValue", { length: 100 }),
  improvement: varchar("improvement", { length: 100 }),
  category: varchar("category", { length: 100 }),
  order: int("order").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClientResult = typeof clientResults.$inferSelect;
export type InsertClientResult = typeof clientResults.$inferInsert;

/**
 * Insights table - Stores analyst reports and research documents
 */
export const insights = mysqlTable("insights", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  pdfUrl: varchar("pdfUrl", { length: 500 }),
  featured: int("featured").default(0),
  order: int("order").default(0),
  publishedAt: timestamp("publishedAt").defaultNow(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Insight = typeof insights.$inferSelect;
export type InsertInsight = typeof insights.$inferInsert;

/**
 * Lead Inquiries table - Stores multi-step lead qualification form submissions
 */
export const leadInquiries = mysqlTable("lead_inquiries", {
  id: int("id").autoincrement().primaryKey(),
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
  status: mysqlEnum("status", ["new", "contacted", "qualified", "proposal", "closed"]).default("new"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LeadInquiry = typeof leadInquiries.$inferSelect;
export type InsertLeadInquiry = typeof leadInquiries.$inferInsert;