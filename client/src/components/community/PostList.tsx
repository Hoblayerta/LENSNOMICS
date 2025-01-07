import { useQuery } from "@tanstack/react-query";
import { Post } from "./Post";
import { Skeleton } from "@/components/ui/skeleton";

export function PostList() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["/api/posts"],
  });

  if (isLoading) {
    return Array(3).fill(0).map((_, i) => (
      <div key={i} className="mb-4">
        <Skeleton className="h-[200px] w-full rounded-lg" />
      </div>
    ));
  }

  return (
    <div className="space-y-4">
      {posts.map((post: any) => (
        <Post key={post.id} {...post} />
      ))}
    </div>
  );
}
