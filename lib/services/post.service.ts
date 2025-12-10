import {
  BaseService,
  ApiResponse,
  ServiceResult,
} from "./base.service";

interface PostData {
  id: string;
  title: string;
  content: string;
  author_id: string;
  community_id: string;
  type: "discussion" | "announcement" | "question" | "poll";
  status: "draft" | "published" | "archived";
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
}

interface CreatePostInput {
  title: string;
  content: string;
  community_id: string;
  type?: PostData["type"];
}

interface PostWithAuthor extends PostData {
  author?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  community?: {
    id: string;
    name: string;
  };
}

/**
 * Service for managing posts and discussions
 */
export class PostService extends BaseService {
  private static instance: PostService;

  private constructor() {
    super();
  }

  static getInstance(): PostService {
    if (!PostService.instance) {
      PostService.instance = new PostService();
    }
    return PostService.instance;
  }

  /**
   * Get post by ID
   */
  async getById(postId: string): Promise<ServiceResult<PostWithAuthor>> {
    const { data, error } = await this.supabaseAdmin
      .from("posts")
      .select(`
        *,
        author:author_id (id, full_name, avatar_url),
        community:community_id (id, name)
      `)
      .eq("id", postId)
      .single();

    if (error || !data) {
      return ApiResponse.error("Post not found", 404);
    }

    return ApiResponse.success(data);
  }

  /**
   * Get posts with filters
   */
  async getAll(options?: {
    communityId?: string;
    authorId?: string;
    type?: PostData["type"];
    status?: PostData["status"];
    page?: number;
    pageSize?: number;
  }): Promise<ServiceResult<{ posts: PostWithAuthor[]; total: number }>> {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = this.supabaseAdmin
      .from("posts")
      .select(`
        *,
        author:author_id (id, full_name, avatar_url),
        community:community_id (id, name)
      `, { count: "exact" })
      .order("created_at", { ascending: false });

    if (options?.communityId) {
      query = query.eq("community_id", options.communityId);
    }

    if (options?.authorId) {
      query = query.eq("author_id", options.authorId);
    }

    if (options?.type) {
      query = query.eq("type", options.type);
    }

    if (options?.status) {
      query = query.eq("status", options.status);
    } else {
      query = query.eq("status", "published");
    }

    const { data, count, error } = await query.range(from, to);

    if (error) {
      return ApiResponse.error("Failed to fetch posts", 500);
    }

    return ApiResponse.success({
      posts: data || [],
      total: count || 0,
    });
  }

  /**
   * Create a new post
   */
  async create(authorId: string, input: CreatePostInput): Promise<ServiceResult<PostData>> {
    const { data, error } = await this.supabaseAdmin
      .from("posts")
      .insert({
        title: input.title,
        content: input.content,
        community_id: input.community_id,
        author_id: authorId,
        type: input.type || "discussion",
        status: "published",
        likes_count: 0,
        comments_count: 0,
      })
      .select()
      .single();

    if (error) {
      return ApiResponse.error("Failed to create post", 500);
    }

    // Update community activity
    await this.supabaseAdmin
      .from("communities")
      .update({
        last_activity_date: new Date().toISOString(),
        last_activity_type: "post",
      })
      .eq("id", input.community_id);

    return ApiResponse.created(data);
  }

  /**
   * Update a post
   */
  async update(
    postId: string,
    authorId: string,
    updates: Partial<Pick<PostData, "title" | "content" | "status">>
  ): Promise<ServiceResult<PostData>> {
    // Verify ownership
    const { data: post } = await this.supabaseAdmin
      .from("posts")
      .select("author_id")
      .eq("id", postId)
      .single();

    if (!post || post.author_id !== authorId) {
      return ApiResponse.error("Permission denied", 403);
    }

    const { data, error } = await this.supabaseAdmin
      .from("posts")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId)
      .select()
      .single();

    if (error) {
      return ApiResponse.error("Failed to update post", 500);
    }

    return ApiResponse.success(data);
  }

  /**
   * Delete a post
   */
  async delete(postId: string, userId: string): Promise<ServiceResult<void>> {
    // Verify ownership or admin status
    const { data: post } = await this.supabaseAdmin
      .from("posts")
      .select("author_id, community_id")
      .eq("id", postId)
      .single();

    if (!post) {
      return ApiResponse.error("Post not found", 404);
    }

    // Check if user is author or community admin
    if (post.author_id !== userId) {
      const { data: membership } = await this.supabaseAdmin
        .from("community_members")
        .select("role")
        .eq("community_id", post.community_id)
        .eq("user_id", userId)
        .single();

      if (membership?.role !== "admin") {
        return ApiResponse.error("Permission denied", 403);
      }
    }

    const { error } = await this.supabaseAdmin
      .from("posts")
      .delete()
      .eq("id", postId);

    if (error) {
      return ApiResponse.error("Failed to delete post", 500);
    }

    return ApiResponse.noContent();
  }

  /**
   * Like a post
   */
  async like(postId: string, userId: string): Promise<ServiceResult<void>> {
    // Check if already liked
    const { data: existingLike } = await this.supabaseAdmin
      .from("post_likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existingLike) {
      return ApiResponse.error("Already liked", 400);
    }

    // Create like
    const { error: likeError } = await this.supabaseAdmin
      .from("post_likes")
      .insert({ post_id: postId, user_id: userId });

    if (likeError) {
      return ApiResponse.error("Failed to like post", 500);
    }

    // Increment count
    await this.supabaseAdmin.rpc("increment_post_likes", { post_id: postId });

    return ApiResponse.success(undefined);
  }

  /**
   * Unlike a post
   */
  async unlike(postId: string, userId: string): Promise<ServiceResult<void>> {
    const { error } = await this.supabaseAdmin
      .from("post_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);

    if (error) {
      return ApiResponse.error("Failed to unlike post", 500);
    }

    // Decrement count
    await this.supabaseAdmin.rpc("decrement_post_likes", { post_id: postId });

    return ApiResponse.success(undefined);
  }
}

export const postService = PostService.getInstance();

