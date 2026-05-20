import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Bookmark, BriefcaseBusiness, CalendarDays, Clock3, MessageSquareText, ShoppingBag, Sparkles, Store, Wrench } from "lucide-react";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type CollectionDelegate<T> = {
  findMany(args: unknown): Promise<T[]>;
};

interface SavedPostRow {
  post: {
    id: string;
    content: string;
    postType: string;
    author: { name: string | null };
  };
}

interface SavedListingRow {
  listing: {
    id: string;
    title: string;
    price: number;
    category: string;
    seller: { name: string | null };
  };
}

interface SavedEventRow {
  event: {
    id: string;
    title: string;
    startDate: Date;
    status: string;
    organizer: { name: string | null };
  };
}

interface SavedBusinessRow {
  business: {
    id: string;
    name: string;
    category: string;
    owner: { name: string | null };
  };
}

interface SavedServiceRow {
  service: {
    id: string;
    title: string;
    category: string;
    provider: { name: string | null };
  };
}

interface RecentlyViewedRow {
  id: string;
  targetType: string;
  targetId: string;
  viewedAt: Date;
}

interface RecentListingRow {
  id: string;
  title: string;
  price: number;
  category: string;
}

interface RecentBusinessRow {
  id: string;
  name: string;
  category: string;
  isVerified: boolean;
}

interface RecentServiceRow {
  id: string;
  title: string;
  category: string;
  isVerified: boolean;
}

const readDb = db as unknown as {
  savedPost: CollectionDelegate<SavedPostRow>;
  savedMarketplaceListing: CollectionDelegate<SavedListingRow>;
  savedEvent: CollectionDelegate<SavedEventRow>;
  savedBusiness: CollectionDelegate<SavedBusinessRow>;
  savedService: CollectionDelegate<SavedServiceRow>;
  recentlyViewed: CollectionDelegate<RecentlyViewedRow>;
  marketplaceListing: CollectionDelegate<RecentListingRow>;
  businessProfile: CollectionDelegate<RecentBusinessRow>;
  serviceProfile: CollectionDelegate<RecentServiceRow>;
};

