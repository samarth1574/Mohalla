"use client";

import { useState, useTransition } from "react";
import { Check, ExternalLink, Loader2, Mail, Send, UserRound } from "lucide-react";
import { applyForJobAction } from "@/app/actions/marketplace";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ApplicationPreview {
  id: string;
  coverLetter: string | null;
  resumeUrl: string | null;
  createdAt: string;
  applicant: {
    name: string | null;
    email: string;
    societyName: string | null;
    trustScore: number;
  };
}

interface JobDetailClientProps {
  jobId: string;
  isEmployer: boolean;
  hasApplied: boolean;
  applications: ApplicationPreview[];
}

export function JobDetailClient({ jobId, isEmployer, hasApplied, applications }: JobDetailClientProps) {
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [submitted, setSubmitted] = useState(hasApplied);
  const [isPending, startTransition] = useTransition();

  const handleApply = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!coverLetter.trim()) return;

    startTransition(async () => {
      try {
        const result = await applyForJobAction({
          jobId,
          coverLetter: coverLetter.trim(),
          resumeUrl: resumeUrl.trim() || undefined,
        });

        if (result.success) {
          setSubmitted(true);
          setCoverLetter("");
          setResumeUrl("");
        }
      } catch (error) {
        alert(error instanceof Error ? error.message : "Failed to submit application.");
      }
    });
  };

  if (isEmployer) {
    return (
      <Card className="rounded-3xl border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
        <h2 className="text-sm font-black">Applicants</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
          Review resident applications and contact them directly.
        </p>

        <div className="mt-4 space-y-3">
          {applications.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-xs text-slate-500 dark:border-zinc-800 dark:text-zinc-500">
              No applications yet.
            </p>
          ) : (
            applications.map((application) => (
              <div key={application.id} className="rounded-2xl bg-slate-50 p-4 dark:bg-zinc-950/60">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-emerald-600 dark:bg-zinc-900">
                    <UserRound className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black">{application.applicant.name || "Applicant"}</p>
                    <p className="truncate text-[10px] text-slate-500">
                      {application.applicant.societyName || "Local resident"} • Trust {application.applicant.trustScore}
                    </p>
                  </div>
                </div>
                {application.coverLetter && (
                  <p className="mt-3 text-xs leading-6 text-slate-600 dark:text-zinc-350">
                    {application.coverLetter}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={`mailto:${application.applicant.email}`}
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-[10px] font-bold text-white"
                  >
                    <Mail className="h-3 w-3" />
                    Email
                  </a>
                  {application.resumeUrl && (
                    <a
                      href={application.resumeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-[10px] font-bold dark:border-zinc-800"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Resume
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
      <h2 className="text-sm font-black">Apply locally</h2>
      <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
        Share a short pitch. The employer will receive an in-app notification.
      </p>

      {submitted ? (
        <div className="mt-4 rounded-2xl bg-emerald-500/10 p-4 text-sm font-bold text-emerald-700 dark:text-emerald-300">
          <Check className="mb-2 h-5 w-5" />
          Application submitted.
        </div>
      ) : (
        <form onSubmit={handleApply} className="mt-4 space-y-3">
          <Textarea
            value={coverLetter}
            onChange={(event) => setCoverLetter(event.target.value)}
            placeholder="Write your availability, experience, and why you are a good fit..."
            className="min-h-32 rounded-2xl bg-slate-50 dark:bg-zinc-950/60"
            required
          />
          <Input
            value={resumeUrl}
            onChange={(event) => setResumeUrl(event.target.value)}
            placeholder="Resume or portfolio link (optional)"
            className="rounded-2xl bg-slate-50 dark:bg-zinc-950/60"
          />
          <Button type="submit" disabled={isPending} className="w-full rounded-2xl bg-emerald-600 font-bold text-white hover:bg-emerald-500">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Submit application
          </Button>
        </form>
      )}
    </Card>
  );
}
