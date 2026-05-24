"use client";

import React, { useState, useTransition } from "react";
import { 
  ShieldAlert, 
  Flag, 
  MessageSquare, 
  Check, 
  X, 
  Loader2, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck,
  BarChart3,
  Users,
  TrendingUp,
  Activity,
  Download,
  Calendar,
  ShoppingBag,
  HeartHandshake
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { updateContentModerationStatusAction, resolveReportAction } from "@/app/actions/moderator";

interface ExtendedAnalytics {
  eventRSVPsCount: number;
  soldListingsCount: number;
  totalMessagesCount: number;
  recentMessagesCount: number;
  resolvedEmergenciesCount: number;
  sevenDaySignupCounts: Array<{ day: string; count: number }>;
}

interface AnalyticsData {
  dau: number;
  mau: number;
  sevenDayPostCounts: Array<{ day: string; count: number }>;
  contentSummary: {
    activeEmergencies: number;
    availableListings: number;
    openRequests: number;
    activeLostItems: number;
  };
  auditLog: Array<{
    id: string;
    type: 'POST' | 'LISTING';
    authorName: string;
    content: string;
    moderationStatus: string;
    moderationReason: string | null;
    createdAt: Date;
  }>;
  extendedAnalytics?: ExtendedAnalytics;
}

interface AdminClientProps {
  reports: any[];
  flaggedPosts: any[];
  flaggedListings: any[];
  analytics?: AnalyticsData;
}

export function AdminClient({ reports, flaggedPosts, flaggedListings, analytics }: AdminClientProps) {
  const [activeTab, setActiveTab] = useState<"reports" | "posts" | "listings" | "analytics">("reports");
  const [isPending, startTransition] = useTransition();
  const [auditLogItems, setAuditLogItems] = useState(analytics?.auditLog || []);

  const handleAuditAction = (id: string, type: 'POST' | 'LISTING', status: 'APPROVED' | 'QUARANTINED') => {
    const previousItems = [...auditLogItems];
    const itemIndex = auditLogItems.findIndex(item => item.id === id && item.type === type);
    
    if (itemIndex === -1) return;

    const updatedItems = [...auditLogItems];
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      moderationStatus: status
    };
    setAuditLogItems(updatedItems);

    startTransition(async () => {
      try {
        const result = await updateContentModerationStatusAction({
          targetType: type,
          targetId: id,
          status,
        });
        
        if (!result.success) {
          setAuditLogItems(previousItems);
          alert('Failed to update moderation status');
        }
      } catch (err: any) {
        setAuditLogItems(previousItems);
        alert(err.message || "Operation failed.");
      }
    });
  };

  const handleUpdateStatus = (
    targetType: "POST" | "LISTING",
    targetId: string,
    status: "APPROVED" | "QUARANTINED"
  ) => {
    startTransition(async () => {
      try {
        const result = await updateContentModerationStatusAction({
          targetType,
          targetId,
          status,
        });
        if (result.success) {
          alert(`Content ${status.toLowerCase()} successfully.`);
        }
      } catch (err: any) {
        alert(err.message || "Operation failed.");
      }
    });
  };

  const handleResolveReport = (reportId: string, action: "DISMISS" | "RESOLVE") => {
    startTransition(async () => {
      try {
        const result = await resolveReportAction(reportId, action);
        if (result.success) {
          alert(`Report marked as ${action.toLowerCase()}ed.`);
        }
      } catch (err: any) {
        alert(err.message || "Operation failed.");
      }
    });
  };

  // Task 7: Client-side CSV download exporter for moderation logs
  const handleExportCSV = () => {
    if (auditLogItems.length === 0) return;
    
    const headers = ["ID", "Type", "Author/Seller", "Content Preview", "Moderation Status", "Reason", "Created At"];
    const rows = auditLogItems.map(item => [
      item.id,
      item.type,
      item.authorName,
      item.content.replace(/"/g, '""'), // sanitize double quotes
      item.moderationStatus,
      item.moderationReason || "None",
      new Date(item.createdAt).toISOString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(row => row.map(cell => `"${cell}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mohalla_quarantine_audit_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // SOS resolution rate calculator helper
  const activeSOS = analytics?.contentSummary.activeEmergencies || 0;
  const resolvedSOS = analytics?.extendedAnalytics?.resolvedEmergenciesCount || 0;
  const totalSOS = activeSOS + resolvedSOS;
  const sosResolutionRate = totalSOS > 0 ? Math.round((resolvedSOS / totalSOS) * 100) : 100;

  return (
    <div className="space-y-6 text-left select-none">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white dark:bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-black flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-500" />
            <span>Moderator Dashboard</span>
          </h1>
          <p className="text-xs text-zinc-400">
            Review community flags, reported residents, and quarantined post lists.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex gap-1 bg-slate-800 dark:bg-zinc-950 p-1 rounded-xl">
          {[
            { label: "Reports", value: "reports", count: reports.length },
            { label: "Flagged Posts", value: "posts", count: flaggedPosts.length },
            { label: "Flagged Trade", value: "listings", count: flaggedListings.length },
            { label: "Analytics", value: "analytics", count: 0 },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value as any)}
              className={`px-3 py-2 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === tab.value
                  ? "bg-slate-700 dark:bg-zinc-900 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[9px] font-black">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-[300px]">
        {/* Tab 1: Reports */}
        {activeTab === "reports" && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Community Abuse & Spam Flags</h3>
            {reports.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 dark:border-zinc-800 rounded-3xl text-slate-500 dark:text-zinc-500 bg-white/50 dark:bg-zinc-900/10">
                <ShieldCheck className="w-10 h-10 mx-auto mb-3 opacity-60 text-emerald-500" />
                <p className="text-sm font-semibold">Clean inbox!</p>
                <p className="text-xs mt-1">No pending resident reports require moderation.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {reports.map((rep) => (
                  <Card key={rep.id} className="rounded-3xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Flag className="w-4 h-4 text-red-500 shrink-0" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Report against: {rep.reportedUser?.name || "Content"}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-sm dark:text-zinc-200">{rep.reason}</h4>
                      <p className="text-[10px] text-zinc-500">
                        Filed by: {rep.reporter.name} • Target Type: {rep.targetType} ({rep.targetId})
                      </p>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <Button
                        onClick={() => handleResolveReport(rep.id, "RESOLVE")}
                        size="sm"
                        className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-9 px-4 text-xs cursor-pointer"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Resolve
                      </Button>
                      <Button
                        onClick={() => handleResolveReport(rep.id, "DISMISS")}
                        variant="outline"
                        size="sm"
                        className="rounded-xl h-9 px-4 text-xs border-slate-200 dark:border-zinc-800 cursor-pointer"
                      >
                        Dismiss
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Flagged Posts */}
        {activeTab === "posts" && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Flagged Posts</h3>
            {flaggedPosts.length === 0 ? (
              <p className="text-xs text-zinc-500 italic py-6 text-center">No flagged or quarantined posts found.</p>
            ) : (
              <div className="grid gap-4">
                {flaggedPosts.map((post) => (
                  <Card key={post.id} className="rounded-3xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 flex flex-col justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-red-500/15 text-red-500 border border-red-500/20 text-[9px] font-black uppercase">
                          {post.moderationStatus}
                        </Badge>
                        <span className="text-[10px] text-zinc-500">Author: {post.author.name}</span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-zinc-350 leading-relaxed font-semibold italic bg-slate-50 dark:bg-zinc-950 p-3 rounded-xl">
                        "{post.content}"
                      </p>
                      {post.moderationReason && (
                        <p className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>Trigger Reason: {post.moderationReason}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 justify-end pt-2 border-t border-slate-100 dark:border-zinc-850">
                      <Button
                        onClick={() => handleUpdateStatus("POST", post.id, "APPROVED")}
                        size="sm"
                        className="rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-8 px-4 text-[10px] cursor-pointer"
                      >
                        Approve Post
                      </Button>
                      <Button
                        onClick={() => handleUpdateStatus("POST", post.id, "QUARANTINED")}
                        variant="destructive"
                        size="sm"
                        className="rounded-full font-bold h-8 px-4 text-[10px] cursor-pointer"
                      >
                        Quarantine Post
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Flagged Listings */}
        {activeTab === "listings" && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Flagged Marketplace Trades</h3>
            {flaggedListings.length === 0 ? (
              <p className="text-xs text-zinc-500 italic py-6 text-center">No flagged listings found.</p>
            ) : (
              <div className="grid gap-4">
                {flaggedListings.map((list) => (
                  <Card key={list.id} className="rounded-3xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 flex flex-col justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-yellow-500/15 text-yellow-500 border border-yellow-500/20 text-[9px] font-black uppercase">
                          {list.moderationStatus}
                        </Badge>
                        <span className="text-[10px] text-zinc-500">Seller: {list.seller.name} • Price: ₹{list.price}</span>
                      </div>
                      <h4 className="font-extrabold text-sm">{list.title}</h4>
                      <p className="text-xs text-slate-600 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-950 p-3 rounded-xl italic">
                        "{list.description}"
                      </p>
                      {list.moderationReason && (
                        <p className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>UPI scam risk description: {list.moderationReason}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 justify-end pt-2 border-t border-slate-100 dark:border-zinc-850">
                      <Button
                        onClick={() => handleUpdateStatus("LISTING", list.id, "APPROVED")}
                        size="sm"
                        className="rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-8 px-4 text-[10px] cursor-pointer"
                      >
                        Approve Trade
                      </Button>
                      <Button
                        onClick={() => handleUpdateStatus("LISTING", list.id, "QUARANTINED")}
                        variant="destructive"
                        size="sm"
                        className="rounded-full font-bold h-8 px-4 text-[10px] cursor-pointer"
                      >
                        Quarantine Trade
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Analytics */}
        {activeTab === "analytics" && analytics && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold">Platform Analytics</h3>
            
            {/* DAU and MAU metric cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">Daily Active Users</p>
                    <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{analytics.dau}</p>
                  </div>
                  <Users className="w-12 h-12 text-emerald-500 opacity-20" />
                </div>
              </Card>

              <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">Monthly Active Users</p>
                    <p className="text-4xl font-black text-blue-600 dark:text-blue-400 mt-2">{analytics.mau}</p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-blue-500 opacity-20" />
                </div>
              </Card>
            </div>

            {/* Task 7: Additional metric cards */}
            {analytics.extendedAnalytics && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 p-5 bg-white dark:bg-zinc-900/50 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Event RSVPs</p>
                    <p className="text-2xl font-black text-slate-800 dark:text-zinc-100 mt-1">{analytics.extendedAnalytics.eventRSVPsCount}</p>
                    <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">Total event interests</span>
                  </div>
                  <Calendar className="w-8 h-8 text-emerald-500 opacity-30 shrink-0" />
                </Card>

                <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 p-5 bg-white dark:bg-zinc-900/50 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sold Trade Items</p>
                    <p className="text-2xl font-black text-slate-800 dark:text-zinc-100 mt-1">{analytics.extendedAnalytics.soldListingsCount}</p>
                    <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">Completed transactions</span>
                  </div>
                  <ShoppingBag className="w-8 h-8 text-emerald-500 opacity-30 shrink-0" />
                </Card>

                <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 p-5 bg-white dark:bg-zinc-900/50 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Message Volume</p>
                    <p className="text-2xl font-black text-slate-800 dark:text-zinc-100 mt-1">{analytics.extendedAnalytics.totalMessagesCount}</p>
                    <span className="text-[9px] text-emerald-600 font-bold block mt-0.5">+{analytics.extendedAnalytics.recentMessagesCount} this week</span>
                  </div>
                  <MessageSquare className="w-8 h-8 text-emerald-500 opacity-30 shrink-0" />
                </Card>

                <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 p-5 bg-white dark:bg-zinc-900/50 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">SOS Resolution</p>
                    <p className="text-2xl font-black text-slate-800 dark:text-zinc-100 mt-1">{sosResolutionRate}%</p>
                    <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">{resolvedSOS} resolved / {totalSOS} total</span>
                  </div>
                  <HeartHandshake className="w-8 h-8 text-red-500 opacity-30 shrink-0" />
                </Card>
              </div>
            )}

            {/* Growth Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 7-day post activity bar chart */}
              <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6">
                <h4 className="font-bold text-sm mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  7-Day Post Activity
                </h4>
                <div className="flex items-end justify-between gap-2 h-32">
                  {analytics.sevenDayPostCounts.map((item, idx) => {
                    const maxCount = Math.max(...analytics.sevenDayPostCounts.map(d => d.count), 1);
                    const height = (item.count / maxCount) * 100;
                    
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                        <div className="flex-1 w-full flex items-end justify-center">
                          <div
                            className="w-full bg-gradient-to-t from-emerald-500 to-emerald-450 rounded-t-lg transition-all"
                            style={{ height: `${height}%` }}
                            title={`${item.count} posts`}
                          />
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-bold text-slate-600 dark:text-zinc-400">{item.day}</p>
                          <p className="text-[10px] text-slate-500 dark:text-zinc-500">{item.count}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Task 7: 7-day user signup growth chart */}
              <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6">
                <h4 className="font-bold text-sm mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  7-Day Resident Signups
                </h4>
                <div className="flex items-end justify-between gap-2 h-32">
                  {(analytics.extendedAnalytics?.sevenDaySignupCounts || []).map((item, idx) => {
                    const signupCounts = analytics.extendedAnalytics?.sevenDaySignupCounts || [];
                    const maxCount = Math.max(...signupCounts.map(d => d.count), 1);
                    const height = (item.count / maxCount) * 100;
                    
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                        <div className="flex-1 w-full flex items-end justify-center">
                          <div
                            className="w-full bg-gradient-to-t from-blue-500 to-blue-450 rounded-t-lg transition-all"
                            style={{ height: `${height}%` }}
                            title={`${item.count} signups`}
                          />
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-bold text-slate-600 dark:text-zinc-400">{item.day}</p>
                          <p className="text-[10px] text-slate-500 dark:text-zinc-500">{item.count}</p>
                        </div>
                      </div>
                    );
                  })}
                  {(!analytics.extendedAnalytics?.sevenDaySignupCounts || analytics.extendedAnalytics.sevenDaySignupCounts.length === 0) && (
                    <p className="text-xs text-slate-500 italic py-12 text-center w-full">Signup data unavailable.</p>
                  )}
                </div>
              </Card>
            </div>

            {/* Content summary indicators grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4 text-center">
                <p className="text-2xl font-black text-red-500">{analytics.contentSummary.activeEmergencies}</p>
                <p className="text-xs font-semibold text-slate-600 dark:text-zinc-400 mt-1">Active SOS</p>
              </Card>

              <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4 text-center">
                <p className="text-2xl font-black text-blue-500">{analytics.contentSummary.availableListings}</p>
                <p className="text-xs font-semibold text-slate-600 dark:text-zinc-400 mt-1">Marketplace</p>
              </Card>

              <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4 text-center">
                <p className="text-2xl font-black text-purple-500">{analytics.contentSummary.openRequests}</p>
                <p className="text-xs font-semibold text-slate-600 dark:text-zinc-400 mt-1">Open Requests</p>
              </Card>

              <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4 text-center">
                <p className="text-2xl font-black text-orange-500">{analytics.contentSummary.activeLostItems}</p>
                <p className="text-xs font-semibold text-slate-600 dark:text-zinc-400 mt-1">Lost & Found</p>
              </Card>
            </div>

            {/* AI Quarantine Audit Log */}
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="font-bold text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  AI Quarantine Audit Log (Last 100)
                </h4>
                
                {/* Task 7: CSV log download export button */}
                <button
                  onClick={handleExportCSV}
                  disabled={auditLogItems.length === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-250 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-bold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Logs</span>
                </button>
              </div>
              
              {auditLogItems.length === 0 ? (
                <p className="text-xs text-zinc-500 italic py-6 text-center">No flagged content in audit log.</p>
              ) : (
                <div className="space-y-3">
                  {auditLogItems.map((item) => {
                    const date = new Date(item.createdAt);
                    const formatted = date.toLocaleDateString('en-GB', { 
                      day: '2-digit', 
                      month: 'short', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'UTC'
                    }) + ' UTC';

                    return (
                      <Card key={`${item.type}-${item.id}`} className="rounded-2xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4">
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={`text-[9px] font-black uppercase ${
                                item.moderationStatus === 'QUARANTINED' 
                                  ? 'bg-red-500/15 text-red-500 border border-red-500/20'
                                  : 'bg-yellow-500/15 text-yellow-500 border border-yellow-500/20'
                              }`}>
                                {item.moderationStatus}
                              </Badge>
                              <Badge variant="outline" className="text-[9px] font-bold">
                                {item.type}
                              </Badge>
                              <span className="text-[10px] text-zinc-500">by {item.authorName}</span>
                            </div>
                            
                            <p className="text-xs text-slate-700 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-950 p-2 rounded-lg">
                              {item.content}
                            </p>
                            
                            <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                              {item.moderationReason && (
                                <span className="flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 text-red-500" />
                                  {item.moderationReason}
                                </span>
                              )}
                              <span>• {formatted}</span>
                            </div>
                          </div>

                          {/* Action buttons with optimistic UI */}
                          <div className="flex md:flex-col gap-2 shrink-0">
                            <Button
                              onClick={() => handleAuditAction(item.id, item.type, 'APPROVED')}
                              size="sm"
                              className="rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-8 px-4 text-[10px] cursor-pointer"
                              disabled={isPending}
                            >
                              Approve
                            </Button>
                            <Button
                              onClick={() => handleAuditAction(item.id, item.type, 'QUARANTINED')}
                              variant="destructive"
                              size="sm"
                              className="rounded-full font-bold h-8 px-4 text-[10px] cursor-pointer"
                              disabled={isPending}
                            >
                              Quarantine
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
