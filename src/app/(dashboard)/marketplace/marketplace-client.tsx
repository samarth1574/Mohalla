"use client";

import React, { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingBag, 
  Plus, 
  Loader2, 
  Search, 
  Bookmark, 
  MessageSquare, 
  Trash2, 
  Tag, 
  AlertOctagon, 
  Check, 
  UserCheck, 
  Eye, 
  Camera,
  Coins
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  createMarketplaceListingAction, 
  toggleSaveListingAction, 
  deleteMarketplaceListingAction 
} from "@/app/actions/marketplace";
import { recordRecentlyViewedAction } from "@/app/actions/saved";

interface MarketplaceClientProps {
  currentUserId: string;
  listings: any[];
}

const MARKETPLACE_CATEGORIES = [
  { label: "All Items", value: "ALL" },
  { label: "Electronics", value: "ELECTRONICS" },
  { label: "Furniture", value: "FURNITURE" },
  { label: "Vehicles", value: "VEHICLES" },
  { label: "Books", value: "BOOKS" },
  { label: "Fashion & Clothes", value: "FASHION" },
  { label: "Home Appliances", value: "APPLIANCES" },
  { label: "Rentals / PG", value: "RENTALS" },
  { label: "Other Listings", value: "OTHER" },
];

export function MarketplaceClient({ currentUserId, listings }: MarketplaceClientProps) {
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Create Listing form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState("GOOD");
  const [listingType, setListingType] = useState<"BUY" | "SELL" | "RENT" | "EXCHANGE">("SELL");
  const [category, setCategory] = useState("ELECTRONICS");
  const [imageUrl, setImageUrl] = useState("");

  // AI Moderation Alerts
  const [scamAlert, setScamAlert] = useState<{
    flagged: boolean;
    reason: string;
  } | null>(null);

  // Filter listings
  const filteredListings = listings.filter((item) => {
    const matchesCategory = selectedCategory === "ALL" || item.category === selectedCategory;
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !price) return;

    setScamAlert(null);
    startTransition(async () => {
      try {
        const result = await createMarketplaceListingAction({
          title,
          description,
          price: parseFloat(price),
          condition,
          listingType,
          category,
          mediaUrls: imageUrl.trim() ? [imageUrl] : [],
        });

        if (result.success) {
          if (result.scamFlagged) {
            setScamAlert({
              flagged: true,
              reason: result.reason || "High UPI fraud triggers detected.",
            });
          } else {
            setTitle("");
            setDescription("");
            setPrice("");
            setImageUrl("");
            setCondition("GOOD");
            setListingType("SELL");
            setComposerOpen(false);
          }
        }
      } catch (err: any) {
        alert(err.message || "Failed to create listing.");
      }
    });
  };

  const handleSaveListing = (listingId: string) => {
    startTransition(async () => {
      try {
        await toggleSaveListingAction(listingId);
      } catch (err: any) {
        console.error(err);
      }
    });
  };

  const handleDeleteListing = (listingId: string) => {
    if (confirm("Delete this listing from Mohalla?")) {
      startTransition(async () => {
        try {
          await deleteMarketplaceListingAction(listingId);
        } catch (err: any) {
          alert(err.message);
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-4 text-left">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Mohalla Marketplace</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Buy, sell, rent, or exchange goods within your local neighborhood. Protected by AI scam scanners.
          </p>
        </div>
        <Button
          onClick={() => setComposerOpen(!composerOpen)}
          className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold"
        >
          <Plus className="w-4 h-4 mr-1" />
          Create Listing
        </Button>
      </div>

      {/* Search Bar & Category Toggle */}
      <div className="flex flex-col md:flex-row items-center gap-4 text-left">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Search items, electronics, furniture..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-12 rounded-xl bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
          {MARKETPLACE_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedCategory === cat.value
                  ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow"
                  : "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-850"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Composer modal/slide form */}
      <AnimatePresence>
        {composerOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-xl p-6 text-left">
              <form onSubmit={handleCreateListing} className="space-y-4">
                
                {scamAlert && (
                  <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 flex items-start gap-2.5">
                    <AlertOctagon className="w-5 h-5 shrink-0 mt-0.5 animate-bounce" />
                    <div>
                      <span className="font-extrabold uppercase tracking-wide">AI FRAUD DETECTION TRIGGERED:</span>{" "}
                      {scamAlert.reason} Your listing matches patterns typical of advance fee scams or UPI refund fraud. It has been blocked from neighbor feeds.
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                      Item Title
                    </label>
                    <Input
                      placeholder="e.g. Brand New Ikea Coffee Table"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      className="rounded-xl bg-slate-50 dark:bg-zinc-800"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                      Price (INR)
                    </label>
                    <Input
                      type="number"
                      placeholder="e.g. 2500"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                      className="rounded-xl bg-slate-50 dark:bg-zinc-800"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                      Listing Type
                    </label>
                    <select
                      value={listingType}
                      onChange={(e) => setListingType(e.target.value as any)}
                      className="w-full h-10 px-3 rounded-xl border border-white/10 bg-slate-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    >
                      <option value="SELL">Sell Item</option>
                      <option value="RENT">Rent Out</option>
                      <option value="BUY">Looking to Buy</option>
                      <option value="EXCHANGE">Barter / Exchange</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                      Condition
                    </label>
                    <select
                      value={condition}
                      onChange={(e) => setCondition(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-white/10 bg-slate-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    >
                      <option value="NEW">Brand New</option>
                      <option value="LIKE_NEW">Like New</option>
                      <option value="GOOD">Good Condition</option>
                      <option value="FAIR">Fair / Used</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-white/10 bg-slate-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    >
                      <option value="ELECTRONICS">Electronics</option>
                      <option value="FURNITURE">Furniture</option>
                      <option value="VEHICLES">Vehicles / Bicycles</option>
                      <option value="BOOKS">Books & Materials</option>
                      <option value="FASHION">Fashion & Accessories</option>
                      <option value="APPLIANCES">Home Appliances</option>
                      <option value="RENTALS">Rentals / Rooms</option>
                      <option value="OTHER">Other Categories</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    Listing Description
                  </label>
                  <Textarea
                    placeholder="Provide details about the item (brand, warranty status, landmarks for handshakes, etc)..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={3}
                    className="rounded-xl bg-slate-50 dark:bg-zinc-800 resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    Image Link
                  </label>
                  <div className="relative">
                    <Input
                      placeholder="Paste image URL to showcase the item..."
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="pl-10 rounded-xl bg-slate-50 dark:bg-zinc-800"
                    />
                    <Camera className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setComposerOpen(false)}
                    className="rounded-full"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold"
                  >
                    {isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Post Listing"
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Listings Display Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-left">
        {filteredListings.length === 0 ? (
          <div className="sm:col-span-2 md:col-span-3 text-center py-20 border border-dashed border-slate-200 dark:border-zinc-800 rounded-3xl text-slate-400 dark:text-zinc-500">
            <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-60" />
            <p className="text-sm font-semibold">No items match your filters.</p>
            <p className="text-xs mt-1">Be the first to post something in the marketplace!</p>
          </div>
        ) : (
          filteredListings.map((item) => (
            <Card
              key={item.id}
              className="rounded-3xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm overflow-hidden flex flex-col justify-between hover:border-slate-350 dark:hover:border-zinc-750 transition-colors"
            >
              <div>
                {/* Media */}
                {item.mediaUrls?.[0] ? (
                  <div className="h-44 w-full overflow-hidden bg-slate-100 dark:bg-zinc-950 flex items-center justify-center border-b border-slate-200 dark:border-zinc-850">
                    <img
                      src={item.mediaUrls[0]}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-44 w-full bg-slate-100 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-850 flex items-center justify-center text-slate-400">
                    <Camera className="w-8 h-8 opacity-30" />
                  </div>
                )}

                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[9px] font-bold">
                      {item.listingType}
                    </Badge>
                    <Badge className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 text-[9px] font-bold">
                      Condition: {item.condition}
                    </Badge>
                  </div>

                  <h4 className="font-extrabold text-sm truncate dark:text-zinc-100">
                    {item.title}
                  </h4>
                  <p className="text-emerald-600 dark:text-emerald-400 text-sm font-black">
                    ₹{item.price.toLocaleString("en-IN")}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Seller details & actions */}
              <div className="border-t border-slate-100 dark:border-zinc-850 p-5 pt-3 flex flex-col gap-3">
                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-zinc-400">
                  <div className="flex items-center gap-1.5 truncate">
                    <Avatar className="w-5 h-5 shrink-0">
                      <AvatarFallback>{item.seller.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="font-bold truncate">{item.seller.name}</span>
                    <span className="text-emerald-500 font-black">★ {item.seller.trustScore}</span>
                  </div>
                  {item.seller.residentVerified && (
                    <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[8px] py-0 px-1">
                      Verified
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleSaveListing(item.id)}
                    variant="outline"
                    className={`rounded-xl flex-1 h-9 text-xs border-slate-200 dark:border-zinc-800 ${
                      item.isSaved ? "text-emerald-500 bg-emerald-500/5" : ""
                    }`}
                  >
                    <Bookmark className={`w-3.5 h-3.5 mr-1 ${item.isSaved ? "fill-emerald-500" : ""}`} />
                    <span>{item.isSaved ? "Saved" : "Save"}</span>
                  </Button>

                  {item.sellerId === currentUserId ? (
                    <Button
                      onClick={() => handleDeleteListing(item.id)}
                      variant="destructive"
                      className="rounded-xl h-9 px-3 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        startTransition(async () => {
                          try {
                            await recordRecentlyViewedAction("MARKETPLACE", item.id);
                          } catch (err) {
                            console.error(err);
                          }
                        });
                        alert(
                          `Inquire about "${item.title}". Contact seller at their registered neighborhood mailbox.`
                        );
                      }}
                      className="rounded-xl flex-1 bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-bold h-9 text-xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5 mr-1" />
                      Chat
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
