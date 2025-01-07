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

// Import ABI for LENI token
const LENI_TOKEN_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function payPostFee(address poster) external returns (bool)",
];

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);
  const PORT = process.env.PORT || 5000;

  // Initialize Ethereum provider and LENI token contract
  const provider = new ethers.JsonRpcProvider("https://rpc.testnet.lens.dev");
  const LENI_TOKEN_ADDRESS = "0xC94E29B30D5A33556C26e8188B3ce3c6d1003F86";
  const POST_FEE = ethers.parseEther("1"); // 1 LENI token per post

  // Initialize contract with the deployer's private key for transactions
  const signer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY || "", provider);
  const leniToken = new ethers.Contract(LENI_TOKEN_ADDRESS, LENI_TOKEN_ABI, signer);

  console.log('Initializing routes with LENI token address:', LENI_TOKEN_ADDRESS);

  // Posts endpoint with LENI token integration
  app.post("/api/posts", async (req, res) => {
    try {
      const { content, authorId, communityId } = req.body;

      // Verify user has enough LENI tokens
      const user = await db.query.users.findFirst({
        where: eq(users.id, authorId),
      });

      if (!user?.address) {
        return res.status(400).json({ error: "User address not found" });
      }

      try {
        // Check user's LENI balance
        const balance = await leniToken.balanceOf(user.address);

        if (balance < POST_FEE) {
          return res.status(400).json({
            error: `Insufficient LENI tokens. You need at least ${ethers.formatEther(POST_FEE)} LENI tokens to create a post.`
          });
        }

        // Execute the post fee payment
        const tx = await leniToken.payPostFee(user.address);
        await tx.wait(); // Wait for transaction confirmation

        console.log(`Post fee paid by ${user.address}. Transaction hash: ${tx.hash}`);
      } catch (error) {
        console.error("Error processing LENI token transaction:", error);
        return res.status(500).json({ error: "Failed to process token transaction" });
      }

      // Create the post after successful token transfer
      const [newPost] = await db.insert(posts)
        .values({
          content,
          authorId,
          communityId,
        })
        .returning();

      // Update user's token balance in the database
      const member = await db.query.communityMembers.findFirst({
        where: and(
          eq(communityMembers.userId, authorId),
          eq(communityMembers.communityId, communityId)
        ),
      });

      if (member) {
        // Get updated balance from blockchain
        const newBalance = await leniToken.balanceOf(user.address);
        await db.update(communityMembers)
          .set({ tokenBalance: newBalance.toString() })
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
      // Get user
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user) return;

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

          // Award XP and check for level up
          const newXp = user.xp + achievement.xpReward;
          const xpForNextLevel = user.level * 1000;
          let newLevel = user.level;

          // Level up if enough XP
          if (newXp >= xpForNextLevel) {
            newLevel++;
            // Award level up bonus (100 LENI tokens)
            const newTokenBalance = (BigInt(user.tokenBalance) + BigInt("100")).toString();
            await db.update(users)
              .set({ tokenBalance: newTokenBalance })
              .where(eq(users.id, userId));
          }

          // Update user XP and level
          await db.update(users)
            .set({
              xp: newXp,
              level: newLevel,
            })
            .where(eq(users.id, userId));

          // If achievement has token reward, award it
          if (achievement.tokenReward !== "0") {
            const newTokenBalance = (BigInt(user.tokenBalance) + BigInt(achievement.tokenReward)).toString();
            await db.update(users)
              .set({ tokenBalance: newTokenBalance })
              .where(eq(users.id, userId));
          }
        }
      }
    } catch (error) {
      console.error("Error checking achievements:", error);
    }
  }

  // Token Creation endpoint - Using existing factory
  app.post("/api/communities/token", async (req, res) => {
    try {
      const { name, symbol } = req.body;

      // Connect to existing factory contract
      const factory = new ethers.Contract(LENI_TOKEN_ADDRESS, LENI_TOKEN_ABI, provider);

      // For demo purposes, we'll simulate token creation success
      // In production, you would interact with the actual contract
      const mockTokenAddress = "0x" + Array(40).fill("0").join("");

      console.log('Simulating token creation for:', { name, symbol });

      res.json({
        tokenAddress: mockTokenAddress,
        name,
        symbol,
      });
    } catch (error) {
      console.error("Error creating token:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to create token" });
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

  // Get user progression
  app.get("/api/user/progress/:address", async (req, res) => {
    try {
      const { address } = req.params;

      // Get user
      const user = await db.query.users.findFirst({
        where: eq(users.address, address),
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Calculate XP needed for next level (increases by 1000 per level)
      const nextLevelXp = user.level * 1000;

      // Get user achievements
      const achievements = await db.select({
        id: userAchievements.id,
        achievement: {
          id: achievements.id,
          name: achievements.name,
          description: achievements.description,
          category: achievements.category,
          points: achievements.points,
          xpReward: achievements.xpReward,
          tokenReward: achievements.tokenReward,
          icon: achievements.icon,
        },
        isCompleted: sql<boolean>`true`.as("isCompleted"),
      })
        .from(achievements)
        .leftJoin(
          userAchievements,
          and(
            eq(userAchievements.achievementId, achievements.id),
            eq(userAchievements.userId, user.id)
          )
        )
        .where(eq(achievements.category, "onboarding"))
        .orderBy(achievements.order);

      // Get achievement counts
      const [counts] = await db.select({
        total: sql<number>`count(*)`,
        completed: sql<number>`count(${userAchievements.id})`,
      })
        .from(achievements)
        .leftJoin(
          userAchievements,
          and(
            eq(userAchievements.achievementId, achievements.id),
            eq(userAchievements.userId, user.id)
          )
        )
        .where(eq(achievements.category, "onboarding"))
        .execute();

      res.json({
        level: user.level,
        xp: user.xp,
        nextLevelXp,
        achievements,
        totalAchievements: counts?.total || 0,
        completedAchievements: counts?.completed || 0,
      });
    } catch (error) {
      console.error("Error fetching user progress:", error);
      res.status(500).json({ error: "Failed to fetch user progress" });
    }
  });

  // Initialize default onboarding achievements
  app.post("/api/achievements/init", async (_req, res) => {
    try {
      const onboardingAchievements = [
        {
          name: "Web3 Newcomer",
          description: "Connect your wallet for the first time",
          category: "onboarding",
          criteria: { type: "web3_interaction", threshold: 1 },
          points: 10,
          xpReward: 100,
          tokenReward: "10",
          icon: "wallet",
          order: 1,
        },
        {
          name: "Token Pioneer",
          description: "Mint your first LENI tokens",
          category: "onboarding",
          criteria: { type: "first_mint", threshold: 1 },
          points: 20,
          xpReward: 200,
          tokenReward: "20",
          icon: "coins",
          order: 2,
        },
        {
          name: "Community Member",
          description: "Join your first community",
          category: "onboarding",
          criteria: { type: "community_engagement", threshold: 1 },
          points: 30,
          xpReward: 300,
          tokenReward: "30",
          icon: "users",
          order: 3,
        },
        {
          name: "Social Butterfly",
          description: "Create your first post",
          category: "onboarding",
          criteria: { type: "post_count", threshold: 1 },
          points: 40,
          xpReward: 400,
          tokenReward: "40",
          icon: "message-square",
          order: 4,
        },
        {
          name: "Token Trader",
          description: "Make your first token transfer",
          category: "onboarding",
          criteria: { type: "token_transfer", threshold: 1 },
          points: 50,
          xpReward: 500,
          tokenReward: "50",
          icon: "arrow-right-left",
          order: 5,
        },
      ];

      for (const achievement of onboardingAchievements) {
        await db.insert(achievements)
          .values(achievement)
          .onConflictDoNothing();
      }

      res.json({ message: "Onboarding achievements initialized" });
    } catch (error) {
      console.error("Error initializing achievements:", error);
      res.status(500).json({ error: "Failed to initialize achievements" });
    }
  });

  return httpServer;
}