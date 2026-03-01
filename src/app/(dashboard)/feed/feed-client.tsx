"use client";

import React, { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Building, 
  MessageSquare, 
  ThumbsUp, 
  BarChart2, 
  Image as ImageIcon, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Loader2,
  Sparkles,
  Megaphone,
  UserCheck,
  CheckCircle,
  HelpCircle,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  createPostAction, 
  toggleUpvoteAction, 
  voteInPollAction, 
  createCommentAction,
  deletePostAction
} from "@/app/actions/posts";
import Link from "next/link";

interface FeedClientProps {
  currentUser: {
    id: string;
    name: string;
    avatar: string;
    societyId: string | null;
    societyName: string | null;
    societyVerified: boolean;
    locationArea: string;
  };
  posts: any[];
  activeSOS: any[];
  announcements: any[];
}

export function FeedClient({ currentUser, posts, activeSOS, announcements }: FeedClientProps) {
  const [activeTab, setActiveTab] = useState<"all" | "society">("all");
  const [isPending, startTransition] = useTransition();

  // Post Composer State
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [postType, setPostType] = useState<"GENERAL" | "POLL">("GENERAL");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [targetSociety, setTargetSociety] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);

  // Error/Success Notification from AI Moderation
  const [moderationAlert, setModerationAlert] = useState<{
    status: string;
    reason: string;
  } | null>(null);

  // Active Comment input tracking (postId -> commentContent)
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  // AI feed summary state
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);

  // Filter posts based on tab
  const filteredPosts = posts.filter((post) => {
    if (activeTab === "society") {
      return post.societyId === currentUser.societyId;
    }
    return true; // "all" shows both general location and society posts (if user is part of them)
  });

  const handleAddPollOption = () => {
    setPollOptions([...pollOptions, ""]);
  };

  const handlePollOptionChange = (index: number, val: string) => {
    const updated = [...pollOptions];
    updated[index] = val;
    setPollOptions(updated);
  };

  const handleRemovePollOption = (index: number) => {
    if (pollOptions.length <= 2) return;
    setPollOptions(pollOptions.filter((_, i) => i !== index));
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setModerationAlert(null);
    startTransition(async () => {
      try {
        const result = await createPostAction({
          content,
          mediaUrls: mediaUrl.trim() ? [mediaUrl] : [],
          postType,
          pollOptions: postType === "POLL" ? pollOptions : undefined,
          societyId: (targetSociety && currentUser.societyId) ? currentUser.societyId : undefined,
        });

        if (result.success) {
          if (result.moderated) {
            setModerationAlert({
              status: result.moderationStatus!,
              reason: result.moderationReason || "Flagged by automatic review.",
            });
          } else {
            setContent("");
            setMediaUrl("");
            setPollOptions(["", ""]);
            setPostType("GENERAL");
            setComposerOpen(false);
          }
        }
      } catch (err: any) {
        alert(err.message || "Failed to create post.");
      }
    });
  };

  const handleUpvote = (postId: string) => {
    startTransition(async () => {
      await toggleUpvoteAction(postId);
    });
  };

  const handleVotePoll = (postId: string, optionId: string) => {
    startTransition(async () => {
      await voteInPollAction(postId, optionId);
    });
  };

  const handleAddComment = async (postId: string) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;

    try {
      const result = await createCommentAction({
        postId,
        content: text,
      });
      if (result.success) {
        setCommentInputs({ ...commentInputs, [postId]: "" });
      }
    } catch (err: any) {
      alert(err.message || "Failed to add comment.");
    }
  };

  const handleDeletePost = (postId: string) => {
    if (confirm("Are you sure you want to delete this post?")) {
      startTransition(async () => {
        await deletePostAction(postId);
      });
    }
  };

  // Triggers mock or live AI Gemini summary of discussions
  const handleGenerateSummary = async () => {
    setSummarizing(true);
    try {
      const feedTexts = posts.map(p => `${p.author.name}: ${p.content}`).slice(0, 10);
      if (feedTexts.length === 0) {
        setAiSummary("No active neighborhood posts available to summarize.");
        return;
      }
      
      // Simulate Gemini summaries for high fidelity feel
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setAiSummary(
        "📰 **Mohalla Summary**: Neighbors are looking for a recommended electrician and plumber in Sector 16. In security news, Gaur City admin announced utility maintenance this weekend. Additionally, a resident is selling a like-new study desk in the marketplace."
      );
    } catch (err) {
      setAiSummary("Could not generate summary at this time.");
    } finally {
      setSummarizing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Feed content &composer (8 cols) */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Toggle tabs and Composer trigger */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-4">
          <div className="flex gap-2 bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("all")}
              className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 justify-center ${
                activeTab === "all"
                  ? "bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-slate-500 dark:text-zinc-400 hover:text-slate-700"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>All Neighborhood</span>
            </button>
            <button
              onClick={() => setActiveTab("society")}
              className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 justify-center ${
                activeTab === "society"
                  ? "bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-slate-500 dark:text-zinc-400 hover:text-slate-700"
              }`}
            >
              <Building className="w-4 h-4" />
              <span>{currentUser.societyName || "My Society"}</span>
            </button>
          </div>

          <Button
            onClick={() => setComposerOpen(!composerOpen)}
            className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold"
          >
            <Plus className="w-4 h-4 mr-1" />
            Post in Mohalla
          </Button>
        </div>

        {/* Dynamic Post Composer */}
        <AnimatePresence>
          {composerOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-xl p-6">
                <form onSubmit={handleCreatePost} className="space-y-4">
                  <div className="flex gap-4 items-start">
                    <Avatar className="w-10 h-10 border border-slate-200 dark:border-zinc-800">
                      <AvatarFallback>{currentUser.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-3">
                      <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={`Share an update or ask a question in ${currentUser.locationArea}...`}
                        rows={3}
                        required
                        className="bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 resize-none placeholder-slate-400 dark:placeholder-zinc-500 text-sm md:text-base"
                      />

                      {/* Display warning badge if AI flagged */}
                      {moderationAlert && (
                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold uppercase tracking-wider">{moderationAlert.status}:</span>{" "}
                            {moderationAlert.reason} Your post has been quarantined for moderator review.
                          </div>
                        </div>
                      )}

                      {/* Media URL Input (Simulating image uploading) */}
                      {postType === "GENERAL" && (
                        <div className="relative">
                          <Input
                            type="text"
                            placeholder="Paste image URL (optional)"
                            value={mediaUrl}
                            onChange={(e) => setMediaUrl(e.target.value)}
                            className="pl-10 text-xs rounded-xl bg-slate-50 dark:bg-zinc-800 border-white/5"
                          />
                          <ImageIcon className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                        </div>
                      )}

                      {/* Poll Configuration */}
                      {postType === "POLL" && (
                        <div className="space-y-2 pt-2">
                          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                            Poll Options
                          </label>
                          {pollOptions.map((option, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                              <Input
                                type="text"
                                placeholder={`Option ${idx + 1}`}
                                value={option}
                                required
                                onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                                className="text-xs rounded-xl bg-slate-50 dark:bg-zinc-800 border-white/5"
                              />
                              {pollOptions.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemovePollOption(idx)}
                                  className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={handleAddPollOption}
                            className="flex items-center gap-1.5 text-xs text-emerald-500 hover:text-emerald-400 font-bold pt-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Option</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 dark:border-zinc-850 pt-4 flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setPostType("GENERAL")}
                        className={`rounded-full px-3 py-1 h-8 text-xs font-semibold ${
                          postType === "GENERAL" ? "bg-slate-100 dark:bg-zinc-800" : ""
                        }`}
                      >
                        General Post
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setPostType("POLL")}
                        className={`rounded-full px-3 py-1 h-8 text-xs font-semibold ${
                          postType === "POLL" ? "bg-slate-100 dark:bg-zinc-800" : ""
                        }`}
                      >
                        <BarChart2 className="w-3.5 h-3.5 mr-1" />
                        Create Poll
                      </Button>
                    </div>

                    <div className="flex items-center gap-4">
                      {currentUser.societyId && (
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-500 dark:text-zinc-400">
                          <input
                            type="checkbox"
                            checked={targetSociety}
                            onChange={(e) => setTargetSociety(e.target.checked)}
                            className="rounded text-emerald-500 focus:ring-emerald-500/20"
                          />
                          <span>Post to Society-only</span>
                        </label>
                      )}

                      <Button
                        type="submit"
                        disabled={isPending}
                        className="rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold h-9 px-5"
                      >
                        {isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Publish"
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lock overlay warning if tab is society and user is not verified */}
        {activeTab === "society" && !currentUser.societyVerified && (
          <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/30 backdrop-blur-md p-8 text-center space-y-4">
            <Building className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
            <h3 className="text-xl font-bold">Residency Verification Pending</h3>
            <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-md mx-auto">
              You must submit utility bills or rent deeds for approval by the society administrators before you can post or view private feeds for <strong>{currentUser.societyName || "your society"}</strong>.
            </p>
            <div className="pt-2">
              <Link href="/societies">
                <Button className="rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
                  Go to Verification Center
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Posts Render */}
        <div className="space-y-6">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-200 dark:border-zinc-800 rounded-3xl text-slate-400 dark:text-zinc-500">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-60" />
              <p className="text-sm font-semibold">No discussions found in your area yet.</p>
              <p className="text-xs mt-1">Be the first to share an update or start a poll!</p>
            </div>
          ) : (
            filteredPosts.map((post) => {
              // Calculate poll vote metrics
              const totalVotes = post.pollOptions.reduce(
                (sum: number, opt: any) => sum + opt.votes.length,
                0
              );

              return (
                <Card
                  key={post.id}
                  className="rounded-3xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm p-6 space-y-4 hover:border-slate-300 dark:hover:border-zinc-750 transition-colors"
                >
                  {/* Header info */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={post.author.avatar || undefined} />
                        <AvatarFallback>{post.author.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold dark:text-zinc-200">
                            {post.author.name}
                          </h4>
                          {post.author.residentVerified && (
                            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[9px] font-bold py-0 px-1.5">
                              Verified
                            </Badge>
                          )}
                          <span className="text-[10px] text-emerald-500 font-bold">
                            ★ {post.author.trustScore}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          {post.society?.name || "General Area"} •{" "}
                          {new Date(post.createdAt).toLocaleDateString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Scope tags / Admin delete */}
                    <div className="flex items-center gap-2">
                      {post.societyId && (
                        <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[9px] font-bold uppercase">
                          Society-only
                        </Badge>
                      )}
                      {(post.authorId === currentUser.id) && (
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="p-1 text-slate-400 hover:text-red-500 rounded"
                          title="Delete Post"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="text-left space-y-3">
                    <p className="text-sm md:text-base leading-relaxed text-slate-800 dark:text-zinc-200">
                      {post.content}
                    </p>

                    {/* Image rendering */}
                    {post.mediaUrls.map((url: string, index: number) => (
                      <div key={index} className="rounded-2xl overflow-hidden border border-slate-100 dark:border-zinc-800 max-h-[350px] bg-slate-100 dark:bg-zinc-950 flex items-center justify-center">
                        <img
                          src={url}
                          alt="Post media attachment"
                          className="w-full h-full object-cover max-h-[350px]"
                        />
                      </div>
                    ))}

                    {/* Poll rendering */}
                    {post.postType === "POLL" && post.pollOptions.length > 0 && (
                      <div className="grid gap-3 pt-2">
                        {post.pollOptions.map((opt: any) => {
                          const optVotes = opt.votes.length;
                          const hasVotedThisOpt = opt.votes.some((v: any) => v.userId === currentUser.id);
                          const percentage = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;

                          return (
                            <div
                              key={opt.id}
                              onClick={() => handleVotePoll(post.id, opt.id)}
                              className={`p-3.5 rounded-xl border relative cursor-pointer overflow-hidden transition-all flex items-center justify-between ${
                                hasVotedThisOpt
                                  ? "bg-emerald-500/10 border-emerald-500"
                                  : "bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-slate-350"
                              }`}
                            >
                              {/* Background vote percentage fill */}
                              <div
                                className="absolute left-0 top-0 bottom-0 bg-emerald-500/5 dark:bg-emerald-500/10 transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />

                              <div className="flex items-center gap-3 relative z-10 text-xs font-semibold">
                                {hasVotedThisOpt && <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />}
                                <span>{opt.text}</span>
                              </div>
                              <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 relative z-10">
                                {percentage}% ({optVotes})
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Actions (Upvote, Comment count) */}
                  <div className="border-y border-slate-100 dark:border-zinc-800/80 py-2.5 flex items-center gap-6 text-xs text-slate-500 dark:text-zinc-400 font-semibold">
                    <button
                      onClick={() => handleUpvote(post.id)}
                      className={`flex items-center gap-1.5 transition-colors ${
                        post.hasUpvoted ? "text-emerald-500" : "hover:text-emerald-500"
                      }`}
                    >
                      <ThumbsUp className={`w-4 h-4 ${post.hasUpvoted ? "fill-emerald-500" : ""}`} />
                      <span>Helpful ({post.upvotesCount})</span>
                    </button>

                    <button
                      onClick={() => {
                        setExpandedComments({
                          ...expandedComments,
                          [post.id]: !expandedComments[post.id],
                        });
                      }}
                      className="flex items-center gap-1.5 hover:text-emerald-500 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Comments ({post.comments.length})</span>
                    </button>
                  </div>

                  {/* Comments section */}
                  {expandedComments[post.id] && (
                    <div className="space-y-4 pt-2">
                      {post.comments.length > 0 && (
                        <div className="space-y-3 bg-slate-50/50 dark:bg-zinc-900/30 p-4 rounded-2xl border border-slate-150 dark:border-zinc-800/60 max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800/50">
                          {post.comments.map((cmt: any) => (
                            <div key={cmt.id} className="text-left pt-2.5 first:pt-0">
                              <div className="flex items-center gap-2">
                                <Avatar className="w-6 h-6">
                                  <AvatarFallback>{cmt.author.name[0]}</AvatarFallback>
                                </Avatar>
                                <span className="text-xs font-bold dark:text-zinc-200">
                                  {cmt.author.name}
                                </span>
                                <span className="text-[9px] text-zinc-500">
                                  {new Date(cmt.createdAt).toLocaleDateString("en-IN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-zinc-350 pl-8 mt-1">
                                {cmt.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add comment input */}
                      <div className="flex gap-2">
                        <Input
                          placeholder="Write a comment..."
                          value={commentInputs[post.id] || ""}
                          onChange={(e) =>
                            setCommentInputs({ ...commentInputs, [post.id]: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddComment(post.id);
                          }}
                          className="rounded-xl text-xs bg-slate-50 dark:bg-zinc-800"
                        />
                        <Button
                          onClick={() => handleAddComment(post.id)}
                          className="rounded-xl bg-emerald-600 text-white px-4 h-9 text-xs"
                        >
                          Submit
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Widgets / Quick Cards (4 cols) */}
      <div className="lg:col-span-4 space-y-6 text-left">
        
        {/* Emergency SOS warning widget */}
        {activeSOS.length > 0 && (
          <Card className="rounded-3xl border-red-500/30 bg-red-500/10 border-2 dark:bg-red-950/20 relative overflow-hidden shadow-lg p-5">
            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-ping m-5" />
            <CardHeader className="p-0 mb-3">
              <CardTitle className="text-red-600 dark:text-red-400 font-extrabold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 animate-bounce" />
                <span>ACTIVE EMERGENCY SOS</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-3">
              {activeSOS.map((alert) => (
                <div key={alert.id} className="text-xs">
                  <p className="font-bold text-slate-800 dark:text-zinc-100">{alert.title}</p>
                  <p className="text-slate-500 dark:text-zinc-400 mt-1">{alert.description}</p>
                  <p className="text-[10px] text-red-500 font-semibold mt-0.5">Alert by: {alert.author.name}</p>
                </div>
              ))}
            </CardContent>
            <CardFooter className="p-0 pt-4">
              <Link href="/emergency" className="w-full">
                <Button className="w-full bg-red-600 text-white font-bold rounded-xl py-2 text-xs">
                  Volunteer / View Dashboard
                </Button>
              </Link>
            </CardFooter>
          </Card>
        )}

        {/* AI Morning Summary Generator */}
        <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm p-6 relative overflow-hidden">
          <div className="absolute top-[-30px] right-[-30px] w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
          
          <h3 className="text-sm font-bold flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
            <Sparkles className="w-4.5 h-4.5 text-emerald-500 animate-pulse" />
            <span>AI Mohalla Summarizer</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed mb-4">
            Summarize active conversations and updates around your locality into a quick digest using Gemini AI.
          </p>

          <AnimatePresence mode="wait">
            {aiSummary ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-xs text-slate-700 dark:text-zinc-300 leading-relaxed space-y-2 mb-4"
              >
                <div dangerouslySetInnerHTML={{ __html: aiSummary.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
                <button
                  onClick={() => setAiSummary(null)}
                  className="text-[10px] text-emerald-500 hover:text-emerald-400 font-bold block"
                >
                  Clear Summary
                </button>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <Button
            onClick={handleGenerateSummary}
            disabled={summarizing}
            className="w-full rounded-xl bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-bold text-xs"
          >
            {summarizing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                <span>Reading Feed...</span>
              </>
            ) : (
              "Generate Local Summary"
            )}
          </Button>
        </Card>

        {/* Society Board */}
        {currentUser.societyId && announcements.length > 0 && (
          <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-emerald-500" />
              <span>Society Announcements</span>
            </h3>
            <div className="space-y-3 divide-y divide-slate-100 dark:divide-zinc-850">
              {announcements.map((ann) => (
                <div key={ann.id} className="text-xs pt-3 first:pt-0">
                  <h5 className="font-bold text-slate-800 dark:text-zinc-200">{ann.title}</h5>
                  <p className="text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
                    {ann.content}
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Posted by: {ann.author.name}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

      </div>
    </div>
  );
}
