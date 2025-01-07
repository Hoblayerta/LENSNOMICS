import { pgTable, text, serial, integer, timestamp, uniqueIndex, boolean, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  address: text("address").unique().notNull(),
  lensHandle: text("lens_handle"),
  tokenBalance: text("token_balance").default("0").notNull(),
  achievementPoints: integer("achievement_points").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const communities = pgTable("communities", {
  id: serial("id").primaryKey(),
  name: text("name").unique().notNull(),
  description: text("description").notNull(),
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
  curationScore: integer("curation_score").default(0),
  createdAt: timestamp("created_at").defaultNow(),
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
  value: integer("value").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  postUserIdx: uniqueIndex('post_user_vote_idx').on(table.postId, table.userId),
}));

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: text("name").unique().notNull(),
  description: text("description").notNull(),
  points: integer("points").notNull(),
  icon: text("icon").notNull(),
  criteria: jsonb("criteria").notNull(),
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

// Define relationships
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

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, { fields: [posts.authorId], references: [users.id] }),
  community: one(communities, { fields: [posts.communityId], references: [communities.id] }),
  votes: many(votes),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  author: one(users, { fields: [comments.authorId], references: [users.id] }),
  post: one(posts, { fields: [comments.postId], references: [posts.id] }),
}));

export const votesRelations = relations(votes, ({ one }) => ({
  user: one(users, { fields: [votes.userId], references: [users.id] }),
  post: one(posts, { fields: [votes.postId], references: [posts.id] }),
}));

export const achievementsRelations = relations(achievements, ({ many }) => ({
  userAchievements: many(userAchievements),
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, { fields: [userAchievements.userId], references: [users.id] }),
  achievement: one(achievements, { fields: [userAchievements.achievementId], references: [achievements.id] }),
}));

// Export types and schemas
export type User = typeof users.$inferSelect;
export type Community = typeof communities.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Vote = typeof votes.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type UserAchievement = typeof userAchievements.$inferSelect;

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertCommunitySchema = createInsertSchema(communities);
export const selectCommunitySchema = createSelectSchema(communities);
export const insertPostSchema = createInsertSchema(posts);
export const selectPostSchema = createSelectSchema(posts);
export const insertAchievementSchema = createInsertSchema(achievements);
export const selectAchievementSchema = createSelectSchema(achievements);