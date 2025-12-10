import {
    PostType
} from "@/lib/types";
import {
    ApiResponse, BaseService, ServiceResult
} from "./base.service";

// ==================== Post Service Types ====================

type PostStatus = "draft" | "published" | "archived";

interface PostData {
  id: string;
  title: string;
  content: string;
  author_id: string;
  community_id: string;
  type: PostType;
  status: PostStatus;
  likes_count: number;
  comments_count: number;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

interface CreatePostInput {
  title: string;
  content: string;
  community_id: string;
  type?: PostType;
}

interface PostWithRelations extends PostData {
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

interface PostsQueryOptions {
  communityId?: string;
  authorId?: string;
  type?: PostType;
  status?: PostStatus;
  page?: number;
  pageSize?: number;
}

interface PostsResult {
  posts: PostWithRelations[];
  total: number;
}

interface UpdatePostInput {
  title?: string;
  content?: string;
  status?: PostStatus;
}

// ==================== Post Service Class ====================

/**
 * Service for managing posts and discussions
 * Handles post CRUD, likes, and community activity tracking
 */
export class PostService extends BaseService {
  private static instance: PostService;

  private constructor() {
    super();
  }

  /**
   * Get singleton instance of PostService
   */
  public static getInstance(): PostService {
    if (!PostService.instance) {
      PostService.instance = new PostService();
    }
    return PostService.instance;
  }

  /**
   * Get post by ID with author and community info
   * @param postId - The post ID to fetch
   * @returns ServiceResult containing post data or error
   */
  public async getById(postId: string): Promise<ServiceResult<PostWithRelations>> {
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
      return ApiResponse.notFound("Post");
    }

    return ApiResponse.success<PostWithRelations>(data as PostWithRelations);
  }

  /**
   * Get posts with filters and pagination
   * @param options - Query options
   * @returns ServiceResult containing paginated posts
   */
  public async getAll(
    options?: PostsQueryOptions
  ): Promise<ServiceResult<PostsResult>> {
    const page: number = options?.page || 1;
    const pageSize: number = options?.pageSize || 20;
    const from: number = (page - 1) * pageSize;
    const to: number = from + pageSize - 1;

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

    return ApiResponse.success<PostsResult>({
      posts: (data || []) as PostWithRelations[],
      total: count || 0,
    });
  }

  /**
   * Create a new post
   * @param authorId - The user creating the post
   * @param input - The post data
   * @returns ServiceResult containing created post
   */
  public async create(
    authorId: string, 
    input: CreatePostInput
  ): Promise<ServiceResult<PostData>> {
    const { data, error } = await this.supabaseAdmin
      .from("posts")
      .insert({
        title: input.title,
        content: input.content,
        community_id: input.community_id,
        author_id: authorId,
        type: input.type || "discussion",
        status: "published" as PostStatus,
        likes_count: 0,
        comments_count: 0,
      })
      .select()
      .single();

    if (error) {
      return ApiResponse.error("Failed to create post", 500);
    }

    // Update community activity timestamp
    await this.supabaseAdmin
      .from("communities")
      .update({
        last_activity_date: new Date().toISOString(),
        last_activity_type: "post",
      })
      .eq("id", input.community_id);

    return ApiResponse.created<PostData>(data as PostData);
  }

  /**
   * Update a post
   * @param postId - The post ID to update
   * @param authorId - The user making the update (must be author)
   * @param updates - The fields to update
   * @returns ServiceResult containing updated post
   */
  public async update(
    postId: string,
    authorId: string,
    updates: UpdatePostInput
  ): Promise<ServiceResult<PostData>> {
    // Verify ownership
    const { data: post } = await this.supabaseAdmin
      .from("posts")
      .select("author_id")
      .eq("id", postId)
      .single();

    if (!post || post.author_id !== authorId) {
      return ApiResponse.forbidden("Permission denied");
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

    return ApiResponse.success<PostData>(data as PostData);
  }

  /**
   * Delete a post
   * @param postId - The post ID to delete
   * @param userId - The user deleting (must be author or admin)
   * @returns ServiceResult indicating success
   */
  public async delete(
    postId: string, 
    userId: string
  ): Promise<ServiceResult<void>> {
    // Verify ownership or admin status
    const { data: post } = await this.supabaseAdmin
      .from("posts")
      .select("author_id, community_id")
      .eq("id", postId)
      .single();

    if (!post) {
      return ApiResponse.notFound("Post");
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
        return ApiResponse.forbidden("Permission denied");
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
   * @param postId - The post ID to like
   * @param userId - The user liking the post
   * @returns ServiceResult indicating success
   */
  public async like(
    postId: string, 
    userId: string
  ): Promise<ServiceResult<void>> {
    // Check if already liked
    const { data: existingLike } = await this.supabaseAdmin
      .from("post_likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existingLike) {
      return ApiResponse.badRequest("Already liked");
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

    return ApiResponse.success<void>(undefined);
  }

  /**
   * Unlike a post
   * @param postId - The post ID to unlike
   * @param userId - The user unliking the post
   * @returns ServiceResult indicating success
   */
  public async unlike(
    postId: string, 
    userId: string
  ): Promise<ServiceResult<void>> {
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

    return ApiResponse.success<void>(undefined);
  }
}

// Export singleton instance
export const postService: PostService = PostService.getInstance();
