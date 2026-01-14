import { ApiResponse, BaseService, ServiceResult } from "./base.service";

// ==================== Message Service Types ====================

interface MessageData {
  id: string;
  content: string;
  sender_id: string;
  community_id: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string | null;
}

interface CreateThreadInput {
  content: string;
  community_id: string;
  media_type?: string;
  media_url?: string;
  media_size?: number;
  media_mime_type?: string;
}

interface CreateReplyInput {
  content: string;
  community_id: string;
  parent_id: string;
}

interface MessageWithSender extends MessageData {
  users?: {
    id: string;
    username?: string;
    full_name: string;
    avatar_url?: string;
  };
  authorRole?: string | null;
  isCreator?: boolean;
}

// ==================== Message Service Class ====================

/**
 * Service for managing community messages (threads and replies)
 * Handles discussion forum operations
 */
export class MessageService extends BaseService {
  private static instance: MessageService;

  private constructor() {
    super();
  }

  /**
   * Get singleton instance of MessageService
   */
  public static getInstance(): MessageService {
    if (!MessageService.instance) {
      MessageService.instance = new MessageService();
    }
    return MessageService.instance;
  }

  /**
   * Create a new thread (top-level message)
   * @param userId - The user creating the thread
   * @param input - The thread data
   * @returns ServiceResult containing created message
   */
  public async createThread(
    userId: string,
    input: CreateThreadInput
  ): Promise<ServiceResult<MessageData>> {
    // Verify user is a member of the community
    const { data: membership } = await this.supabaseAdmin
      .from("community_members")
      .select("id")
      .eq("community_id", input.community_id)
      .eq("user_id", userId)
      .eq("status", "approved")
      .single();

    if (!membership) {
      return ApiResponse.forbidden("You must be a member to post in this community");
    }

    // Create thread
    const { data, error } = await this.supabaseAdmin
      .from("messages")
      .insert({
        content: input.content,
        community_id: input.community_id,
        sender_id: userId,
        parent_id: null,
        media_type: input.media_type,
        media_url: input.media_url,
        media_size: input.media_size,
        media_mime_type: input.media_mime_type,
      })
      .select()
      .single();

    if (error) {
      console.error("[MessageService] Create thread error:", error);
      return ApiResponse.error("Failed to create thread", 500);
    }

    return ApiResponse.created<MessageData>(data as MessageData);
  }

  /**
   * Create a reply to an existing message
   * @param userId - The user creating the reply
   * @param input - The reply data
   * @returns ServiceResult containing created message
   */
  public async createReply(
    userId: string,
    input: CreateReplyInput
  ): Promise<ServiceResult<MessageData>> {
    // Verify user is a member of the community
    const { data: membership } = await this.supabaseAdmin
      .from("community_members")
      .select("id")
      .eq("community_id", input.community_id)
      .eq("user_id", userId)
      .eq("status", "approved")
      .single();

    if (!membership) {
      return ApiResponse.forbidden("You must be a member to reply in this community");
    }

    // Verify parent message exists
    const { data: parentMessage } = await this.supabaseAdmin
      .from("messages")
      .select("id")
      .eq("id", input.parent_id)
      .single();

    if (!parentMessage) {
      return ApiResponse.notFound("Parent message");
    }

    // Create reply
    const { data, error } = await this.supabaseAdmin
      .from("messages")
      .insert({
        content: input.content,
        community_id: input.community_id,
        sender_id: userId,
        parent_id: input.parent_id,
      })
      .select()
      .single();

    if (error) {
      console.error("[MessageService] Create reply error:", error);
      return ApiResponse.error("Failed to create reply", 500);
    }

    return ApiResponse.created<MessageData>(data as MessageData);
  }

