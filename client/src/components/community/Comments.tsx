import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface Comment {
  id: string;
  author: {
    address: string;
    avatar?: string;
  };
  content: string;
  timestamp: string;
}

interface CommentsProps {
  postId: string;
}

export function Comments({ postId }: CommentsProps) {
  const [newComment, setNewComment] = useState("");
  const queryClient = useQueryClient();

  const { data: comments, isLoading } = useQuery({
    queryKey: [`/api/posts/${postId}/comments`],
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });
      if (!response.ok) throw new Error("Failed to create comment");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${postId}/comments`] });
      setNewComment("");
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Textarea
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="flex-1"
        />
        <Button 
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !newComment.trim()}
        >
          Comment
        </Button>
      </div>

      <ScrollArea className="h-[300px]">
        {comments?.map((comment: Comment) => (
          <div key={comment.id} className="flex gap-4 mb-4">
            <Avatar>
              <AvatarImage src={comment.author.avatar} />
              <AvatarFallback>{comment.author.address.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{`${comment.author.address.slice(0, 6)}...${comment.author.address.slice(-4)}`}</p>
              <p className="text-sm text-muted-foreground">{comment.timestamp}</p>
              <p className="mt-1">{comment.content}</p>
            </div>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
}
