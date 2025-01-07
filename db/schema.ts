import { pgTable, text, serial, integer, timestamp, uniqueIndex, boolean, jsonb } from "drizzle-orm/pg-core";
import { relations, type RelationConfig } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  address: text("address").unique().notNull(),
  lensHandle: text("lens_handle"),
  tokenBalance: text("token_balance").default("0").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  achievementPoints: integer("achievement_points").default(0).notNull(),
});

export const communities = pgTable("communities", {
  id: serial("id").primaryKey(),
  name: text("name").unique().notNull(),
  description: text("description"),
  creatorId: integer("creator_id").references(() => users.id),
  tokenAddress: text("token_address").unique().notNull(),
  tokenSymbol: text("token_symbol").notNull(),
  requiredTokens: text("required_tokens").default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const communityMembers = pgTable("community_members", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  communityId: integer("community_id").references(() => communities.id),
  tokenBalance: text("token_balance").default("0"),
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => ({
  membershipIdx: uniqueIndex('user_community_idx').on(table.userId, table.communityId),
}));

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  authorId: integer("author_id").references(() => users.id),
  communityId: integer("community_id").references(() => communities.id),
  content: text("content").notNull(),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  isTokenGated: boolean("is_token_gated").default(false),
  requiredTokenAmount: text("required_token_amount").default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => posts.id),
  authorId: integer("author_id").references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const directMessages = pgTable("direct_messages", {
  id: serial("id").primaryKey(),
  fromUserId: integer("from_user_id").references(() => users.id),
  toUserId: integer("to_user_id").references(() => users.id),
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

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  points: integer("points").notNull(),
  icon: text("icon").notNull(), // Lucide icon name
  criteria: jsonb("criteria").notNull(), // JSON object defining achievement criteria
  createdAt: timestamp("created_at").defaultNow(),
});

export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  achievementId: integer("achievement_id").references(() => achievements.id),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
}, (table) => ({
  userAchievementIdx: uniqueIndex('user_achievement_idx').on(table.userId, table.achievementId),
}));


export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  communityMemberships: many(communityMembers),
  createdCommunities: many(communities),
  achievements: many(userAchievements),
}));

export const communitiesRelations = relations(communities, ({ one, many }) => ({
  creator: one(users, { fields: [communities.creatorId], references: [users.id] }),
  members: many(communityMembers),
  posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, { fields: [posts.authorId], references: [users.id] }),
  community: one(communities, { fields: [posts.communityId], references: [communities.id] }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, { fields: [comments.postId], references: [posts.id] }),
  author: one(users, { fields: [comments.authorId], references: [users.id] }),
}));

export const achievementsRelations = relations(achievements, ({ many }) => ({
  userAchievements: many(userAchievements),
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, { fields: [userAchievements.userId], references: [users.id] }),
  achievement: one(achievements, { fields: [userAchievements.achievementId], references: [achievements.id] }),
}));

export type User = typeof users.$inferSelect;
export type Community = typeof communities.$inferSelect;
export type CommunityMember = typeof communityMembers.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type DirectMessage = typeof directMessages.$inferSelect;
export type Vote = typeof votes.$inferSelect;
export type Challenge = typeof challenges.$inferSelect;
export type UserChallenge = typeof userChallenges.$inferSelect;
export type Level = typeof levels.$inferSelect;
export type TokenTransaction = typeof tokenTransactions.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type UserAchievement = typeof userAchievements.$inferSelect;

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertCommunitySchema = createInsertSchema(communities);
export const selectCommunitySchema = createSelectSchema(communities);
export const insertPostSchema = createInsertSchema(posts);
export const selectPostSchema = createSelectSchema(posts);
export const insertChallengeSchema = createInsertSchema(challenges);
export const selectChallengeSchema = createSelectSchema(challenges);
export const insertAchievementSchema = createInsertSchema(achievements);
export const selectAchievementSchema = createSelectSchema(achievements);
export const insertUserAchievementSchema = createInsertSchema(userAchievements);
export const selectUserAchievementSchema = createSelectSchema(userAchievements);