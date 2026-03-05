"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { moderateContent } from "@/lib/gemini";
import { revalidatePath } from "next/cache";

/**
 * Creates a new community post (or poll) with integrated Gemini moderation.
 */
export async function createPostAction(data: {
  content: string;
  mediaUrls?: string[];
  postType?: "GENERAL" | "POLL";
  pollOptions?: string[];
  societyId?: string;
  groupId?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Fetch user profile to get location
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.locationId) {
    throw new Error("User location is not set. Please complete onboarding first.");
  }

  // 1. Run Gemini AI Content Moderation
  const moderation = await moderateContent(data.content);

  // 2. Create the Post in the DB
  const newPost = await db.post.create({
    data: {
      authorId: userId,
      content: data.content,
      mediaUrls: data.mediaUrls || [],
      postType: data.postType || "GENERAL",
      locationId: user.locationId,
      societyId: data.societyId || undefined,
      groupId: data.groupId || undefined,
      moderationStatus: moderation.status,
      moderationReason: moderation.reason,
      categoryTags: [], // tags can be set if needed
    },
  });

  // 3. Create Poll Options if applicable
  if (data.postType === "POLL" && data.pollOptions && data.pollOptions.length > 0) {
    const pollOptionsData = data.pollOptions
      .filter((opt) => opt.trim().length > 0)
      .map((text) => ({
        postId: newPost.id,
        text: text.trim(),
      }));

    if (pollOptionsData.length > 0) {
      await db.pollOption.createMany({
        data: pollOptionsData,
      });
    }
  }

  revalidatePath("/feed");
  return { 
    success: true, 
    postId: newPost.id, 
    moderated: moderation.status !== "APPROVED",
    moderationStatus: moderation.status,
    moderationReason: moderation.reason 
  };
}

/**
 * Toggles an upvote on a post.
 */
export async function toggleUpvoteAction(postId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const existingUpvote = await db.postUpvote.findUnique({
    where: {
      userId_postId: {
        userId,
        postId,
      },
    },
  });

  if (existingUpvote) {
    // Remove upvote
    await db.postUpvote.delete({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });
  } else {
    // Add upvote
    await db.postUpvote.create({
      data: {
        userId,
        postId,
      },
    });
  }

  revalidatePath("/feed");
  return { success: true };
}

/**
 * Submits a vote on a poll option (restricting to one vote per poll).
 */
export async function voteInPollAction(postId: string, optionId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Find all option IDs for this post to clear any existing vote
  const options = await db.pollOption.findMany({
    where: { postId },
    select: { id: true },
  });
  
  const optionIds = options.map((opt) => opt.id);

  // Remove any previous vote by this user on this poll
  await db.pollVote.deleteMany({
    where: {
      userId,
      optionId: {
        in: optionIds,
      },
    },
  });

  // Create new vote
  await db.pollVote.create({
    data: {
      userId,
      optionId,
    },
  });

  revalidatePath("/feed");
  return { success: true };
}

/**
 * Adds a comment or nested reply to a post.
 */
export async function createCommentAction(data: {
  postId: string;
  content: string;
  parentId?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Moderate comment
  const moderation = await moderateContent(data.content);
  if (moderation.status === "FLAGGED_TOXIC") {
    throw new Error(`Comment blocked: ${moderation.reason}`);
  }

  const comment = await db.comment.create({
    data: {
      postId: data.postId,
      authorId: userId,
      content: data.content,
      parentId: data.parentId || undefined,
    },
  });

  // Notify post author if commenting on their post (and not self)
  const post = await db.post.findUnique({
    where: { id: data.postId },
    select: { authorId: true },
  });

  if (post && post.authorId !== userId) {
    await db.notification.create({
      data: {
        userId: post.authorId,
        type: "COMMENT",
        title: "New Comment on your post",
        body: data.content.substring(0, 80) + (data.content.length > 80 ? "..." : ""),
        payload: { postId: data.postId, commentId: comment.id },
      },
    });
  }

  revalidatePath("/feed");
  return { success: true, comment };
}

/**
 * Deletes a post (Checking authorization).
 */
export async function deletePostAction(postId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const post = await db.post.findUnique({
    where: { id: postId },
  });

  if (!post) throw new Error("Post not found.");

  // Check if owner or admin
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (post.authorId !== userId && user?.role !== "ADMIN" && user?.role !== "MODERATOR") {
    throw new Error("Unauthorized: You cannot delete this post.");
  }

  await db.post.delete({
    where: { id: postId },
  });

  revalidatePath("/feed");
  return { success: true };
}
