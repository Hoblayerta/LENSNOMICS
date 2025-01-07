import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { ethers } from "ethers";
import {
  communities,
  users,
  communityMembers,
  posts,
  comments,
  votes,
  achievements,
  userAchievements,
} from "@db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

// Import ABI
import CommunityTokenFactoryABI from "../artifacts/contracts/CommunityTokenFactory.sol/CommunityTokenFactory.json";

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);
  const PORT = process.env.PORT || 5000;

  // Initialize Ethereum provider and contract
  const provider = new ethers.JsonRpcProvider("https://rpc.testnet.lens.dev");
  const factoryAddress = process.env.FACTORY_ADDRESS;

  if (!factoryAddress) {
    console.error("Factory address not found in environment variables");
  }

  // Token Creation endpoint
  app.post("/api/communities/token", async (req, res) => {
    try {
      const { name, symbol, creatorAddress } = req.body;

      if (!factoryAddress) {
        throw new Error("Factory address not configured");
      }

      if (!process.env.DEPLOYER_PRIVATE_KEY) {
        throw new Error("Deployer private key not configured");
      }

      const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
      const factory = new ethers.Contract(factoryAddress, CommunityTokenFactoryABI.abi, wallet);

      // Create token with initial supply of 1,000,000 tokens
      const tx = await factory.createCommunityToken(name, symbol, 1000000);
      console.log("Creating token transaction:", tx.hash);

      const receipt = await tx.wait();
      console.log("Transaction receipt:", receipt);

      // Get token address from event logs
      const event = receipt.logs.find(
        (log: any) => log.topics[0] === factory.interface.getEventTopic("CommunityTokenCreated")
      );

      if (!event) {
        throw new Error("Token creation event not found in transaction logs");
      }

      const tokenAddress = event.args[0];
      console.log("Created token at address:", tokenAddress);

      res.json({
        tokenAddress,
        name,
        symbol,
      });
    } catch (error) {
      console.error("Error creating token:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to create token" });
    }
  });

  // Communities endpoints
  app.post("/api/communities", async (req, res) => {
    try {
      const { name, description, tokenName, tokenSymbol, creatorAddress } = req.body;

      // First create the token
      const tokenResponse = await fetch(`http://localhost:${PORT}/api/communities/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: tokenName,
          symbol: tokenSymbol,
          creatorAddress,
        }),
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        throw new Error(error);
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
          initialTokens: "1000", // Initial tokens for new members
        })
        .returning();

      // Add creator as first member with initial tokens
      await db.insert(communityMembers)
        .values({
          userId: user.id,
          communityId: community.id,
          tokenBalance: "10000", // Creator gets more initial tokens
        });

      res.json(community);
    } catch (error) {
      console.error("Error creating community:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to create community" });
    }
  });

  // Initialize default achievements if they don't exist
  app.post("/api/achievements/init", async (_req, res) => {
    try {
      const defaultAchievements = [
        {
          name: "First Post",
          description: "Create your first post in any community",
          criteria: { type: "post_count", threshold: 1 },
          points: 10,
          icon: "pencil",
        },
        {
          name: "Community Builder",
          description: "Create your own community",
          criteria: { type: "community_count", threshold: 1 },
          points: 50,
          icon: "users",
        },
        {
          name: "Token Collector",
          description: "Accumulate 1000 community tokens",
          criteria: { type: "token_balance", threshold: 1000 },
          points: 100,
          icon: "coins",
        },
        {
          name: "Active Contributor",
          description: "Make 10 posts or comments",
          criteria: { type: "contribution_count", threshold: 10 },
          points: 25,
          icon: "message-square",
        },
        {
          name: "Popular Creator",
          description: "Receive 50 likes on your posts",
          criteria: { type: "like_count", threshold: 50 },
          points: 75,
          icon: "heart",
        },
      ];

      for (const achievement of defaultAchievements) {
        await db.insert(achievements)
          .values(achievement)
          .onConflictDoNothing();
      }

      res.json({ message: "Achievements initialized" });
    } catch (error) {
      console.error("Error initializing achievements:", error);
      res.status(500).json({ error: "Failed to initialize achievements" });
    }
  });

  // Get user achievements and leaderboard
  app.get("/api/leaderboard", async (_req, res) => {
    try {
      const leaderboard = await db.select({
        address: users.address,
        lensHandle: users.lensHandle,
        balance: users.tokenBalance,
        achievementPoints: sql<number>`COALESCE(SUM(${achievements.points}), 0)`.as('points'),
        achievements: sql<any[]>`
          COALESCE(
            ARRAY_AGG(
              CASE WHEN ${achievements.id} IS NOT NULL
              THEN jsonb_build_object(
                'name', ${achievements.name},
                'description', ${achievements.description},
                'icon', ${achievements.icon},
                'points', ${achievements.points}
              )
              ELSE NULL END
            ) FILTER (WHERE ${achievements.id} IS NOT NULL),
            '{}'::jsonb[]
          )
        `.as('achievements'),
      })
      .from(users)
      .leftJoin(
        userAchievements,
        eq(userAchievements.userId, users.id)
      )
      .leftJoin(
        achievements,
        eq(achievements.id, userAchievements.achievementId)
      )
      .groupBy(users.id)
      .orderBy(desc(sql`points`))
      .limit(10);

      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  // Check and award achievements after certain actions
  async function checkAndAwardAchievements(userId: number) {
    try {
      // Get user stats
      const stats = await db.select({
        postCount: sql`COUNT(DISTINCT ${posts.id})`,
        commentCount: sql`COUNT(DISTINCT ${comments.id})`,
        likeCount: sql`COUNT(DISTINCT ${votes.id})`,
        communityCount: sql`COUNT(DISTINCT ${communities.id})`,
        tokenBalance: users.tokenBalance,
      })
      .from(users)
      .leftJoin(posts, eq(posts.authorId, users.id))
      .leftJoin(comments, eq(comments.authorId, users.id))
      .leftJoin(votes, eq(votes.userId, users.id))
      .leftJoin(communities, eq(communities.creatorId, users.id))
      .where(eq(users.id, userId))
      .groupBy(users.id)
      .execute();

      if (!stats.length) return;

      const userStats = stats[0];

      // Get all achievements
      const allAchievements = await db.select().from(achievements).execute();

      // Check each achievement
      for (const achievement of allAchievements) {
        const { criteria } = achievement;
        let qualified = false;

        switch (criteria.type) {
          case "post_count":
            qualified = userStats.postCount >= criteria.threshold;
            break;
          case "like_count":
            qualified = userStats.likeCount >= criteria.threshold;
            break;
          case "comment_count":
            qualified = userStats.commentCount >= criteria.threshold;
            break;
          case "token_balance":
            qualified = parseInt(userStats.tokenBalance) >= criteria.threshold;
            break;
          case "community_count":
            qualified = userStats.communityCount >= criteria.threshold;
            break;
          case "contribution_count":
            qualified = userStats.postCount + userStats.commentCount >= criteria.threshold;
            break;
        }

        if (qualified) {
          // Award achievement if not already awarded
          await db.insert(userAchievements)
            .values({
              userId,
              achievementId: achievement.id,
            })
            .onConflictDoNothing();
        }
      }
    } catch (error) {
      console.error("Error checking achievements:", error);
    }
  }

  // Posts endpoint
  app.get("/api/posts", async (_req, res) => {
    try {
      const allPosts = await db.select({
        id: posts.id,
        content: posts.content,
        createdAt: posts.createdAt,
        author: {
          id: users.id,
          address: users.address,
          lensHandle: users.lensHandle,
        },
        community: {
          id: communities.id,
          name: communities.name,
          tokenSymbol: communities.tokenSymbol,
        },
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .leftJoin(communities, eq(posts.communityId, communities.id))
      .orderBy(desc(posts.createdAt));

      res.json(allPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });

  app.post("/api/posts", async (req, res) => {
    try {
      const { content, authorId, communityId } = req.body;
      const [newPost] = await db.insert(posts)
        .values({
          content,
          authorId,
          communityId,
        })
        .returning();

      // Reward poster with tokens
      const member = await db.query.communityMembers.findFirst({
        where: and(
          eq(communityMembers.userId, authorId),
          eq(communityMembers.communityId, communityId)
        ),
      });

      if (member) {
        const newBalance = (BigInt(member.tokenBalance || "0") + BigInt("1")).toString();
        await db.update(communityMembers)
          .set({ tokenBalance: newBalance })
          .where(eq(communityMembers.id, member.id));
      }

      // Check achievements after post creation
      await checkAndAwardAchievements(authorId);

      res.json(newPost);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ error: "Failed to create post" });
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
      const [post] = await db.select().from(posts).where(eq(posts.id, parseInt(req.params.postId)));

      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      // Create comment
      const [newComment] = await db.insert(comments)
        .values({
          content,
          authorId,
          postId: parseInt(req.params.postId),
        })
        .returning();

      // Reward commenter with tokens
      const member = await db.query.communityMembers.findFirst({
        where: eq(communityMembers.userId, authorId)
      });

      if (member) {
        const newBalance = (BigInt(member.tokenBalance || "0") + BigInt("1")).toString();
        await db.update(communityMembers)
          .set({ tokenBalance: newBalance })
          .where(eq(communityMembers.id, member.id));
      }

      res.json(newComment);
    } catch (error) {
      res.status(500).json({ error: "Failed to create comment" });
    }
  });

  // Voting/Liking system
  app.post("/api/posts/:postId/vote", async (req, res) => {
    try {
      const { userId } = req.body;
      const postId = parseInt(req.params.postId);

      // Get post info
      const post = await db.query.posts.findFirst({
        where: eq(posts.id, postId),
        with: {
          author: true,
        },
      });

      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      // Handle voting
      const existingVote = await db.query.votes.findFirst({
        where: and(
          eq(votes.postId, postId),
          eq(votes.userId, userId)
        ),
      });

      if (!existingVote) {
        await db.insert(votes).values({
          postId,
          userId,
          value: 1,
        });

        // Reward post author with tokens
        const member = await db.query.communityMembers.findFirst({
          where: eq(communityMembers.userId, post.authorId)
        });

        if (member) {
          const newBalance = (BigInt(member.tokenBalance || "0") + BigInt("1")).toString();
          await db.update(communityMembers)
            .set({ tokenBalance: newBalance })
            .where(eq(communityMembers.id, member.id));
        }
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to vote" });
    }
  });

  // Communities endpoints
  app.get("/api/communities", async (_req, res) => {
    try {
      const allCommunities = await db.query.communities.findMany({
        with: {
          creator: true,
          members: true,
        },
        orderBy: [desc(communities.createdAt)],
      });

      const transformedCommunities = allCommunities.map(community => ({
        ...community,
        memberCount: community.members?.length || 0,
      }));

      res.json(transformedCommunities);
    } catch (error) {
      console.error("Error fetching communities:", error);
      res.status(500).json({ error: "Failed to fetch communities" });
    }
  });


  // Join community endpoint
  app.post("/api/communities/:communityId/join", async (req, res) => {
    try {
      const { userId } = req.body;
      const communityId = parseInt(req.params.communityId);

      const community = await db.query.communities.findFirst({
        where: eq(communities.id, communityId),
      });

      if (!community) {
        return res.status(404).json({ error: "Community not found" });
      }

      // Add member with initial tokens
      await db.insert(communityMembers)
        .values({
          userId,
          communityId,
          tokenBalance: community.initialTokens,
        })
        .onConflictDoNothing();

      res.json({ success: true });
    } catch (error) {
      console.error("Error joining community:", error);
      res.status(500).json({ error: "Failed to join community" });
    }
  });

  // Token earnings endpoint
  app.get("/api/token-earnings/:address", async (req, res) => {
    try {
      const { address } = req.params;

      // Get user
      const user = await db.query.users.findFirst({
        where: eq(users.address, address),
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get user's community memberships
      const memberships = await db.query.communityMembers.findMany({
        where: eq(communityMembers.userId, user.id),
        with: {
          community: true,
        },
      });

      // Transform the data for the dashboard
      const earnings = memberships.map(membership => ({
        communityName: membership.community.name,
        tokenSymbol: membership.community.tokenSymbol,
        balance: membership.tokenBalance || "0",
        // For now, we'll create mock history data
        // In a production app, we'd store this in a separate table
        history: Array.from({ length: 7 }, (_, i) => ({
          timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
          amount: (parseFloat(membership.tokenBalance || "0") / (i + 1)).toFixed(2),
        })).reverse(),
      }));

      res.json(earnings);
    } catch (error) {
      console.error("Error fetching token earnings:", error);
      res.status(500).json({ error: "Failed to fetch token earnings" });
    }
  });

  return httpServer;
}