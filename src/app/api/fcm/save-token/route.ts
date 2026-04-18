import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { token } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    // Validate token format (basic check)
    if (token.length < 20) {
      return NextResponse.json({ error: 'Invalid token format' }, { status: 400 });
    }

    await db.user.update({
      where: { id: userId },
      data: { fcmToken: token }
    });

    console.log(`[FCM API] Token saved for user ${userId}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[FCM API] Error saving token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