  /**
   * Get threads for a community
   * @param communityId - The community ID
   * @returns ServiceResult containing array of threads with user data
   */
  public async getThreads(
    communityId: string
  ): Promise<ServiceResult<MessageWithSender[]>> {
    // Get threads
    const { data: threads, error } = await this.supabaseAdmin
      .from("messages")
      .select("*")
      .eq("community_id", communityId)
      .is("parent_id", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[MessageService] Get threads error:", error);
      return ApiResponse.error("Failed to get threads", 500);
    }

    if (!threads || threads.length === 0) {
      return ApiResponse.success<MessageWithSender[]>([]);
    }

    // Get community creator
    const { data: community } = await this.supabaseAdmin
      .from("communities")
      .select("creator_id")
      .eq("communityId", communityId)
      .single();

    // Get all sender IDs
    const senderIds = [...new Set(threads.map((t: any) => t.sender_id))];

    // Fetch user data for all senders
    const { data: users } = await this.supabaseAdmin
      .from("users")
      .select("id, username, full_name, avatar_url")
      .in("id", senderIds);

    // Fetch roles for all senders
    const { data: memberships } = await this.supabaseAdmin
      .from("community_members")
      .select("user_id, role")
      .eq("community_id", communityId)
      .in("user_id", senderIds);

    // Create maps for quick lookup
    const userMap: Record<string, any> = {};
    (users || []).forEach((u: any) => {
      userMap[u.id] = u;
    });

    const roleMap: Record<string, string> = {};
    (memberships || []).forEach((m: any) => {
      roleMap[m.user_id] = m.role;
    });

    // Fetch replies for all threads
    const threadIds = threads.map((t: any) => t.id);
    const { data: allReplies } = await this.supabaseAdmin
      .from("messages")
      .select("*")
      .in("parent_id", threadIds)
      .order("created_at", { ascending: true });

    // Get unique sender IDs from replies
    const replySenderIds = [...new Set((allReplies || []).map((r: any) => r.sender_id))];
    
    // Fetch user data for reply senders
    const { data: replyUsers } = await this.supabaseAdmin
      .from("users")
      .select("id, username, full_name, avatar_url")
      .in("id", replySenderIds);

    // Fetch roles for reply senders
    const { data: replyMemberships } = await this.supabaseAdmin
      .from("community_members")
      .select("user_id, role")
      .eq("community_id", communityId)
      .in("user_id", replySenderIds);

    // Add reply users to userMap
    (replyUsers || []).forEach((u: any) => {
      userMap[u.id] = u;
    });

    // Add reply roles to roleMap
    (replyMemberships || []).forEach((m: any) => {
      roleMap[m.user_id] = m.role;
    });

    // Group replies by parent_id
    const repliesByThread: Record<string, any[]> = {};
    (allReplies || []).forEach((reply: any) => {
      if (!repliesByThread[reply.parent_id]) {
        repliesByThread[reply.parent_id] = [];
      }
      repliesByThread[reply.parent_id].push({
        ...reply,
        users: userMap[reply.sender_id] || null,
        authorRole: roleMap[reply.sender_id] || null,
        isCreator: reply.sender_id === community?.creator_id,
      });
    });

    // Transform threads with user data and replies
    const threadsWithUsers = threads.map((thread: any) => ({
      ...thread,
      users: userMap[thread.sender_id] || null,
      authorRole: roleMap[thread.sender_id] || null,
      isCreator: thread.sender_id === community?.creator_id,
      replies: repliesByThread[thread.id] || [],
    }));

    return ApiResponse.success<MessageWithSender[]>(threadsWithUsers as MessageWithSender[]);
  }

  /**
   * Get replies for a thread
   * @param threadId - The thread (parent message) ID
   * @returns ServiceResult containing array of replies with user data
   */
  public async getReplies(
    threadId: string
  ): Promise<ServiceResult<MessageWithSender[]>> {
    // Get replies
    const { data: replies, error } = await this.supabaseAdmin
      .from("messages")
      .select("*")
      .eq("parent_id", threadId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[MessageService] Get replies error:", error);
      return ApiResponse.error("Failed to get replies", 500);
    }

    if (!replies || replies.length === 0) {
      return ApiResponse.success<MessageWithSender[]>([]);
    }

    // Get parent message to get community_id
    const { data: parentMessage } = await this.supabaseAdmin
      .from("messages")
      .select("community_id")
      .eq("id", threadId)
      .single();

    if (!parentMessage) {
      return ApiResponse.notFound("Thread not found");
    }

    // Get community creator
    const { data: community } = await this.supabaseAdmin
      .from("communities")
      .select("creator_id")
      .eq("id", parentMessage.community_id)
      .single();

    // Get all sender IDs
    const senderIds = [...new Set(replies.map((r: any) => r.sender_id))];

    // Fetch user data for all senders
    const { data: users } = await this.supabaseAdmin
      .from("users")
      .select("id, username, full_name, avatar_url")
      .in("id", senderIds);

    // Fetch roles for all senders
    const { data: memberships } = await this.supabaseAdmin
      .from("community_members")
      .select("user_id, role")
      .eq("community_id", parentMessage.community_id)
      .in("user_id", senderIds);

    // Create maps for quick lookup
    const userMap: Record<string, any> = {};
    (users || []).forEach((u: any) => {
      userMap[u.id] = u;
    });

    const roleMap: Record<string, string> = {};
    (memberships || []).forEach((m: any) => {
      roleMap[m.user_id] = m.role;
    });

    // Transform replies with user data
    const repliesWithUsers = replies.map((reply: any) => ({
      ...reply,
      users: userMap[reply.sender_id] || null,
      authorRole: roleMap[reply.sender_id] || null,
      isCreator: reply.sender_id === community?.creator_id,
    }));

    return ApiResponse.success<MessageWithSender[]>(repliesWithUsers as MessageWithSender[]);
  }

  /**
   * Delete a message
   * @param messageId - The message ID to delete
   * @param userId - The user deleting (must be author or admin)
   * @returns ServiceResult indicating success
   */
  public async deleteMessage(
    messageId: string,
    userId: string
  ): Promise<ServiceResult<void>> {
    // Get message details
    const { data: message } = await this.supabaseAdmin
      .from("messages")
      .select("sender_id, community_id")
      .eq("id", messageId)
      .single();

    if (!message) {
      return ApiResponse.notFound("Message");
    }

    // Check if user is author or community admin
    if (message.sender_id !== userId) {
      const { data: membership } = await this.supabaseAdmin
        .from("community_members")
        .select("role")
        .eq("community_id", message.community_id)
        .eq("user_id", userId)
        .single();

      if (membership?.role !== "admin") {
        return ApiResponse.forbidden("Permission denied");
      }
    }

    const { error } = await this.supabaseAdmin
      .from("messages")
      .delete()
      .eq("id", messageId);

    if (error) {
      console.error("[MessageService] Delete message error:", error);
      return ApiResponse.error("Failed to delete message", 500);
    }

    return ApiResponse.noContent();
  }
}

// Export singleton instance
export const messageService: MessageService = MessageService.getInstance();

