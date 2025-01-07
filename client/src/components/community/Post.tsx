import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { useState } from "react";

interface PostProps {
  id: string;
  author: {
    address: string;
    avatar?: string;
  };
  content: string;
  likes: number;
  comments: number;
  timestamp: string;
}

export function Post({ id, author, content, likes, comments, timestamp }: PostProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
  };

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar>
          <AvatarImage src={author.avatar} />
          <AvatarFallback>{author.address.slice(0, 2)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{`${author.address.slice(0, 6)}...${author.address.slice(-4)}`}</p>
          <p className="text-sm text-muted-foreground">{timestamp}</p>
        </div>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap">{content}</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleLike}
          className={liked ? "text-red-500" : ""}
        >
          <Heart className="h-4 w-4 mr-2" />
          {likeCount}
        </Button>
        <Button variant="ghost" size="sm">
          <MessageCircle className="h-4 w-4 mr-2" />
          {comments}
        </Button>
        <Button variant="ghost" size="sm">
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </CardFooter>
    </Card>
  );
}
