import { pgTable, text, serial, integer, timestamp, uniqueIndex, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  address: text("address").unique().notNull(),
  lensHandle: text("lens_handle"),
  tokenBalance: text("token_balance").default("0"),
  level: integer("level").default(1),
  totalCurationScore: integer("total_curation_score").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  authorId: integer("author_id").references(() => users.id),
  content: text("content").notNull(),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  curationScore: integer("curation_score").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  isTokenGated: boolean("is_token_gated").default(false),
  requiredTokenAmount: text("required_token_amount").default("0"),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => posts.id),
  authorId: integer("author_id").references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => posts.id),
  userId: integer("user_id").references(() => users.id),
  value: integer("value").notNull(), // positive for upvote, negative for downvote
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  postUserIdx: uniqueIndex('post_user_vote_idx').on(table.postId, table.userId),
}));

export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  requiredActions: text("required_actions").notNull(),
  tokenReward: text("token_reward").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").default(true),
});

export const userChallenges = pgTable("user_challenges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  challengeId: integer("challenge_id").references(() => challenges.id),
  progress: integer("progress").default(0),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
}, (table) => ({
  userChallengeIdx: uniqueIndex('user_challenge_idx').on(table.userId, table.challengeId),
}));

export const levels = pgTable("levels", {
  id: serial("id").primaryKey(),
  level: integer("level").unique().notNull(),
  requiredTokens: text("required_tokens").notNull(),
  title: text("title").notNull(),
  benefits: text("benefits").notNull(),
});

export const tokenTransactions = pgTable("token_transactions", {
  id: serial("id").primaryKey(),
  fromAddress: text("from_address").notNull(),
  toAddress: text("to_address").notNull(),
  amount: text("amount").notNull(),
  type: text("type").notNull(), // 'reward', 'transfer', 'challenge_completion'
  txHash: text("tx_hash").unique().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Export types
export type User = typeof users.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Vote = typeof votes.$inferSelect;
export type Challenge = typeof challenges.$inferSelect;
export type UserChallenge = typeof userChallenges.$inferSelect;
export type Level = typeof levels.$inferSelect;
export type TokenTransaction = typeof tokenTransactions.$inferSelect;

// Export schemas
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertChallengeSchema = createInsertSchema(challenges);
export const selectChallengeSchema = createSelectSchema(challenges);