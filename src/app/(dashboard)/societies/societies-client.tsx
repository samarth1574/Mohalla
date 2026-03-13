"use client";

import React, { useState, useTransition, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building, 
  Users, 
  Megaphone, 
  MessageSquare, 
  CheckCircle, 
  Plus, 
  Loader2, 
  Send, 
  ShieldAlert, 
  UserCheck, 
  Check, 
  X, 
  Camera, 
  Lock 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  joinSocietyAction, 
  approveVerificationRequestAction, 
  rejectVerificationRequestAction, 
  createSocietyAnnouncementAction, 
  sendChatMessageAction 
} from "@/app/actions/societies";

interface SocietiesClientProps {
  currentUser: {
    id: string;
    name: string;
    avatar: string;
    societyId: string | null;
    societyVerified: boolean;
    isAdmin: boolean;
  };
  societyDetails: any;
  chatGroup: any;
  pendingRequests: any[];
  otherSocieties: any[];
  hasActiveRequest: boolean;
}

export function SocietiesClient({
  currentUser,
  societyDetails,
  chatGroup,
  pendingRequests,
  otherSocieties,
  hasActiveRequest,
}: SocietiesClientProps) {
  const [activeTab, setActiveTab] = useState<"announcements" | "roster" | "chat" | "admin">("announcements");
  const [isPending, startTransition] = useTransition();
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Join request state
  const [selectedJoinSocId, setSelectedJoinSocId] = useState<string | null>(null);
  const [docUrl, setDocUrl] = useState("");

  // Admin announcement state
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");

  // Chat state
  const [chatInput, setChatInput] = useState("");
  const [localMessages, setLocalMessages] = useState<any[]>(chatGroup?.messages || []);

  useEffect(() => {
    if (chatGroup?.messages) {
      setLocalMessages(chatGroup.messages);
    }
  }, [chatGroup]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (activeTab === "chat" && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeTab, localMessages]);

  const handleJoinRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJoinSocId) return;

    startTransition(async () => {
      try {
        const result = await joinSocietyAction(selectedJoinSocId, docUrl.trim() ? docUrl : undefined);
        if (result.success) {
          setSelectedJoinSocId(null);
          setDocUrl("");
          alert(result.message);
          window.location.reload(); // refresh page data
        }
      } catch (err: any) {
        alert(err.message || "Failed to join society.");
      }
    });
  };

  const handleApprove = (reqId: string) => {
    startTransition(async () => {
      try {
        const result = await approveVerificationRequestAction(reqId);
        if (result.success) {
          alert("Residency verified successfully!");
        }
      } catch (err: any) {
        alert(err.message);
      }
    });
  };

  const handleReject = (reqId: string) => {
    const reason = prompt("Enter reason for rejection (optional):") || undefined;
    startTransition(async () => {
      try {
        const result = await rejectVerificationRequestAction(reqId, reason);
        if (result.success) {
          alert("Verification request rejected.");
        }
      } catch (err: any) {
        alert(err.message);
      }
    });
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;

    startTransition(async () => {
      try {
        const result = await createSocietyAnnouncementAction(currentUser.societyId!, annTitle, annContent);
        if (result.success) {
          setAnnTitle("");
          setAnnContent("");
          alert("Announcement published successfully!");
        }
      } catch (err: any) {
        alert(err.message);
      }
    });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !chatGroup) return;

    const text = chatInput;
    setChatInput("");

    // Optimistic Update
    const mockMessage = {
      id: Math.random().toString(),
      content: text,
      createdAt: new Date(),
      sender: {
        name: currentUser.name,
        avatar: currentUser.avatar,
      },
      senderId: currentUser.id,
    };

    setLocalMessages([...localMessages, mockMessage]);

    try {
      await sendChatMessageAction(chatGroup.id, text);
    } catch (err: any) {
      console.error(err);
    }
  };

  // Render join society screen if user has no society
  if (!currentUser.societyId) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 text-left">
        {/* Onboarding info */}
        <div className="p-8 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-slate-800 dark:text-zinc-200 space-y-3 relative overflow-hidden">
          <div className="absolute top-[-30px] right-[-30px] w-24 h-24 bg-emerald-500/20 rounded-full blur-xl pointer-events-none" />
          <Building className="w-12 h-12 text-emerald-500" />
          <h2 className="text-2xl font-black">Find Your Gated Community</h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed max-w-xl">
            Mohalla lets you link with specific apartment societies or gated layouts to view private bulletins, rosters, security logs, and coordinate neighbor meetups.
          </p>
        </div>

        {hasActiveRequest && (
          <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 bg-white/40 p-6 text-center space-y-3">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto" />
            <h4 className="text-base font-bold">Residency Verification Request Submitted</h4>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Your application is currently pending validation by the society administrators. Once approved, your society dashboard will unlock.
            </p>
          </Card>
        )}

        {/* List of nearby societies */}
        {!hasActiveRequest && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Available Societies in your Local Area</h3>
            {otherSocieties.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 dark:border-zinc-800 rounded-3xl text-slate-500 dark:text-zinc-500">
                <p className="text-sm font-semibold">No societies registered in this area yet.</p>
                <p className="text-xs mt-1">You can register a new society inside the onboarding wizard.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {otherSocieties.map((soc) => (
                  <Card
                    key={soc.id}
                    className="rounded-3xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm p-6 flex flex-col justify-between hover:border-slate-350 transition-all"
                  >
                    <div className="space-y-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <Building className="w-5 h-5" />
                      </div>
                      <h4 className="font-extrabold text-base">{soc.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                        {soc.description}
                      </p>
                      <Badge className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-350 text-[10px] font-bold">
                        {soc._count.members} Members
                      </Badge>
                    </div>

                    <div className="pt-6 border-t border-slate-100 dark:border-zinc-850 mt-6">
                      <Button
                        onClick={() => setSelectedJoinSocId(soc.id)}
                        className="w-full rounded-xl bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-bold text-xs"
                      >
                        Request to Join Resident Portal
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Join modal form */}
        <AnimatePresence>
          {selectedJoinSocId && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-md bg-white dark:bg-zinc-950 rounded-3xl border border-slate-200 dark:border-zinc-850 p-6 shadow-2xl space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-base">Submit Residency Verification</h4>
                  <button onClick={() => setSelectedJoinSocId(null)} className="p-1 text-slate-400 hover:text-red-500">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                  Society admins require a proof of residency (e.g. utility bill or lease agreement URL) to grant resident status.
                </p>

                <form onSubmit={handleJoinRequest} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      Proof Document URL (Utility bill, Rent deed, Maintenance card)
                    </label>
                    <div className="relative">
                      <Input
                        placeholder="Paste document image or PDF URL..."
                        value={docUrl}
                        onChange={(e) => setDocUrl(e.target.value)}
                        required
                        className="pl-10 rounded-xl bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800"
                      />
                      <Camera className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setSelectedJoinSocId(null)}
                      className="rounded-full"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                    >
                      {isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Submit Request"
                      )}
                    </Button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Render Portal if joined
  return (
    <div className="space-y-6 text-left">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black">{societyDetails?.name}</h1>
              <Badge
                className={
                  currentUser.societyVerified
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[9px] font-bold"
                    : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20 text-[9px] font-bold"
                }
              >
                {currentUser.societyVerified ? "Verified Residency" : "Verification Pending"}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              {societyDetails?.description}
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-1.5 bg-slate-100 dark:bg-zinc-950 p-1 rounded-xl self-start md:self-center">
          {[
            { label: "Announcements", value: "announcements", icon: Megaphone },
            { label: "Residents Roster", value: "roster", icon: Users },
            { label: "Society Chat", value: "chat", icon: MessageSquare },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value as any)}
              className={`px-3 py-2 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                activeTab === tab.value
                  ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-slate-500 dark:text-zinc-450 hover:text-slate-700"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
          {currentUser.isAdmin && (
            <button
              onClick={() => setActiveTab("admin")}
              className={`px-3 py-2 text-xs font-bold rounded-lg transition ${
                activeTab === "admin"
                  ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Admin Controls
            </button>
          )}
        </div>
      </div>

      {/* Main portal space */}
      <div className="min-h-[400px]">
        {/* Tab 1: Announcements */}
        {activeTab === "announcements" && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold">Official Announcements Bulletin</h3>
            {societyDetails?.announcements.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-slate-200 dark:border-zinc-800 rounded-3xl text-slate-500 dark:text-zinc-500">
                <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-60" />
                <p className="text-sm font-semibold">No announcements posted yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {societyDetails.announcements.map((ann: any) => (
                  <Card key={ann.id} className="rounded-3xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>{ann.author.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xs font-bold">{ann.author.name}</p>
                        <p className="text-[9px] text-zinc-500">
                          {new Date(ann.createdAt).toLocaleDateString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-extrabold text-base">{ann.title}</h4>
                      <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                        {ann.content}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Roster */}
        {activeTab === "roster" && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold">Society Roster</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {societyDetails?.members.map((member: any) => (
                <Card
                  key={member.id}
                  className="rounded-3xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-9 h-9">
                      <AvatarFallback>{member.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="text-xs font-bold">{member.name}</p>
                      <span className="text-[10px] text-emerald-500 font-extrabold">★ {member.trustScore}</span>
                    </div>
                  </div>

                  {member.residentVerified && (
                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[8px] py-0 px-1.5 font-bold">
                      Verified
                    </Badge>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Realtime Chat */}
        {activeTab === "chat" && (
          <div className="max-w-3xl mx-auto">
            {!currentUser.societyVerified ? (
              <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 bg-white/40 p-8 text-center space-y-4">
                <Lock className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                <h3 className="text-xl font-bold">Chat room locked</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
                  Residency verification is required before joining the society group-chat. Please wait for the society admin to verify your utility proof.
                </p>
              </Card>
            ) : (
              <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow flex flex-col h-[550px]">
                {/* Messages log */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[460px]">
                  {localMessages.length === 0 ? (
                    <p className="text-xs text-zinc-500 text-center py-16">No messages in chat room. Say hi to your neighbors!</p>
                  ) : (
                    localMessages.map((msg) => {
                      const isSelf = msg.senderId === currentUser.id;

                      return (
                        <div
                          key={msg.id}
                          className={`flex items-start gap-2.5 max-w-[80%] ${isSelf ? "ml-auto flex-row-reverse" : ""}`}
                        >
                          <Avatar className="w-6.5 h-6.5">
                            <AvatarFallback>{msg.sender.name[0]}</AvatarFallback>
                          </Avatar>
                          <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                            isSelf 
                              ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-medium" 
                              : "bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200"
                          }`}>
                            {!isSelf && <p className="font-extrabold text-[9px] text-emerald-500 mb-1">{msg.sender.name}</p>}
                            <p>{msg.content}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Send action bar */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 rounded-b-3xl flex gap-2">
                  <Input
                    placeholder="Send message to society members..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="rounded-xl text-xs bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800"
                  />
                  <Button
                    type="submit"
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white w-10 h-10 p-0 flex items-center justify-center shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </Card>
            )}
          </div>
        )}

        {/* Tab 4: Admin Controls */}
        {activeTab === "admin" && currentUser.isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Post Announcement */}
            <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Megaphone className="w-4.5 h-4.5 text-emerald-500" />
                  <span>Publish Society Announcement</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Announcement Title</label>
                    <Input
                      placeholder="e.g. Utility Maintenance Schedule"
                      value={annTitle}
                      onChange={(e) => setAnnTitle(e.target.value)}
                      required
                      className="rounded-xl bg-slate-50 dark:bg-zinc-950"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Content</label>
                    <Textarea
                      placeholder="Describe the update (timings, impact, emergency contacts)..."
                      value={annContent}
                      onChange={(e) => setAnnContent(e.target.value)}
                      required
                      rows={4}
                      className="rounded-xl bg-slate-50 dark:bg-zinc-950 resize-none"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="w-full rounded-xl bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-bold text-xs"
                  >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Broadcast Announcement"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Pending Residency Requests */}
            <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <UserCheck className="w-4.5 h-4.5 text-emerald-500" />
                  <span>Review Resident Registrations</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-4">
                {pendingRequests.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic py-6 text-center">No pending residency registrations.</p>
                ) : (
                  pendingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-150 dark:border-zinc-850 flex items-center justify-between"
                    >
                      <div className="text-left space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback>{req.user.name[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-bold">{req.user.name}</span>
                        </div>
                        <p className="text-[10px] text-zinc-550 truncate max-w-[150px]">{req.user.email}</p>
                        {req.documentUrl && (
                          <a
                            href={req.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[9px] text-emerald-500 font-bold block hover:underline"
                          >
                            View Resident Proof URL
                          </a>
                        )}
                      </div>

                      <div className="flex gap-1.5 shrink-0">
                        <Button
                          onClick={() => handleApprove(req.id)}
                          className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white w-8 h-8 p-0"
                          title="Approve"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleReject(req.id)}
                          className="rounded-xl bg-red-600 hover:bg-red-500 text-white w-8 h-8 p-0"
                          title="Reject"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

          </div>
        )}
      </div>
    </div>
  );
}
