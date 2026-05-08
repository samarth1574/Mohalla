import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * GET /api/messages/[groupId]
 * Task 5.4: Fetch last 50 messages ordered by createdAt ascending
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { groupId } = await params;

  // Verify membership
  const membership = await db.chatMember.findFirst({
    where: { groupId, userId }
  });

  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // Fetch the newest 50 messages, then return them oldest-to-newest for chat rendering.
    const messages = await db.message.findMany({
      where: { groupId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        sender: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });

    return NextResponse.json({ messages: messages.reverse() });
  } catch (error) {
    console.error('[GET /api/messages/[groupId]] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
