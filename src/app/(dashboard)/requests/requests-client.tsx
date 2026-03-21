"use client";

import React, { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HelpCircle, 
  MessageSquare, 
  CheckCircle2, 
  Plus, 
  Loader2, 
  Filter, 
  User, 
  Tag, 
  BookOpen, 
  Home, 
  Zap, 
  ThumbsUp, 
  Check 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  createCommunityRequestAction, 
  resolveCommunityRequestAction, 
  commentOnRequestAction 
} from "@/app/actions/requests";

interface RequestsClientProps {
  currentUserId: string;
  requests: any[];
}

const CATEGORIES = [
  { label: "All Helper Gigs", value: "ALL" },
  { label: "Need a Tutor", value: "Tutor", icon: BookOpen },
  { label: "Flatmates", value: "Flatmate", icon: Home },
  { label: "Borrow/Hardware", value: "Charger", icon: Zap },
  { label: "Recommendations", value: "Recommendations", icon: ThumbsUp },
  { label: "Other Gigs", value: "Other", icon: HelpCircle },
];

export function RequestsClient({ currentUserId, requests }: RequestsClientProps) {
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [composerOpen, setComposerOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Create Request state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Tutor");

  // Comment inputs
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  const filteredRequests = requests.filter((req) => {
    if (selectedCategory === "ALL") return true;
    return req.category === selectedCategory;
  });

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    startTransition(async () => {
      try {
        const result = await createCommunityRequestAction({
          title,
          description,
          category,
        });

        if (result.success) {
          setTitle("");
          setDescription("");
          setCategory("Tutor");
          setComposerOpen(false);
        }
      } catch (err: any) {
        alert(err.message || "Failed to submit request.");
      }
    });
  };

  const handleResolve = (requestId: string) => {
    startTransition(async () => {
      try {
        await resolveCommunityRequestAction(requestId);
      } catch (err: any) {
        alert(err.message || "Failed to resolve request.");
      }
    });
  };

  const handleComment = async (requestId: string) => {
    const text = commentInputs[requestId];
    if (!text || !text.trim()) return;

    try {
      const result = await commentOnRequestAction(requestId, text);
      if (result.success) {
        setCommentInputs({ ...commentInputs, [requestId]: "" });
      }
    } catch (err: any) {
      alert(err.message || "Failed to reply.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-4 text-left">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Community Requests</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Need a tutor, a flatmate, a laptop charger, or recommendations? Ask verified neighbors.
          </p>
        </div>
        <Button
          onClick={() => setComposerOpen(!composerOpen)}
          className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold"
        >
          <Plus className="w-4 h-4 mr-1" />
          Make a Request
        </Button>
      </div>

      {/* Categories Horizontal Carousel */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-800">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              selectedCategory === cat.value
                ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow"
                : "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-850"
            }`}
          >
            {cat.icon && <cat.icon className="w-4 h-4 shrink-0" />}
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Create Request Modal / Slide Form */}
      <AnimatePresence>
        {composerOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-xl p-6 text-left">
              <form onSubmit={handleCreateRequest} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                      What are you looking for?
                    </label>
                    <Input
                      placeholder="e.g. Need a physics tutor for Grade 10"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      className="rounded-xl bg-slate-50 dark:bg-zinc-800"
                    />
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
                      <option value="Tutor">Need a Tutor</option>
                      <option value="Flatmate">Need a Flatmate</option>
                      <option value="Charger">Need a Charger / Device</option>
                      <option value="Recommendations">Recommendations</option>
                      <option value="Other">Other Helper Requests</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    Additional Details
                  </label>
                  <Textarea
                    placeholder="Provide details (dates, contact instructions, landmark, specifications)..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={4}
                    className="rounded-xl bg-slate-50 dark:bg-zinc-800 resize-none"
                  />
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
                      "Publish Request"
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Requests Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
        {filteredRequests.length === 0 ? (
          <div className="md:col-span-2 text-center py-20 border border-dashed border-slate-200 dark:border-zinc-800 rounded-3xl text-slate-400 dark:text-zinc-500">
            <HelpCircle className="w-10 h-10 mx-auto mb-3 opacity-60" />
            <p className="text-sm font-semibold">No requests found under this category.</p>
            <p className="text-xs mt-1">Be the first to list a helper request in your area!</p>
          </div>
        ) : (
          filteredRequests.map((req) => (
            <Card
              key={req.id}
              className={`rounded-3xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm p-6 space-y-4 hover:border-slate-300 dark:hover:border-zinc-750 transition-colors flex flex-col justify-between ${
                req.status === "RESOLVED" ? "opacity-75" : ""
              }`}
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>{req.author.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs font-bold">{req.author.name}</p>
                      <p className="text-[9px] text-zinc-500">
                        {req.author.societyName || "Verified Resident"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[9px] font-bold">
                      {req.category}
                    </Badge>
                    <Badge
                      className={
                        req.status === "OPEN"
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[9px] font-bold"
                          : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20 text-[9px] font-bold"
                      }
                    >
                      {req.status}
                    </Badge>
                  </div>
                </div>

                {/* Request Content */}
                <div className="space-y-2">
                  <h3 className="text-base font-extrabold tracking-tight">
                    {req.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-zinc-350 leading-relaxed">
                    {req.description}
                  </p>
                </div>
              </div>

              {/* Action buttons (Resolve, comment toggle) */}
              <div className="border-t border-slate-100 dark:border-zinc-850 pt-4 mt-4 space-y-4">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-zinc-400">
                  <button
                    onClick={() => {
                      setExpandedComments({
                        ...expandedComments,
                        [req.id]: !expandedComments[req.id],
                      });
                    }}
                    className="flex items-center gap-1.5 hover:text-emerald-500 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Discussions ({req.comments.length})</span>
                  </button>

                  {req.authorId === currentUserId && req.status === "OPEN" && (
                    <Button
                      onClick={() => handleResolve(req.id)}
                      size="sm"
                      className="rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-8 px-4 text-[10px]"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" />
                      Mark Resolved
                    </Button>
                  )}
                </div>

                {/* Comments box */}
                {expandedComments[req.id] && (
                  <div className="space-y-3 pt-2">
                    {req.comments.length > 0 && (
                      <div className="space-y-2 bg-slate-50/50 dark:bg-zinc-900/30 p-4 rounded-2xl border border-slate-150 dark:border-zinc-800/60 max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800/50">
                        {req.comments.map((cmt: any) => (
                          <div key={cmt.id} className="text-left pt-2 first:pt-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold dark:text-zinc-200">
                                {cmt.author.name}
                              </span>
                              <span className="text-[8px] text-zinc-500">
                                {new Date(cmt.createdAt).toLocaleDateString("en-IN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-600 dark:text-zinc-350 mt-0.5">
                              {cmt.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Input
                        placeholder="Offer help / reply..."
                        value={commentInputs[req.id] || ""}
                        onChange={(e) =>
                          setCommentInputs({ ...commentInputs, [req.id]: e.target.value })
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleComment(req.id);
                        }}
                        className="rounded-xl text-[10px] bg-slate-50 dark:bg-zinc-800 h-8"
                      />
                      <Button
                        onClick={() => handleComment(req.id)}
                        className="rounded-xl bg-emerald-600 text-white px-3 h-8 text-[10px]"
                      >
                        Send
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
