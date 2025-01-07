import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPost } from "@/lib/lens";

export function CreatePost() {
  const [content, setContent] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error("Failed to create post");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setContent("");
    },
  });

  const handleSubmit = () => {
    if (content.trim()) {
      mutation.mutate();
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <Textarea
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[100px] resize-none"
        />
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          onClick={handleSubmit}
          disabled={mutation.isPending || !content.trim()}
          className="bg-gradient-to-r from-purple-500 to-blue-500"
        >
          {mutation.isPending ? "Posting..." : "Post"}
        </Button>
      </CardFooter>
    </Card>
  );
}
