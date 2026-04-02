"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Briefcase, 
  Plus, 
  Loader2, 
  Search, 
  Coins, 
  Mail, 
  User, 
  ChevronDown, 
  Check, 
  Eye, 
  FileText 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createJobListingAction, applyForJobAction } from "@/app/actions/marketplace";

interface JobsClientProps {
  currentUserId: string;
  jobs: any[];
}

const JOB_CATEGORIES = [
  { label: "All Jobs", value: "ALL" },
  { label: "Internships", value: "Internship" },
  { label: "Tutors", value: "Tutor" },
  { label: "Drivers", value: "Driver" },
  { label: "Maids / Helpers", value: "Maid" },
  { label: "Part-Time", value: "Part-time" },
  { label: "Other Jobs", value: "Other" },
];

export function JobsClient({ currentUserId, jobs }: JobsClientProps) {
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [composerOpen, setComposerOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Create Job Listing state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [salary, setSalary] = useState("");
  const [category, setCategory] = useState("Internship");

  // Apply dialog state
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");

  // Employer applications preview tracking (jobId -> true/false)
  const [previewAppsJobId, setPreviewAppsJobId] = useState<string | null>(null);

  const filteredJobs = jobs.filter((job) => {
    if (selectedCategory === "ALL") return true;
    return job.category === selectedCategory;
  });

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    startTransition(async () => {
      try {
        const result = await createJobListingAction({
          title,
          description,
          category,
          salary: salary.trim() ? salary : undefined,
        });

        if (result.success) {
          setTitle("");
          setDescription("");
          setSalary("");
          setCategory("Internship");
          setComposerOpen(false);
        }
      } catch (err: any) {
        alert(err.message || "Failed to create job posting.");
      }
    });
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingJobId) return;

    startTransition(async () => {
      try {
        const result = await applyForJobAction({
          jobId: applyingJobId,
          coverLetter: coverLetter.trim() ? coverLetter : undefined,
          resumeUrl: resumeUrl.trim() ? resumeUrl : undefined,
        });

        if (result.success) {
          setCoverLetter("");
          setResumeUrl("");
          setApplyingJobId(null);
          alert("Application submitted successfully!");
        }
      } catch (err: any) {
        alert(err.message || "Failed to apply.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-4 text-left">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Mohalla Jobs Board</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Find local internships, helper gigs, tutors, drivers, or housekeepers inside your community.
          </p>
        </div>
        <Button
          onClick={() => setComposerOpen(!composerOpen)}
          className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold"
        >
          <Plus className="w-4 h-4 mr-1" />
          Post a Vacancy
        </Button>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {JOB_CATEGORIES.map((cat) => (
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

      {/* Compose Form */}
      <AnimatePresence>
        {composerOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-xl p-6 text-left">
              <form onSubmit={handleCreateJob} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                      Job / Gig Title
                    </label>
                    <Input
                      placeholder="e.g. Part-time Algebra Tutor for Middle School"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      className="rounded-xl bg-slate-50 dark:bg-zinc-800"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                      Salary / Pay Rate (Optional)
                    </label>
                    <Input
                      placeholder="e.g. ₹5,000/month or ₹500/hour"
                      value={salary}
                      onChange={(e) => setSalary(e.target.value)}
                      className="rounded-xl bg-slate-50 dark:bg-zinc-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                      Job Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-white/10 bg-slate-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    >
                      <option value="Internship">Internship</option>
                      <option value="Tutor">Home Tutor</option>
                      <option value="Driver">Driver</option>
                      <option value="Maid">Maid / Housekeeping</option>
                      <option value="Part-time">Part-time Gig</option>
                      <option value="Other">Other Category</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    Job Description & Requirements
                  </label>
                  <Textarea
                    placeholder="Provide details about role responsibilities, timing, duration, skills, and qualifications..."
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
                      "Post Job Vacancy"
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Application Dialog Modal */}
      <AnimatePresence>
        {applyingJobId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-2xl space-y-4 text-left"
            >
              <h3 className="text-lg font-extrabold tracking-tight">Apply for Local Opening</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Submit a brief pitch to the neighborhood employer. They will receive an instant push notification alert.
              </p>

              <form onSubmit={handleApply} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    Cover Letter / Pitch
                  </label>
                  <Textarea
                    placeholder="Briefly explain your suitability, availability, and past experience..."
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    required
                    rows={4}
                    className="rounded-xl bg-slate-50 dark:bg-zinc-900 resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    Resume / Portfolio Link (Optional)
                  </label>
                  <Input
                    placeholder="Paste a Google Drive or LinkedIn link"
                    value={resumeUrl}
                    onChange={(e) => setResumeUrl(e.target.value)}
                    className="rounded-xl bg-slate-50 dark:bg-zinc-900"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setApplyingJobId(null)}
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
                      "Submit Application"
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Grid of Listings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
        {filteredJobs.length === 0 ? (
          <div className="md:col-span-2 text-center py-20 border border-dashed border-slate-200 dark:border-zinc-800 rounded-3xl text-slate-400 dark:text-zinc-500">
            <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-60" />
            <p className="text-sm font-semibold">No job vacancies listed here.</p>
            <p className="text-xs mt-1">Check back later or post an helper gig openings!</p>
          </div>
        ) : (
          filteredJobs.map((job) => {
            const hasApplied = job.applications.some((app: any) => app.applicantId === currentUserId);
            const isEmployer = job.employerId === currentUserId;

            return (
              <Card
                key={job.id}
                className="rounded-3xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm p-6 space-y-4 hover:border-slate-350 dark:hover:border-zinc-750 transition-colors flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Employer Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>{job.employer.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xs font-bold">{job.employer.name}</p>
                        <p className="text-[9px] text-zinc-500">{job.employer.societyName || "Resident"}</p>
                      </div>
                    </div>

                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[9px] font-bold">
                      {job.category}
                    </Badge>
                  </div>

                  {/* Details */}
                  <div className="space-y-1">
                    <h3 className="text-base font-extrabold tracking-tight">
                      {job.title}
                    </h3>
                    {job.salary && (
                      <p className="text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5" />
                        <span>Compensation: {job.salary}</span>
                      </p>
                    )}
                    <p className="text-xs text-slate-600 dark:text-zinc-350 leading-relaxed pt-1">
                      {job.description}
                    </p>
                  </div>
                </div>

                {/* Apply/Employer View */}
                <div className="border-t border-slate-100 dark:border-zinc-850 pt-4 mt-4 space-y-4">
                  <Link
                    href={`/jobs/${job.id}`}
                    className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 transition hover:border-emerald-500/30 hover:text-emerald-600 dark:border-zinc-800 dark:text-zinc-300 dark:hover:text-emerald-400"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View Details
                  </Link>
                  {isEmployer ? (
                    <div className="space-y-3">
                      <Button
                        onClick={() =>
                          setPreviewAppsJobId(previewAppsJobId === job.id ? null : job.id)
                        }
                        variant="outline"
                        className="w-full rounded-xl flex items-center justify-between h-9 text-xs border-slate-200 dark:border-zinc-800 font-semibold"
                      >
                        <span>View Applicants ({job.applications.length})</span>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </Button>

                      {previewAppsJobId === job.id && (
                        <div className="space-y-3 pt-2 bg-slate-50/50 dark:bg-zinc-950/40 p-4 rounded-2xl border border-slate-150 dark:border-zinc-850">
                          {job.applications.length === 0 ? (
                            <p className="text-[10px] text-zinc-500 text-center py-2">No applications received yet.</p>
                          ) : (
                            job.applications.map((app: any, idx: number) => (
                              <div key={idx} className="text-left space-y-1.5 pb-3 border-b border-slate-200/50 dark:border-zinc-850 last:border-b-0 last:pb-0">
                                <div className="flex items-center gap-2">
                                  <Avatar className="w-5 h-5">
                                    <AvatarFallback>{app.applicant.name[0]}</AvatarFallback>
                                  </Avatar>
                                  <span className="text-[10px] font-bold dark:text-zinc-200">
                                    {app.applicant.name}
                                  </span>
                                  <span className="text-[9px] text-zinc-500 flex items-center gap-0.5">
                                    <Mail className="w-3 h-3 text-slate-400" />
                                    {app.applicant.email}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-600 dark:text-zinc-400 pl-7 italic leading-relaxed">
                                  "{app.coverLetter}"
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Button
                      disabled={hasApplied}
                      onClick={() => setApplyingJobId(job.id)}
                      className={`w-full rounded-xl font-bold h-9 text-xs flex items-center justify-center gap-1.5 ${
                        hasApplied
                          ? "bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-500"
                          : "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-950"
                      }`}
                    >
                      {hasApplied ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-500" />
                          <span>Applied</span>
                        </>
                      ) : (
                        <span>Apply For Gig</span>
                      )}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
