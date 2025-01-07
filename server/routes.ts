import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { 
  communities, 
  users, 
  communityMembers, 
  posts,
  comments,
  votes,
  challenges,
  userChallenges,
  tokenTransactions
} from "@db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { lensClient } from "@/lib/config";

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);

  // Token Creation endpoint
  app.post("/api/communities/token", async (req, res) => {
    try {
      const { name, symbol, creatorAddress } = req.body;

      // Generate a deterministic token address based on community name and creator
      const tokenAddress = `0x${Buffer.from(`${name}${creatorAddress}${Date.now()}`).toString('hex').slice(0, 40)}`;

      // In a production environment, this would interact with the actual blockchain
      // For now, we'll simulate token creation with a mock address
      res.json({
        tokenAddress,
        name,
        symbol,
      });
    } catch (error) {
      console.error("Error creating token:", error);
      res.status(500).json({ error: "Failed to create token" });
    }
  });

  // Auth and User Management
  app.post("/api/users", async (req, res) => {
    try {
      const { address, lensHandle } = req.body;
      const [newUser] = await db.insert(users).values({
        address,
        lensHandle,
      }).returning();
      res.json(newUser);
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
        with: {
          achievements: {
            with: {
              achievement: true,
            },
          },
        },
        orderBy: [desc(users.achievementPoints)],
        limit: 10,
      });

      const rankedLeaderboard = leaderboard.map((user, index) => ({
        address: user.address,
        lensHandle: user.lensHandle,
        balance: user.tokenBalance,
        achievementPoints: user.achievementPoints,
        rank: index + 1,
        achievements: user.achievements.map(ua => ({
          name: ua.achievement.name,
          description: ua.achievement.description,
          icon: ua.achievement.icon,
          points: ua.achievement.points,
        })),
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
      const { name, description, tokenName, tokenSymbol, creatorAddress } = req.body;

      // First create the token
      const tokenResponse = await fetch(`http://localhost:${process.env.PORT}/api/communities/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: tokenName,
          symbol: tokenSymbol,
          creatorAddress,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error("Failed to create token");
      }

      const { tokenAddress } = await tokenResponse.json();

      // Get or create user
      let user = await db.query.users.findFirst({
        where: eq(users.address, creatorAddress),
      });

      if (!user) {
        const [newUser] = await db.insert(users)
          .values({ 
            address: creatorAddress,
            tokenBalance: "0"
          })
          .returning();
        user = newUser;
      }

      // Create community with the token address
      const [community] = await db.insert(communities)
        .values({
          name,
          description,
          creatorId: user.id,
          tokenAddress,
          tokenSymbol,
          requiredTokens: "0"
        })
        .returning();

      // Add creator as first member
      await db.insert(communityMembers)
        .values({
          userId: user.id,
          communityId: community.id,
          tokenBalance: "1000000", // Initial token allocation for creator
        });

      // Record token transaction
      await db.insert(tokenTransactions)
        .values({
          fromAddress: "0x0", // System mint
          toAddress: creatorAddress,
          amount: "1000000",
          type: "mint",
          txHash: `mint_${Date.now()}`, // Placeholder for demo
        });

      res.json(community);
    } catch (error) {
      console.error("Error creating community:", error);
      res.status(500).json({ error: "Failed to create community" });
    }
  });

  return httpServer;
}