export default async function SavedPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { locationId: true },
  });

  if (!user?.locationId) redirect("/onboarding");

  const [
    savedPosts,
    savedListings,
    savedEvents,
    savedBusinesses,
    savedServices,
    recentlyViewed,
  ] = await Promise.all([
    readDb.savedPost.findMany({
      where: { userId },
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        post: {
          include: {
            author: { select: { name: true, avatar: true } },
          },
        },
      },
    }),
    readDb.savedMarketplaceListing.findMany({
      where: { userId },
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        listing: {
          include: {
            seller: { select: { name: true, trustScore: true, residentVerified: true } },
          },
        },
      },
    }),
    readDb.savedEvent.findMany({
      where: { userId },
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        event: {
          include: {
            organizer: { select: { name: true } },
          },
        },
      },
    }),
    readDb.savedBusiness.findMany({
      where: { userId },
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        business: {
          include: {
            owner: { select: { name: true } },
          },
        },
      },
    }),
    readDb.savedService.findMany({
      where: { userId },
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        service: {
          include: {
            provider: { select: { name: true } },
          },
        },
      },
    }),
    readDb.recentlyViewed.findMany({
      where: { userId },
      take: 12,
      orderBy: { viewedAt: "desc" },
    }),
  ]);

  const listingIds = recentlyViewed
    .filter((item) => item.targetType === "MARKETPLACE")
    .map((item) => item.targetId);
  const businessIds = recentlyViewed
    .filter((item) => item.targetType === "BUSINESS")
    .map((item) => item.targetId);
  const serviceIds = recentlyViewed
    .filter((item) => item.targetType === "SERVICE")
    .map((item) => item.targetId);

  const [recentListings, recentBusinesses, recentServices] = await Promise.all([
    listingIds.length
      ? readDb.marketplaceListing.findMany({
          where: { id: { in: listingIds } },
          select: { id: true, title: true, price: true, category: true },
        })
      : [],
    businessIds.length
      ? readDb.businessProfile.findMany({
          where: { id: { in: businessIds } },
          select: { id: true, name: true, category: true, isVerified: true },
        })
      : [],
    serviceIds.length
      ? readDb.serviceProfile.findMany({
          where: { id: { in: serviceIds } },
          select: { id: true, title: true, category: true, isVerified: true },
        })
      : [],
  ]);

  const recentLookup = new Map<string, { title: string; eyebrow: string; meta?: string }>();
  recentListings.forEach((item) =>
    recentLookup.set(`MARKETPLACE:${item.id}`, {
      title: item.title,
      eyebrow: "Marketplace",
      meta: `₹${item.price.toLocaleString("en-IN")} • ${item.category}`,
    })
  );
  recentBusinesses.forEach((item) =>
    recentLookup.set(`BUSINESS:${item.id}`, {
      title: item.name,
      eyebrow: "Business",
      meta: `${item.category}${item.isVerified ? " • Verified" : ""}`,
    })
  );
  recentServices.forEach((item) =>
    recentLookup.set(`SERVICE:${item.id}`, {
      title: item.title,
      eyebrow: "Service",
      meta: `${item.category}${item.isVerified ? " • Verified" : ""}`,
    })
  );

  const recentItems = recentlyViewed
    .map((item) => ({
      ...item,
      details: recentLookup.get(`${item.targetType}:${item.targetId}`),
    }))
    .filter((item) => item.details);

  const totalSaved =
    savedPosts.length +
    savedListings.length +
    savedEvents.length +
    savedBusinesses.length +
    savedServices.length;

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-zinc-800 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            <Bookmark className="h-3.5 w-3.5" />
            Personal discovery shelf
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Saved & Recently Viewed</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
            Your bookmarked posts, listings, events, businesses, services, and recent discovery trail.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:min-w-56">
          <Metric label="Saved" value={totalSaved} />
          <Metric label="Recent" value={recentItems.length} />
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-5">
        <SavedColumn
          title="Posts"
          icon={<MessageSquareText className="h-4 w-4" />}
          empty="No saved posts yet."
          items={savedPosts.map(({ post }) => ({
            id: post.id,
            title: post.content,
            meta: `by ${post.author.name || "Neighbor"}`,
            badge: post.postType,
          }))}
        />
        <SavedColumn
          title="Listings"
          icon={<ShoppingBag className="h-4 w-4" />}
          empty="No saved listings yet."
          items={savedListings.map(({ listing }) => ({
            id: listing.id,
            title: listing.title,
            meta: `₹${listing.price.toLocaleString("en-IN")} • ${listing.seller.name || "Seller"}`,
            badge: listing.category,
          }))}
        />
        <SavedColumn
          title="Events"
          icon={<CalendarDays className="h-4 w-4" />}
          empty="No saved events yet."
          items={savedEvents.map(({ event }) => ({
            id: event.id,
            title: event.title,
            meta: `${event.startDate.toLocaleDateString("en-IN")} • ${event.organizer.name || "Organizer"}`,
            badge: event.status,
          }))}
        />
        <SavedColumn
          title="Businesses"
          icon={<Store className="h-4 w-4" />}
          empty="No saved businesses yet."
          items={savedBusinesses.map(({ business }) => ({
            id: business.id,
            title: business.name,
            meta: business.owner.name || "Local owner",
            badge: business.category,
          }))}
        />
        <SavedColumn
          title="Services"
          icon={<Wrench className="h-4 w-4" />}
          empty="No saved services yet."
          items={savedServices.map(({ service }) => ({
            id: service.id,
            title: service.title,
            meta: service.provider.name || "Provider",
            badge: service.category,
          }))}
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-emerald-500" />
          <h2 className="text-lg font-black">Recently viewed</h2>
        </div>
        {recentItems.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 py-12 text-center text-sm text-slate-500 dark:border-zinc-800 dark:text-zinc-500">
            <Sparkles className="mx-auto mb-3 h-8 w-8 text-emerald-500/70" />
            Open marketplace, business, or service details to build a useful discovery trail.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {recentItems.map((item) => (
              <Card key={item.id} className="rounded-2xl border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                      {item.details?.eyebrow}
                    </p>
                    <h3 className="mt-1 truncate text-sm font-extrabold">{item.details?.title}</h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">{item.details?.meta}</p>
                  </div>
                  <BriefcaseBusiness className="h-4 w-4 shrink-0 text-slate-300" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
      <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}

function SavedColumn({
  title,
  icon,
  items,
  empty,
}: {
  title: string;
  icon: React.ReactNode;
  empty: string;
  items: Array<{ id: string; title: string; meta: string; badge: string }>;
}) {
  return (
    <Card className="rounded-3xl border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-emerald-500">{icon}</span>
          <h2 className="text-sm font-black">{title}</h2>
        </div>
        <Badge variant="outline" className="text-[10px]">
          {items.length}
        </Badge>
      </div>
      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 px-3 py-8 text-center text-xs text-slate-500 dark:border-zinc-800 dark:text-zinc-500">
          {empty}
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl bg-slate-50 p-3 dark:bg-zinc-950/60">
              <div className="mb-2">
                <Badge className="bg-emerald-500/10 text-[9px] font-black text-emerald-700 dark:text-emerald-300">
                  {item.badge}
                </Badge>
              </div>
              <h3 className="line-clamp-2 text-xs font-extrabold">{item.title}</h3>
              <p className="mt-1 truncate text-[10px] text-slate-500 dark:text-zinc-500">{item.meta}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
