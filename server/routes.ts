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
} from "@db/schema";
import { eq, desc, and } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);

  // Token Creation endpoint
  app.post("/api/communities/token", async (req, res) => {
    try {
      const { name, symbol, creatorAddress } = req.body;

      // Generate a deterministic token address based on community name and creator
      const tokenAddress = `0x${Buffer.from(`${name}${creatorAddress}${Date.now()}`).toString('hex').slice(0, 40)}`;

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
      res.status(500).json({ error: "Failed to create community" });
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
        with: {
          communityMemberships: {
            with: {
              community: true,
            },
          },
        },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Transform the data for the dashboard
      const earnings = user.communityMemberships.map(membership => ({
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