import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { MessagingClient } from './messaging-client';

/**
 * Messages Page - Server Component
 * Task 5.1: Create messaging center server component
 * 
 * Queries:
 * - ChatGroup records where user is a ChatMember
 * - Include last message for each group for sorting
 * - Include society, group, and event relations for thread names
 */
export default async function MessagesPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  // Fetch all chat groups user is a member of
  const chatGroups = await db.chatGroup.findMany({
    where: {
      members: {
        some: { userId }
      }
    },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, avatar: true }
          }
        }
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { id: true, content: true, createdAt: true }
      },
      society: { select: { name: true } },
      group: { select: { name: true } },
      event: { select: { title: true } }
    }
  });

  // Sort by most recent message first
  const sortedGroups = chatGroups.sort((a, b) => {
    const aTime = a.messages[0]?.createdAt || a.createdAt;
    const bTime = b.messages[0]?.createdAt || b.createdAt;
    return bTime.getTime() - aTime.getTime();
  });

  // Transform to client-friendly thread format
  const threads = sortedGroups.map(cg => ({
    id: cg.id,
    name: cg.name || cg.society?.name || cg.group?.name || cg.event?.title || 'Chat',
    isPrivate: cg.isPrivate,
    members: cg.members.map(m => ({
      userId: m.user.id,
      name: m.user.name || 'User',
      avatar: m.user.avatar
    })),
    lastMessage: cg.messages[0]?.content || null,
    lastMessageAt: cg.messages[0]?.createdAt || cg.createdAt
  }));

  // Fetch user's society to list candidate neighbors for DM creation
  const currentUserRecord = await db.user.findUnique({
    where: { id: userId },
    select: { societyId: true }
  });

  const neighbors = currentUserRecord?.societyId ? await db.user.findMany({
    where: {
      societyId: currentUserRecord.societyId,
      id: { not: userId }
    },
    select: { id: true, name: true, avatar: true }
  }) : [];

  return <MessagingClient threads={threads} currentUserId={userId} neighbors={neighbors} />;
}
