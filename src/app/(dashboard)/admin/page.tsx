import React from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AdminClient } from "./admin-client";

export default async function AdminPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Check role - Task 8.1: Redirect non-moderators to /feed before rendering
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role !== "ADMIN" && user?.role !== "MODERATOR") {
    redirect("/feed");
  }

  // Fetch PENDING reports
  const reports = await db.report.findMany({
    where: { status: "PENDING" },
    include: {
      reporter: {
        select: { name: true },
      },
      reportedUser: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Fetch flagged posts
  const flaggedPosts = await db.post.findMany({
    where: {
      moderationStatus: {
        not: "APPROVED",
      },
    },
    include: {
      author: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Fetch flagged listings
  const flaggedListings = await db.marketplaceListing.findMany({
    where: {
      moderationStatus: {
        not: "APPROVED",
      },
    },
    include: {
      seller: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Task 8.1: Compute analytics metrics
  const now = new Date();
  const todayStart = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  // Calculate DAU - distinct authorId from Post/Comment and senderId from Message
  const dauPostCommentQuery = db.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(DISTINCT "authorId") as count
    FROM (
      SELECT "authorId" FROM "Post" WHERE "createdAt" >= ${todayStart} AND "createdAt" < ${todayEnd}
      UNION
      SELECT "authorId" FROM "Comment" WHERE "createdAt" >= ${todayStart} AND "createdAt" < ${todayEnd}
      UNION
      SELECT "senderId" as "authorId" FROM "Message" WHERE "createdAt" >= ${todayStart} AND "createdAt" < ${todayEnd}
    ) as active_users
  `;

  const dauResult = await dauPostCommentQuery;
  const dau = Number(dauResult[0]?.count || 0);

  // Calculate MAU - 30-day rolling window
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const mauQuery = db.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(DISTINCT "authorId") as count
    FROM (
      SELECT "authorId" FROM "Post" WHERE "createdAt" >= ${thirtyDaysAgo}
      UNION
      SELECT "authorId" FROM "Comment" WHERE "createdAt" >= ${thirtyDaysAgo}
      UNION
      SELECT "senderId" as "authorId" FROM "Message" WHERE "createdAt" >= ${thirtyDaysAgo}
    ) as active_users
  `;

  const mauResult = await mauQuery;
  const mau = Number(mauResult[0]?.count || 0);

  // Generate 7-day post count array with weekday labels
  const sevenDayPostCounts = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(todayStart);
    dayStart.setDate(dayStart.getDate() - i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const count = await db.post.count({
      where: {
        createdAt: {
          gte: dayStart,
          lt: dayEnd
        }
      }
    });

    const weekday = dayStart.toLocaleDateString('en-US', { weekday: 'short' });
    sevenDayPostCounts.push({ day: weekday, count });
  }

  // Query content summary counts and extended analytics metrics
  const [
    activeEmergencies, 
    availableListings, 
    openRequests, 
    activeLostItems,
    eventRSVPsCount,
    soldListingsCount,
    totalMessagesCount,
    recentMessagesCount,
    resolvedEmergenciesCount
  ] = await Promise.all([
    db.emergencySOS.count({ where: { status: 'ACTIVE' } }),
    db.marketplaceListing.count({ where: { status: 'AVAILABLE' } }),
    db.communityRequest.count({ where: { status: 'OPEN' } }),
    db.lostAndFound.count({ where: { status: 'ACTIVE' } }),
    db.eventRSVP.count(),
    db.marketplaceListing.count({ where: { status: 'SOLD' } }),
    db.message.count(),
    db.message.count({
      where: {
        createdAt: {
          gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    }),
    db.emergencySOS.count({ where: { status: 'RESOLVED' } })
  ]);

  // Generate 7-day user signup growth array
  const sevenDaySignupCounts = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(todayStart);
    dayStart.setDate(dayStart.getDate() - i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const count = await db.user.count({
      where: {
        createdAt: {
          gte: dayStart,
          lt: dayEnd
        }
      }
    });

    const weekday = dayStart.toLocaleDateString('en-US', { weekday: 'short' });
    sevenDaySignupCounts.push({ day: weekday, count });
  }

  // Task 8.2: Query AI quarantine audit log
  const flaggedPostsAudit = await db.post.findMany({
    where: {
      moderationStatus: {
        in: ['FLAGGED_SPAM', 'FLAGGED_TOXIC', 'FLAGGED_SCAM', 'QUARANTINED']
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      author: {
        select: { name: true }
      }
    }
  });

  const flaggedListingsAudit = await db.marketplaceListing.findMany({
    where: {
      moderationStatus: {
        in: ['FLAGGED_SPAM', 'FLAGGED_TOXIC', 'FLAGGED_SCAM', 'QUARANTINED']
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      seller: {
        select: { name: true }
      }
    }
  });

  // Combine and sort audit log entries
  const auditLog = [
    ...flaggedPostsAudit.map(post => ({
      id: post.id,
      type: 'POST' as const,
      authorName: post.author.name || 'Unknown',
      content: post.content.substring(0, 120) + (post.content.length > 120 ? '…' : ''),
      moderationStatus: post.moderationStatus,
      moderationReason: post.moderationReason,
      createdAt: post.createdAt
    })),
    ...flaggedListingsAudit.map(listing => ({
      id: listing.id,
      type: 'LISTING' as const,
      authorName: listing.seller.name || 'Unknown',
      content: listing.description.substring(0, 120) + (listing.description.length > 120 ? '…' : ''),
      moderationStatus: listing.moderationStatus,
      moderationReason: listing.moderationReason,
      createdAt: listing.createdAt
    }))
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 100);

  return (
    <AdminClient
      reports={reports}
      flaggedPosts={flaggedPosts}
      flaggedListings={flaggedListings}
      analytics={{
        dau,
        mau,
        sevenDayPostCounts,
        contentSummary: {
          activeEmergencies,
          availableListings,
          openRequests,
          activeLostItems
        },
        auditLog,
        extendedAnalytics: {
          eventRSVPsCount,
          soldListingsCount,
          totalMessagesCount,
          recentMessagesCount,
          resolvedEmergenciesCount,
          sevenDaySignupCounts
        }
      }}
    />
  );
}
