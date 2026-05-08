'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

/**
 * Send a message to a chat group
 * Task 5.4: Implements sendMessageAction with membership verification
 */
export async function sendMessageAction(data: {
  groupId: string;
  content: string;
}) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  // Trim and validate message content
  const trimmed = data.content.trim();
  if (!trimmed || trimmed.length > 2000) {
    return { success: false, error: 'Invalid message content' };
  }

  // Verify membership
  const membership = await db.chatMember.findFirst({
    where: {
      groupId: data.groupId,
      userId
    }
  });

  if (!membership) {
    return { success: false, error: 'Not a member of this chat group' };
  }

  try {
    // Create Message record via Prisma
    const message = await db.message.create({
      data: {
        groupId: data.groupId,
        senderId: userId,
        content: trimmed
      },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });

    revalidatePath('/messages');
    return { success: true, message };
  } catch (error) {
    console.error('[sendMessageAction] Error:', error);
    return { success: false, error: 'Failed to send message' };
  }
}

/**
 * Get or create a DM thread between two users
 * Task 5.4: Implements getOrCreateDMThreadAction for private threads
 */
export async function getOrCreateDMThreadAction(targetUserId: string) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  if (userId === targetUserId) {
    return { success: false, error: 'Cannot create DM with yourself' };
  }

  try {
    // Find existing DM thread
    // Query for a ChatGroup where isPrivate: true that has exactly two ChatMember rows
    const existingThread = await db.chatGroup.findFirst({
      where: {
        isPrivate: true,
        members: {
          every: {
            userId: { in: [userId, targetUserId] }
          }
        }
      },
      include: {
        members: true
      }
    });

    // Verify it has exactly 2 members
    if (existingThread && existingThread.members.length === 2) {
      return { success: true, threadId: existingThread.id };
    }

    // Create new DM thread
    const newThread = await db.chatGroup.create({
      data: {
        isPrivate: true,
        members: {
          create: [
            { userId },
            { userId: targetUserId }
          ]
        }
      }
    });

    revalidatePath('/messages');
    return { success: true, threadId: newThread.id };
  } catch (error) {
    console.error('[getOrCreateDMThreadAction] Error:', error);
    return { success: false, error: 'Failed to create DM thread' };
  }
}
