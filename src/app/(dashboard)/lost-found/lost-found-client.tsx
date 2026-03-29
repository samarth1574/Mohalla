"use client";

import React, { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Plus, 
  Loader2, 
  MapPin, 
  Clock, 
  FileQuestion, 
  Eye, 
  Check, 
  Image as ImageIcon 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createLostAndFoundAction, resolveLostAndFoundAction } from "@/app/actions/requests";

interface LostAndFoundClientProps {
  currentUserId: string;
  items: any[];
}

export function LostAndFoundClient({ currentUserId, items }: LostAndFoundClientProps) {
  const [selectedFilter, setSelectedFilter] = useState<"ALL" | "LOST" | "FOUND">("ALL");
  const [composerOpen, setComposerOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Composer fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("LOST");
  const [imageUrl, setImageUrl] = useState("");

  const filteredItems = items.filter((item) => {
    if (selectedFilter === "ALL") return true;
    return item.type === selectedFilter;
  });

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    startTransition(async () => {
      try {
        const result = await createLostAndFoundAction({
          title,
          description,
          imageUrl: imageUrl.trim() ? imageUrl : undefined,
          type,
        });

        if (result.success) {
          setTitle("");
          setDescription("");
          setImageUrl("");
          setType("LOST");
          setComposerOpen(false);
        }
      } catch (err: any) {
        alert(err.message || "Failed to create lost/found alert.");
      }
    });
  };

  const handleResolve = (itemId: string) => {
    startTransition(async () => {
      try {
        await resolveLostAndFoundAction(itemId);
      } catch (err: any) {
        alert(err.message || "Failed to mark item as resolved.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-4 text-left">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Lost & Found Alerts</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Lost a pet, keys, or found a wallet in the neighborhood? Broadcast it immediately to nearby societies.
          </p>
        </div>
        <Button
          onClick={() => setComposerOpen(!composerOpen)}
          className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold"
        >
          <Plus className="w-4 h-4 mr-1" />
          Report Lost/Found
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl w-full sm:w-max">
        <button
          onClick={() => setSelectedFilter("ALL")}
          className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-lg transition ${
            selectedFilter === "ALL"
              ? "bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm"
              : "text-slate-500 dark:text-zinc-400 hover:text-slate-700"
          }`}
        >
          All Items
        </button>
        <button
          onClick={() => setSelectedFilter("LOST")}
          className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-lg transition ${
            selectedFilter === "LOST"
              ? "bg-white dark:bg-zinc-800 text-red-600 dark:text-red-400 shadow-sm"
              : "text-slate-500 dark:text-zinc-400 hover:text-slate-700"
          }`}
        >
          Lost Items
        </button>
        <button
          onClick={() => setSelectedFilter("FOUND")}
          className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-lg transition ${
            selectedFilter === "FOUND"
              ? "bg-white dark:bg-zinc-800 text-teal-600 dark:text-teal-400 shadow-sm"
              : "text-slate-500 dark:text-zinc-400 hover:text-slate-700"
          }`}
        >
          Found Items
        </button>
      </div>

      {/* Composer Alert */}
      <AnimatePresence>
        {composerOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-xl p-6 text-left">
              <form onSubmit={handleCreateReport} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                      What is the item/pet?
                    </label>
                    <Input
                      placeholder="e.g. Lost Golden Retriever (answers to 'Max')"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      className="rounded-xl bg-slate-50 dark:bg-zinc-800"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                      Alert Type
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-white/10 bg-slate-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    >
                      <option value="LOST">Lost - Help me find it</option>
                      <option value="FOUND">Found - Help me return it</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    Additional details & description
                  </label>
                  <Textarea
                    placeholder="Provide descriptions (color, marks, collar details, approximate coordinates, contact details)..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={4}
                    className="rounded-xl bg-slate-50 dark:bg-zinc-800 resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    Attach Image URL
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Paste image link to show what it looks like..."
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="pl-10 rounded-xl bg-slate-50 dark:bg-zinc-800"
                    />
                    <ImageIcon className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
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
                      "Publish Alert"
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid displays */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
        {filteredItems.length === 0 ? (
          <div className="md:col-span-2 lg:col-span-3 text-center py-20 border border-dashed border-slate-200 dark:border-zinc-800 rounded-3xl text-slate-400 dark:text-zinc-500">
            <FileQuestion className="w-10 h-10 mx-auto mb-3 opacity-60" />
            <p className="text-sm font-semibold">No alerts found under this category.</p>
            <p className="text-xs mt-1">Everyone's items seem accounted for!</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <Card
              key={item.id}
              className={`rounded-3xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm overflow-hidden flex flex-col justify-between hover:border-slate-300 dark:hover:border-zinc-750 transition-colors ${
                item.status === "RESOLVED" ? "opacity-75" : ""
              }`}
            >
              <div>
                {/* Media Preview */}
                {item.imageUrl ? (
                  <div className="h-48 w-full overflow-hidden bg-slate-100 dark:bg-zinc-950 flex items-center justify-center border-b border-slate-200 dark:border-zinc-850">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-28 w-full bg-slate-100 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-850 flex items-center justify-center text-slate-400">
                    <ImageIcon className="w-10 h-10 opacity-40 animate-pulse" />
                  </div>
                )}

                <div className="p-6 space-y-3">
                  {/* Badges header */}
                  <div className="flex items-center justify-between">
                    <Badge
                      className={
                        item.type === "LOST"
                          ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 text-[9px] font-bold"
                          : "bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 text-[9px] font-bold"
                      }
                    >
                      {item.type}
                    </Badge>
                    <Badge
                      className={
                        item.status === "ACTIVE"
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[9px] font-bold"
                          : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20 text-[9px] font-bold"
                      }
                    >
                      {item.status}
                    </Badge>
                  </div>

                  <h3 className="text-base font-extrabold tracking-tight truncate">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-3">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-slate-100 dark:border-zinc-850 p-6 pt-4 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-zinc-400">
                  <Avatar className="w-5 h-5 shrink-0">
                    <AvatarFallback>{item.author.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="font-bold truncate">{item.author.name}</span>
                  <span>•</span>
                  <span className="truncate">{item.author.societyName || "Resident"}</span>
                </div>

                {item.authorId === currentUserId && item.status === "ACTIVE" && (
                  <Button
                    onClick={() => handleResolve(item.id)}
                    className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 h-9"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Mark Resolved
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
