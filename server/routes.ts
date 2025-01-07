import type { Express } from "express";
import { createServer } from "http";
import { db } from "@db";
import { posts, comments, users, likes } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  // Posts
  app.get("/api/posts", async (req, res) => {
    try {
      const allPosts = await db.query.posts.findMany({
        orderBy: [desc(posts.createdAt)],
        with: {
          author: true,
        },
      });
      res.json(allPosts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });

  app.post("/api/posts", async (req, res) => {
    try {
      const { content, authorId } = req.body;
      const newPost = await db.insert(posts).values({
        content,
        authorId,
      }).returning();
      res.json(newPost[0]);
    } catch (error) {
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

  // Leaderboard
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const leaderboard = await db.query.users.findMany({
        orderBy: [desc(users.tokenBalance)],
        limit: 10,
      });
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  return httpServer;
}
