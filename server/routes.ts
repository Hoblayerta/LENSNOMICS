import type { Express } from "express";
import { createServer } from "http";
import { db } from "@db";
import { communities, users, communityMembers } from "@db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { posts, comments, votes, challenges, userChallenges, levels, tokenTransactions } from "@db/schema";

export function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  // Auth and User Management
  app.post("/api/users", async (req, res) => {
    try {
      const { address, lensHandle } = req.body;
      const newUser = await db.insert(users).values({
        address,
        lensHandle,
      }).returning();
      res.json(newUser[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Posts endpoint
  app.get("/api/posts", async (req, res) => {
    try {
      const allPosts = await db.query.posts.findMany({
        with: {
          author: true,
          community: true,
        },
        orderBy: [desc(posts.createdAt)],
      });

      res.json(allPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });

  app.post("/api/posts", async (req, res) => {
    try {
      const { content, authorId, isTokenGated, requiredTokenAmount, communityId } = req.body;
      const newPost = await db.insert(posts).values({
        content,
        authorId,
        isTokenGated: isTokenGated || false,
        requiredTokenAmount: requiredTokenAmount || "0",
        communityId
      }).returning();
      res.json(newPost[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to create post" });
    }
  });

  // Content Curation System
  app.post("/api/posts/:postId/vote", async (req, res) => {
    try {
      const { userId, value } = req.body;
      const postId = parseInt(req.params.postId);

      // Check if user has enough tokens to vote
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user || BigInt(user.tokenBalance) < BigInt("1")) {
        return res.status(403).json({ error: "Insufficient tokens to vote" });
      }

      // Handle voting
      const existingVote = await db.query.votes.findFirst({
        where: and(
          eq(votes.postId, postId),
          eq(votes.userId, userId)
        ),
      });

      if (existingVote) {
        await db.update(votes)
          .set({ value })
          .where(eq(votes.id, existingVote.id));
      } else {
        await db.insert(votes).values({
          postId,
          userId,
          value,
        });
      }

      // Update post curation score and reward author
      const votesSum = await db.select({
        total: sql<number>`sum(${votes.value})`,
      })
      .from(votes)
      .where(eq(votes.postId, postId));

      const post = await db.query.posts.findFirst({
        where: eq(posts.id, postId),
        with: { author: true },
      });

      if (post?.author) {
        const newBalance = (BigInt(post.author.tokenBalance) + BigInt("1")).toString();
        await db.update(users)
          .set({ tokenBalance: newBalance })
          .where(eq(users.id, post.author.id));

        // Record token transaction
        await db.insert(tokenTransactions).values({
          fromAddress: "0x0", // System reward
          toAddress: post.author.address,
          amount: "1",
          type: "reward",
          txHash: `reward_${Date.now()}`, // Placeholder for demo
        });
      }

      await db.update(posts)
        .set({ curationScore: votesSum[0].total || 0 })
        .where(eq(posts.id, postId));

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to vote" });
    }
  });

  // Comments
  app.get("/api/posts/:postId/comments", async (req, res) => {
    try {
      const postComments = await db.query.comments.findMany({
        where: eq(comments.postId, parseInt(req.params.postId)),
        orderBy: [desc(comments.createdAt)],
        with: {
          author: true,
        },
      });
      res.json(postComments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  app.post("/api/posts/:postId/comments", async (req, res) => {
    try {
      const { content, authorId } = req.body;
      const newComment = await db.insert(comments).values({
        content,
        authorId,
        postId: parseInt(req.params.postId),
      }).returning();
      res.json(newComment[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to create comment" });
    }
  });

  // Challenges System
  app.get("/api/challenges", async (req, res) => {
    try {
      const activeChallenges = await db.query.challenges.findMany({
        where: eq(challenges.isActive, true),
        orderBy: [desc(challenges.endDate)],
      });
      res.json(activeChallenges);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch challenges" });
    }
  });

  app.post("/api/challenges/:challengeId/progress", async (req, res) => {
    try {
      const { userId, progress } = req.body;
      const challengeId = parseInt(req.params.challengeId);

      const challenge = await db.query.challenges.findFirst({
        where: eq(challenges.id, challengeId),
      });

      if (!challenge) {
        return res.status(404).json({ error: "Challenge not found" });
      }

      const userChallenge = await db.query.userChallenges.findFirst({
        where: and(
          eq(userChallenges.userId, userId),
          eq(userChallenges.challengeId, challengeId)
        ),
      });

      if (userChallenge) {
        if (!userChallenge.completed && progress >= 100) {
          // Award tokens for challenge completion
          const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
          });

          if (user) {
            const newBalance = (BigInt(user.tokenBalance) + BigInt(challenge.tokenReward)).toString();
            await db.update(users)
              .set({ tokenBalance: newBalance })
              .where(eq(users.id, userId));

            // Record token transaction
            await db.insert(tokenTransactions).values({
              fromAddress: "0x0", // System reward
              toAddress: user.address,
              amount: challenge.tokenReward,
              type: "challenge_completion",
              txHash: `challenge_${Date.now()}`, // Placeholder for demo
            });
          }
        }

        await db.update(userChallenges)
          .set({ 
            progress,
            completed: progress >= 100,
            completedAt: progress >= 100 ? new Date() : null,
          })
          .where(eq(userChallenges.id, userChallenge.id));
      } else {
        await db.insert(userChallenges).values({
          userId,
          challengeId,
          progress,
          completed: progress >= 100,
          completedAt: progress >= 100 ? new Date() : null,
        });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update challenge progress" });
    }
  });

  // Leaderboard endpoint
  app.get("/api/leaderboard", async (_req, res) => {
    try {
      const leaderboard = await db.query.users.findMany({
        orderBy: [desc(users.tokenBalance)],
        limit: 10,
      });

      const rankedLeaderboard = leaderboard.map((user, index) => ({
        ...user,
        rank: index + 1,
      }));

      res.json(rankedLeaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  // Communities endpoints
  app.get("/api/communities", async (_req, res) => {
    try {
      const allCommunities = await db.query.communities.findMany({
        with: {
          creator: true,
        },
        orderBy: [desc(communities.createdAt)],
      });

      // Get member count for each community
      const communitiesWithMemberCount = await Promise.all(
        allCommunities.map(async (community) => {
          const memberCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(communityMembers)
            .where(eq(communityMembers.communityId, community.id));

          return {
            ...community,
            memberCount: memberCount[0].count,
          };
        })
      );

      res.json(communitiesWithMemberCount);
    } catch (error) {
      console.error("Error fetching communities:", error);
      res.status(500).json({ error: "Failed to fetch communities" });
    }
  });

  app.post("/api/communities", async (req, res) => {
    try {
      const { name, description, tokenSymbol, requiredTokens, creatorAddress } = req.body;

      // Get or create user
      let user = await db.query.users.findFirst({
        where: eq(users.address, creatorAddress),
      });

      if (!user) {
        const [newUser] = await db.insert(users)
          .values({ address: creatorAddress })
          .returning();
        user = newUser;
      }

      // Create community with generated token address
      const tokenAddress = `0x${Math.random().toString(16).slice(2)}`;
      const [community] = await db.insert(communities)
        .values({
          name,
          description,
          creatorId: user.id,
          tokenAddress,
          tokenSymbol,
          requiredTokens,
        })
        .returning();

      // Add creator as first member
      await db.insert(communityMembers)
        .values({
          userId: user.id,
          communityId: community.id,
          tokenBalance: "1000", // Initial token allocation for creator
        });

      res.json(community);
    } catch (error) {
      console.error("Error creating community:", error);
      res.status(500).json({ error: "Failed to create community" });
    }
  });

  return httpServer;
}